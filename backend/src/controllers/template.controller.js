import { prisma } from "../db/db.js";

const getOrgId = (req) =>
  req.user?.organizationId ?? req.organizationId;

/**
 * GET /api/templates
 */
export const getAllTemplates = async (req, res) => {
  try {
    const organizationId = getOrgId(req);
    const limit = 10;
    const {
      
    // //   stage,
    // //   isActive,
    // //   search,
      page = 1,
      
    } = req.query;

    const where = {
      organizationId,
    };

    // if (channel) {
    //   where.channel = channel.toUpperCase();
    // }

    // if (stage) {
    //   where.stage = stage.toUpperCase();
    // }

    // if (isActive !== undefined) {
    //   where.isActive = isActive === "true";
    // }

    // if (search) {
    //   where.name = {
    //     contains: search,
    //     mode: "insensitive",
    //   };
    // }
   console.log("where", where)
    const templates = await prisma.template.findMany({
      where,
      orderBy: {
        updatedAt: "desc",
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
    console.log("templates", templates)
    const total = await prisma.template.count({
      where,
    });

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: templates,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch templates",
    });
  }
};

/**
 * GET /api/templates/:id
 */
export const getTemplate = async (req, res) => {
  try {
    const organizationId = getOrgId(req);

    const template = await prisma.template.findFirst({
      where: {
        id: req.params.id,
        organizationId,
      },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: template,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch template",
    });
  }
};

/**
 * POST /api/templates
 */
export const createNewTemplate = async (req, res) => {
  try {
    const organizationId = getOrgId(req);

    const {
      name,
      channel,
      stage,
      subject,
      content,
      isActive = true,
    } = req.body;

    if (!name || !channel || !stage || !content) {
      return res.status(400).json({
        success: false,
        message:
          "Name, channel, stage and content are required.",
      });
    }

    if (
      channel.toUpperCase() === "EMAIL" &&
      (!subject || subject.trim() === "")
    ) {
      return res.status(400).json({
        success: false,
        message: "Email template requires subject.",
      });
    }

    const exists = await prisma.template.findFirst({
      where: {
        organizationId,
        name,
        channel: channel.toUpperCase(),
        stage: stage.toUpperCase(),
      },
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message:
          "Template already exists for this stage and channel.",
      });
    }

    const template = await prisma.template.create({
      data: {
        name,
        channel: channel.toUpperCase(),
        stage: stage.toUpperCase(),
        subject:
          channel.toUpperCase() === "EMAIL"
            ? subject
            : null,
        content,
        isActive,
        organizationId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Template created successfully.",
      data: template,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to create template.",
    });
  }
};

/**
 * PATCH /api/templates/:id
 */
export const updateTemplate = async (req, res) => {
  try {
    const organizationId = getOrgId(req);

    const existing = await prisma.template.findFirst({
      where: {
        id: req.params.id,
        organizationId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Template not found.",
      });
    }

    const {
      name,
      channel,
      stage,
      subject,
      content,
      isActive,
    } = req.body;

    const updated = await prisma.template.update({
      where: {
        id: req.params.id,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(channel !== undefined && {
          channel: channel.toUpperCase(),
        }),
        ...(stage !== undefined && {
          stage: stage.toUpperCase(),
        }),
        ...(content !== undefined && { content }),
        ...(isActive !== undefined && { isActive }),
        ...(subject !== undefined && { subject }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Template updated successfully.",
      data: updated,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to update template.",
    });
  }
};

/**
 * DELETE /api/templates/:id
 */
export const deleteTemplate = async (req, res) => {
  try {
    const organizationId = getOrgId(req);

    const existing = await prisma.template.findFirst({
      where: {
        id: req.params.id,
        organizationId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Template not found.",
      });
    }

    await prisma.template.delete({
      where: {
        id: req.params.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Template deleted successfully.",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to delete template.",
    });
  }
};