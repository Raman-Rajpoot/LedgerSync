import { prisma } from "../db/db.js";

const getOrgId = (req) => req.user?.organizationId ?? req.organizationId;

const parsePage = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const logInclude = {
  invoice: {
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
        },
      },
    },
  },
};

export const getAllEscalations = async (req, res) => {
  const organizationId = getOrgId(req);

  if (!organizationId) {
    return res.status(401).json({
      success: false,
      message: "Missing organization context.",
    });
  }

  try {
    const page = parsePage(req.query.page, 1);
    const limit = Math.min(parsePage(req.query.limit, 20), 100);
    const where = {
      invoice: { organizationId },
      ...(req.query.channel && { channel: req.query.channel }),
      ...(req.query.status && { status: req.query.status }),
      ...(req.query.invoiceId && { invoiceId: req.query.invoiceId }),
    };

    const [logs, total] = await prisma.$transaction([
      prisma.escalationLog.findMany({
        where,
        include: logInclude,
        orderBy: { sentAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.escalationLog.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching escalation history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch escalation history.",
    });
  }
};

export const getEscalationById = async (req, res) => {
  const organizationId = getOrgId(req);

  if (!organizationId) {
    return res.status(401).json({
      success: false,
      message: "Missing organization context.",
    });
  }

  try {
    const log = await prisma.escalationLog.findFirst({
      where: {
        id: req.params.id,
        invoice: { organizationId },
      },
      include: logInclude,
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Escalation history entry not found.",
      });
    }

    return res.status(200).json({ success: true, data: log });
  } catch (error) {
    console.error("Error fetching escalation history entry:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch escalation history entry.",
    });
  }
};

export const getInvoiceEscalations = async (req, res) => {
  const organizationId = getOrgId(req);

  if (!organizationId) {
    return res.status(401).json({
      success: false,
      message: "Missing organization context.",
    });
  }

  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.invoiceId,
        organizationId,
      },
      select: { id: true },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found for this organization.",
      });
    }

    const page = parsePage(req.query.page, 1);
    const limit = Math.min(parsePage(req.query.limit, 20), 100);
    const where = {
      invoiceId: invoice.id,
      ...(req.query.channel && { channel: req.query.channel }),
      ...(req.query.status && { status: req.query.status }),
    };
    const [logs, total] = await prisma.$transaction([
      prisma.escalationLog.findMany({
        where,
        orderBy: { sentAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.escalationLog.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching invoice escalation history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoice escalation history.",
    });
  }
};
