import { prisma } from '../db/db.js';
import nodemailer from "nodemailer";
import twilio from "twilio";
import crypto from "crypto";



const getOrgId = (req) => req.user?.organizationId ?? req.organizationId;

// -----------------------------
// Escalation Logger
// -----------------------------
async function logEscalation({
  invoiceId,
  channel,
  recipient,
  subject = null,
  content,
  status,
  providerId = null,
  error = null,
}) {
  return prisma.escalationLog.create({
    data: {
      invoiceId,
      channel,
      recipient,
      subject,
      content,
      status,
      providerMessageId: providerId,
      error,
    },
  });
}
 
// ---------------------------------------------------------------------------
// GET /escalations
// ---------------------------------------------------------------------------

export const getAllEscalations = async (req, res) => {
  try {
    const organizationId = getOrgId(req);

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Missing organization context.",
      });
    }

    const {
      channel,
      invoiceId,
      page = "1",
      limit = "20",
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10), 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10), 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const where = {
      invoice: {
        organizationId,
      },
    };

    if (channel) where.channel = channel;
    if (invoiceId) where.invoiceId = invoiceId;

    const [logs, total] = await prisma.$transaction([
      prisma.escalationLog.findMany({
        where,
        include: {
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
        },
        orderBy: {
          sentAt: "desc",
        },
        skip,
        take: limitNumber,
      }),

      prisma.escalationLog.count({
        where,
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Escalations fetched successfully.",
      data: logs,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
        hasNextPage: pageNumber * limitNumber < total,
        hasPreviousPage: pageNumber > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching escalations:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch escalations.",
    });
  }
};

// ---------------------------------------------------------------------------
// GET /escalations/:id
// ---------------------------------------------------------------------------
export const getEscalationById = async (req, res) => {
  try {
    const organizationId = getOrgId(req);
    const { id } = req.params;

    const log = await prisma.escalationLog.findFirst({
      where: { id, invoice: { organizationId } },
      include: { invoice: { include: { client: true } } },
    });

    if (!log) {
      return res.status(404).json({ error: "Escalation not found" });
    }

    return res.status(200).json({ data: log });
  } catch (error) {
    console.error("getEscalationById error:", error);
    return res.status(500).json({ error: "Failed to fetch escalation" });
  }
};


// ---------------------------------------------------------------------------
// GET /invoices/:invoiceId/escalations
// ---------------------------------------------------------------------------
export const getInvoiceEscalations = async (req, res) => {
  try {
    const organizationId = getOrgId(req);
    const { invoiceId } = req.params;

    // Validate invoiceId
    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        error: "Invoice ID is required",
      });
    }

    // Ensure invoice belongs to organization
    const invoice = await getOrgInvoice(invoiceId, organizationId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found for this organization",
      });
    }

    // Query params
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const { channel, status } = req.query;

    // Dynamic filters
    const where = {
      invoiceId,
      ...(channel && { channel }),
      ...(status && { status }),
    };

    // Fetch data + total count
    const [logs, total] = await Promise.all([
      prisma.escalationLog.findMany({
        where,
        orderBy: {
          sentAt: "desc",
        },
        skip,
        take: limit,
        select: {
          id: true,
          channel: true,
          content: true,
          status: true,
          sentAt: true,
          deliveredAt: true,
          openedAt: true,
          repliedAt: true,
          metadata: true,
        },
      }),

      prisma.escalationLog.count({
        where,
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Escalation history fetched successfully.",
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
    console.error("getInvoiceEscalations error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to fetch invoice escalations.",
    });
  }
};
