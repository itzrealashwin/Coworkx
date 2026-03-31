import { prisma } from '../config/db.js';
import AppError from '../utils/AppError.js';

const sprintWithIssues = {
  issues: {
    where: { deletedAt: null },
    include: {
      status: {
        select: {
          id: true,
          name: true,
          category: true,
          color: true,
        },
      },
      assignee: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      number: 'asc',
    },
  },
  creator: {
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
    },
  },
};

const findSprintOrThrow = async (sprintId, projectId) => {
  const sprint = await prisma.sprint.findFirst({
    where: {
      id: sprintId,
      projectId,
    },
  });

  if (!sprint) {
    throw new AppError('Sprint not found.', 404, 'SPRINT_NOT_FOUND');
  }

  return sprint;
};

const createSprint = async ({ project, userId, body }) => {
  const { name, goal, startDate, endDate } = body;

  if (!name?.trim()) {
    throw new AppError('Sprint name is required.', 400, 'VALIDATION_ERROR');
  }

  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    throw new AppError('startDate must be before endDate.', 400, 'VALIDATION_ERROR');
  }

  return prisma.sprint.create({
    data: {
      projectId: project.id,
      name: name.trim(),
      goal: goal?.trim() || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: 'planned',
      createdBy: userId,
    },
    include: sprintWithIssues,
  });
};

const listSprints = async ({ projectId, status }) => {
  return prisma.sprint.findMany({
    where: {
      projectId,
      ...(status ? { status } : {}),
    },
    include: {
      creator: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          issues: {
            where: {
              deletedAt: null,
            },
          },
        },
      },
    },
    orderBy: [{ status: 'asc' }, { startDate: 'asc' }, { createdAt: 'asc' }],
  });
};

const getSprintById = async ({ sprintId, projectId }) => {
  return prisma.sprint.findFirst({
    where: {
      id: sprintId,
      projectId,
    },
    include: sprintWithIssues,
  });
};

const updateSprint = async ({ sprintId, projectId, body }) => {
  const sprint = await findSprintOrThrow(sprintId, projectId);

  if (sprint.status === 'completed') {
    throw new AppError('Cannot update a completed sprint.', 400, 'SPRINT_COMPLETED');
  }

  const { name, goal, startDate, endDate } = body;

  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    throw new AppError('startDate must be before endDate.', 400, 'VALIDATION_ERROR');
  }

  return prisma.sprint.update({
    where: { id: sprintId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(goal !== undefined && { goal: goal?.trim() || null }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
    },
    include: sprintWithIssues,
  });
};

const startSprint = async ({ sprintId, projectId }) => {
  const sprint = await findSprintOrThrow(sprintId, projectId);

  if (sprint.status !== 'planned') {
    throw new AppError(
      sprint.status === 'active'
        ? 'Sprint is already active.'
        : 'Cannot start a completed sprint.',
      400,
      'INVALID_SPRINT_STATE'
    );
  }

  const activeSprint = await prisma.sprint.findFirst({
    where: {
      projectId,
      status: 'active',
    },
  });

  if (activeSprint) {
    throw new AppError(
      `Sprint "${activeSprint.name}" is already active. Complete it before starting a new one.`,
      409,
      'ACTIVE_SPRINT_EXISTS'
    );
  }

  return prisma.sprint.update({
    where: { id: sprintId },
    data: {
      status: 'active',
      startDate: sprint.startDate ?? new Date(),
    },
    include: sprintWithIssues,
  });
};

const completeSprint = async ({ sprintId, projectId, moveUnfinishedTo }) => {
  const sprint = await findSprintOrThrow(sprintId, projectId);

  if (sprint.status !== 'active') {
    throw new AppError('Only an active sprint can be completed.', 400, 'INVALID_SPRINT_STATE');
  }

  const unfinishedIssues = await prisma.issue.findMany({
    where: {
      sprintId,
      deletedAt: null,
      status: {
        category: {
          not: 'done',
        },
      },
    },
    select: {
      id: true,
    },
  });

  const unfinishedIds = unfinishedIssues.map((issue) => issue.id);

  let destinationSprintId = null;
  if (moveUnfinishedTo !== 'backlog') {
    const targetSprint = await prisma.sprint.findFirst({
      where: {
        id: moveUnfinishedTo,
        projectId,
        status: {
          not: 'completed',
        },
      },
    });

    if (!targetSprint) {
      throw new AppError('Target sprint not found or already completed.', 404, 'TARGET_SPRINT_NOT_FOUND');
    }

    destinationSprintId = targetSprint.id;
  }

  const [completedSprint] = await prisma.$transaction([
    prisma.sprint.update({
      where: { id: sprintId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            issues: true,
          },
        },
        creator: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    }),
    ...(unfinishedIds.length > 0
      ? [
          prisma.issue.updateMany({
            where: {
              id: {
                in: unfinishedIds,
              },
            },
            data: {
              sprintId: destinationSprintId,
            },
          }),
        ]
      : []),
  ]);

  return {
    sprint: completedSprint,
    movedIssuesCount: unfinishedIds.length,
    movedTo: moveUnfinishedTo,
  };
};

const deleteSprint = async ({ sprintId, projectId }) => {
  const sprint = await findSprintOrThrow(sprintId, projectId);

  if (sprint.status !== 'planned') {
    throw new AppError(
      'Only planned sprints can be deleted. Complete or reassign the active sprint first.',
      400,
      'INVALID_SPRINT_STATE'
    );
  }

  await prisma.$transaction([
    prisma.issue.updateMany({
      where: {
        sprintId,
      },
      data: {
        sprintId: null,
      },
    }),
    prisma.sprint.delete({
      where: {
        id: sprintId,
      },
    }),
  ]);
};

export default {
  createSprint,
  listSprints,
  getSprintById,
  updateSprint,
  startSprint,
  completeSprint,
  deleteSprint,
};
