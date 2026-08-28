import { prisma } from "../db/db.js";

const getOrgId = (req) => req.user?.organizationId ?? req.organizationId;

// =====================================================
// GET ALL RULES
// =====================================================
export const getAllRules = async (req, res) => {
  try {
    const organizationId = getOrgId(req);

    // const { stage, channel, isActive } = req.query;

    const where = { organizationId };

    // if (stage) where.stage = stage;
    // if (channel) where.channel = channel;

    // if (isActive !== undefined) {
    //   where.isActive = isActive === "true";
    // }

    const rules = await prisma.escalationRule.findMany({
      where,
      include: {
        template: true,
      },
      orderBy: {
        daysOffset: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      data: rules,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch rules.",
    });
  }
};

// =====================================================
// GET SINGLE RULE
// =====================================================
export const getRule = async (req, res) => {
  try {

    const organizationId = getOrgId(req);
    const { id } = req.params;

    const rule = await prisma.escalationRule.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        template: true,
      },
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Rule not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: rule,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch rule.",
    });
  }
};

// =====================================================
// CREATE RULE
// =====================================================
export const createRule = async (req, res) => {

  try {

    const organizationId = getOrgId(req);

    const {
      name,
      description,
      stage,
      daysOffset,
      channel,
      templateId,
    } = req.body;

    const rule = await prisma.escalationRule.create({
      data: {
        name,
        description,
        stage,
        daysOffset: Number(daysOffset),
        channel,

        organization: {
          connect: {
            id: organizationId,
          },
        },

        template: {
          connect: {
            id: templateId,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Rule created successfully.",
      data: rule,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create rule.",
    });
  }
};

// =====================================================
// UPDATE RULE
// =====================================================
export const updateRule = async (req, res) => {

  try {

    const organizationId = getOrgId(req);
    const { id } = req.params;

    const existing = await prisma.escalationRule.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Rule not found.",
      });
    }

    const {
      name,
      description,
      stage,
      daysOffset,
      channel,
      templateId,
    } = req.body;

    const rule = await prisma.escalationRule.update({
      where: {
        id,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(stage !== undefined && { stage }),
        ...(daysOffset !== undefined && { daysOffset: Number(daysOffset) }),
        ...(channel !== undefined && { channel }),

        ...(templateId && {
          template: {
            connect: {
              id: templateId,
            },
          },
        }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Rule updated successfully.",
      data: rule,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update rule.",
    });
  }
};

// =====================================================
// TOGGLE RULE
// =====================================================
export const toggleRule = async (req, res) => {

  try {

    const organizationId = getOrgId(req);
    const { id } = req.params;

    const rule = await prisma.escalationRule.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Rule not found.",
      });
    }

    const updated = await prisma.escalationRule.update({
      where: {
        id,
      },
      data: {
        isActive: !rule.isActive,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Rule status updated.",
      data: updated,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update rule.",
    });
  }
};

// =====================================================
// DELETE RULE
// =====================================================
export const deleteRule = async (req, res) => {

  try {

    const organizationId = getOrgId(req);
    const { id } = req.params;

    const rule = await prisma.escalationRule.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Rule not found.",
      });
    }

    await prisma.escalationRule.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Rule deleted successfully.",
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete rule.",
    });
  }
};

// =====================================================
// RULE STATISTICS
// =====================================================
export const getRuleStatistics = async (req, res) => {

  try {

    const organizationId = getOrgId(req);

    const totalRules = await prisma.escalationRule.count({
      where: {
        organizationId,
      },
    });

    const activeRules = await prisma.escalationRule.count({
      where: {
        organizationId,
        isActive: true,
      },
    });

    const inactiveRules = await prisma.escalationRule.count({
      where: {
        organizationId,
        isActive: false,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        totalRules,
        activeRules,
        inactiveRules,
      },
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch statistics.",
    });
  }
};