import { prisma } from "../db/db.js";

const getOrgId = (req) =>
  req.user?.organizationId ?? req.organizationId;

const channels = new Set(["EMAIL", "SMS", "WHATSAPP"]);
const stages = new Set([
  "BEFORE_DUE",
  "DUE_TODAY",
  "FIRST_REMINDER",
  "SECOND_REMINDER",
  "THIRD_REMINDER",
  "FINAL_NOTICE",
  "LEGAL_NOTICE",
]);

const getPagination = (query) => {
  const requestedPage = Number.parseInt(query.page, 10);
  const requestedLimit = Number.parseInt(query.limit, 10);

  return {
    page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    limit:
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 100)
        : 10,
  };
};

const requireOrganization = (req, res) => {
  const organizationId = getOrgId(req);
  if (!organizationId) {
    res.status(401).json({ success: false, message: "Organization is required." });
    return null;
  }
  return organizationId;
};

/**
 * GET /v1/api/template
 */
export const getAllTemplates = async (req, res) => {
  try {
    const organizationId = requireOrganization(req, res);
    if (!organizationId) return;

    const { page, limit } = getPagination(req.query);
    const { channel, stage, isActive, search } = req.query;

    const where = {
      organizationId,
    };

    if (channel) {
      const normalizedChannel = String(channel).toUpperCase();
      if (!channels.has(normalizedChannel)) {
        return res.status(400).json({ success: false, message: "Invalid channel." });
      }
      where.channel = normalizedChannel;
    }

    if (stage) {
      const normalizedStage = String(stage).toUpperCase();
      if (!stages.has(normalizedStage)) {
        return res.status(400).json({ success: false, message: "Invalid stage." });
      }
      where.stage = normalizedStage;
    }

    if (isActive !== undefined) {
      if (isActive !== "true" && isActive !== "false") {
        return res.status(400).json({ success: false, message: "Invalid active status." });
      }
      where.isActive = isActive === "true";
    }

    if (typeof search === "string" && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { content: { contains: term, mode: "insensitive" } },
        { subject: { contains: term, mode: "insensitive" } },
      ];
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: {
        updatedAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    const total = await prisma.template.count({
      where,
    });

    return res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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
 * GET /v1/api/template/getTemplate/:id
 */
export const getTemplate = async (req, res) => {
  try {
    const organizationId = requireOrganization(req, res);
    if (!organizationId) return;

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
 * POST /v1/api/template
 */
export const createNewTemplate = async (req, res) => {
  try {
    const organizationId = requireOrganization(req, res);
    if (!organizationId) return;

    const {
      name,
      channel,
      stage,
      subject,
      content,
      isActive = true,
    } = req.body;

    const normalizedChannel =
      typeof channel === "string" ? channel.toUpperCase() : "";
    const normalizedStage =
      typeof stage === "string" ? stage.toUpperCase() : "";

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof content !== "string" ||
      !content.trim() ||
      !channels.has(normalizedChannel) ||
      !stages.has(normalizedStage) ||
      typeof isActive !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, channel, stage and content are required and must be valid.",
      });
    }

    if (
      normalizedChannel === "EMAIL" &&
      (typeof subject !== "string" || subject.trim() === "")
    ) {
      return res.status(400).json({
        success: false,
        message: "Email template requires subject.",
      });
    }

    const exists = await prisma.template.findFirst({
      where: {
        organizationId,
        name: name.trim(),
        channel: normalizedChannel,
        stage: normalizedStage,
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
        name: name.trim(),
        channel: normalizedChannel,
        stage: normalizedStage,
        subject: normalizedChannel === "EMAIL" ? subject.trim() : null,
        content: content.trim(),
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
 * PATCH /v1/api/template/:id
 */
export const updateTemplate = async (req, res) => {
  try {
    const organizationId = requireOrganization(req, res);
    if (!organizationId) return;

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

    const { name, channel, stage, subject, content, isActive } = req.body;
    const normalizedChannel =
      channel === undefined
        ? existing.channel
        : typeof channel === "string"
          ? channel.toUpperCase()
          : "";
    const normalizedStage =
      stage === undefined
        ? existing.stage
        : typeof stage === "string"
          ? stage.toUpperCase()
          : "";

    if (
      (name !== undefined && (typeof name !== "string" || !name.trim())) ||
      (content !== undefined &&
        (typeof content !== "string" || !content.trim())) ||
      !channels.has(normalizedChannel) ||
      !stages.has(normalizedStage) ||
      (isActive !== undefined && typeof isActive !== "boolean")
    ) {
      return res.status(400).json({ success: false, message: "Invalid template data." });
    }

    const nextSubject =
      normalizedChannel !== "EMAIL"
        ? null
        : subject === undefined
          ? existing.subject
          : subject;
    if (
      normalizedChannel === "EMAIL" &&
      (typeof nextSubject !== "string" || !nextSubject.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Email template requires subject.",
      });
    }

    const nextName = name === undefined ? existing.name : name.trim();
    const duplicate = await prisma.template.findFirst({
      where: {
        organizationId,
        name: nextName,
        channel: normalizedChannel,
        stage: normalizedStage,
        id: { not: existing.id },
      },
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Template already exists for this stage and channel.",
      });
    }

    const updateData = {
      name: nextName,
      channel: normalizedChannel,
      stage: normalizedStage,
      subject: nextSubject === null ? null : nextSubject.trim(),
      ...(content !== undefined && { content: content.trim() }),
      ...(isActive !== undefined && { isActive }),
    };
    const result = await prisma.template.updateMany({
      where: { id: existing.id, organizationId },
      data: updateData,
    });
    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Template not found.",
      });
    }
    const updated = await prisma.template.findFirst({
      where: { id: existing.id, organizationId },
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
 * DELETE /v1/api/template/:id
 */
export const deleteTemplate = async (req, res) => {
  try {
    const organizationId = requireOrganization(req, res);
    if (!organizationId) return;

    const deleted = await prisma.template.deleteMany({
      where: {
        id: req.params.id,
        organizationId,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Template not found.",
      });
    }

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