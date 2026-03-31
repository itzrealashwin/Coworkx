import sprintService from '../services/sprint.service.js';
import AppError from '../utils/AppError.js';

const createSprint = async (req, res, next) => {
  try {
    const sprint = await sprintService.createSprint({
      project: req.project,
      userId: req.user.id,
      body: req.body,
    });

    res.status(201).json({ success: true, sprint });
  } catch (error) {
    next(error);
  }
};

const listSprints = async (req, res, next) => {
  try {
    const sprints = await sprintService.listSprints({
      projectId: req.project.id,
      status: req.query.status,
    });

    res.status(200).json({ success: true, sprints });
  } catch (error) {
    next(error);
  }
};

const getSprint = async (req, res, next) => {
  try {
    const sprint = await sprintService.getSprintById({
      sprintId: req.params.sprintId,
      projectId: req.project.id,
    });

    if (!sprint) {
      throw new AppError('Sprint not found.', 404, 'SPRINT_NOT_FOUND');
    }

    res.status(200).json({ success: true, sprint });
  } catch (error) {
    next(error);
  }
};

const updateSprint = async (req, res, next) => {
  try {
    const sprint = await sprintService.updateSprint({
      sprintId: req.params.sprintId,
      projectId: req.project.id,
      body: req.body,
    });

    res.status(200).json({ success: true, sprint });
  } catch (error) {
    next(error);
  }
};

const startSprint = async (req, res, next) => {
  try {
    const sprint = await sprintService.startSprint({
      sprintId: req.params.sprintId,
      projectId: req.project.id,
    });

    res.status(200).json({ success: true, sprint });
  } catch (error) {
    next(error);
  }
};

const completeSprint = async (req, res, next) => {
  try {
    const { moveUnfinishedTo } = req.body;

    if (!moveUnfinishedTo) {
      throw new AppError('moveUnfinishedTo is required (backlog | sprintId).', 400, 'VALIDATION_ERROR');
    }

    const result = await sprintService.completeSprint({
      sprintId: req.params.sprintId,
      projectId: req.project.id,
      moveUnfinishedTo,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const deleteSprint = async (req, res, next) => {
  try {
    await sprintService.deleteSprint({
      sprintId: req.params.sprintId,
      projectId: req.project.id,
    });

    res.status(200).json({ success: true, message: 'Sprint deleted.' });
  } catch (error) {
    next(error);
  }
};

export default {
  createSprint,
  listSprints,
  getSprint,
  updateSprint,
  startSprint,
  completeSprint,
  deleteSprint,
};
