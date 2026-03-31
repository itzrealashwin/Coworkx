import { prisma } from "../config/db.js";
import AppError from "../utils/AppError.js";

const requireProjectAccess = async (req, res, next) => {
  try {
    const { slug, projectSlug } = req.params;

    const org = await prisma.organization.findUnique({
      where: { slug },
    });

    if (!org || org.deletedAt) {
      throw new AppError("Organization not found.", 404, "ORG_NOT_FOUND");
    }

    const orgMember = await prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId: org.id,
          userId: req.user.id,
        },
      },
      include: {
        user: true,
      },
    });

    if (!orgMember || orgMember.removedAt) {
      throw new AppError(
        "Not a member of this organization.",
        403,
        "ORG_ACCESS_DENIED",
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        orgId: org.id,
        slug: projectSlug,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new AppError("Project not found.", 404, "PROJECT_NOT_FOUND");
    }

    req.org = org;
    req.orgMember = orgMember;
    req.project = project;

    next();
  } catch (error) {
    next(error);
  }
};

export { requireProjectAccess };
