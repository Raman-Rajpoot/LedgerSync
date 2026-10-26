import { prisma } from "../db/db.js";
import { createRemindersForInvoice } from "../services/reminder.service.js";
import { randomUUID } from "node:crypto";


// ==========================================
// HELPER
// ==========================================

const getOrganizationId = (req) => {
  return req.user?.organizationId || req.organizationId;
};

const invoiceStatuses = new Set([
  "DRAFT",
  "SENT",
  "PENDING",
  "PARTIAL",
  "PAID",
  "OVERDUE",
  "CANCELLED",
]);


// ==========================================
// GET ALL INVOICES
// GET /api/invoices
// ==========================================
export const getAllInvoices = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Organization not found",
      });
    }

    const {
      status,
      search,
      clientId,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(
      Math.max(Number(limit) || 10, 1),
      100
    );

    const where = {
      organizationId,
    };

    // Optional status filter
    if (status && status.toUpperCase() !== "ALL") {
      const normalizedStatus = status.toUpperCase();
      if (!invoiceStatuses.has(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid invoice status",
        });
      }
      where.status = normalizedStatus;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    // Optional search
    if (search) {
      where.OR = [
        {
          invoiceNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          client: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          client: {
            companyName: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const Invoices = await prisma.invoice.findMany({
  // where: {
  //   ...where,
  //   status: {
  //     notIn: ["PAID", "CANCELLED"],
  //   },
  // },
  include: {
    client: true,
    payments: true,
  },
  skip: (pageNumber - 1) * limitNumber,
  take: limitNumber,
  orderBy: {
    dueDate: "asc",
  },
});

return res.status(200).json({
  success: true,
  page: pageNumber,
  limit: limitNumber,
  data: Invoices,
});

  } catch (error) {
    console.error("GET ALL INVOICES ERROR:", error);  
  }
}

// ==========================================
// GET SINGLE INVOICE
// GET /api/invoices/:id
// ==========================================

export const getInvoice = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);
    const { id } = req.params;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Organization not found",
      });
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        organizationId,
      },

      include: {
        client: true,
        payments: {
          orderBy: {
            paidAt: "desc",
          },
        },
        escalationLogs: {
          orderBy: {
            sentAt: "desc",
          },
        },
        reminderConfig: true,
        reminders: {
          include: {
            rule: true,
          },
          orderBy: {
            scheduledAt: "asc",
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: invoice,
    });

  } catch (error) {
    console.error("GET INVOICE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoice",
    });
  }
};


// ==========================================
// CREATE INVOICE
// POST /api/invoices
// ==========================================

export const createInvoice = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Organization not found",
      });
    }

    const {
      invoiceNumber,
      amount,
      subtotal,
      tax,
      discount,
      issueDate,
      dueDate,
      notes,
      clientId,
    } = req.body;

    if (
      amount === undefined ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) < 0 ||
      !dueDate ||
      !clientId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A valid amount, dueDate and clientId are required",
      });
    }

    for (const [field, value] of Object.entries({ subtotal, tax, discount })) {
      if (value !== undefined && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a valid non-negative number`,
        });
      }
    }

    const parsedDueDate = new Date(dueDate);
    const parsedIssueDate = issueDate ? new Date(issueDate) : new Date();
    if (
      Number.isNaN(parsedDueDate.getTime()) ||
      Number.isNaN(parsedIssueDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid issueDate and dueDate values are required",
      });
    }

    // Make sure client belongs to same organization
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId,
      },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber:
          invoiceNumber?.trim() ||
          `INV-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
        amount: Number(amount),
        ...(subtotal !== undefined && { subtotal: Number(subtotal) }),
        ...(tax !== undefined && { tax: Number(tax) }),
        ...(discount !== undefined && { discount: Number(discount) }),
        issueDate: parsedIssueDate,
        dueDate: parsedDueDate,
        notes,
        clientId,
        organizationId,
      },
    });
    await createRemindersForInvoice(invoice);
    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoice,
    });

  } catch (error) {
    console.error("CREATE INVOICE ERROR:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Invoice number already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create invoice",
    });
  }
};


// ==========================================
// UPDATE INVOICE
// PATCH /api/invoices/:id
// ==========================================

export const updateInvoice = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);
    const { id } = req.params;

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        organizationId,
      },
    });
    console.log(existingInvoice);
    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }
    if(existingInvoice.status === "PAID" || existingInvoice.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Cannot update a PAID or CANCELLED invoice",
      });
    }
    const {
      invoiceNumber,
      amount,
      subtotal,
      tax,
      discount,
      issueDate,
      dueDate,
      status,
      notes,
      clientId,
    } = req.body;

    if (
      status !== undefined &&
      !invoiceStatuses.has(String(status).toUpperCase())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice status",
      });
    }

    if (
      amount !== undefined &&
      (!Number.isFinite(Number(amount)) || Number(amount) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invoice amount must be a valid non-negative number",
      });
    }

    for (const [field, value] of Object.entries({ subtotal, tax, discount })) {
      if (value !== undefined && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a valid non-negative number`,
        });
      }
    }

    const parsedIssueDate = issueDate === undefined ? undefined : new Date(issueDate);
    const parsedDueDate = dueDate === undefined ? undefined : new Date(dueDate);
    if (
      (parsedIssueDate && Number.isNaN(parsedIssueDate.getTime())) ||
      (parsedDueDate && Number.isNaN(parsedDueDate.getTime()))
    ) {
      return res.status(400).json({
        success: false,
        message: "Issue and due dates must be valid dates",
      });
    }

    // If client is changed, verify new client
    if (clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          organizationId,
        },
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: "Client not found",
        });
      }
    }

    const invoice = await prisma.invoice.update({
      where: {
        id,
      },

      data: {
        ...(invoiceNumber !== undefined && {
          invoiceNumber,
        }),

        ...(amount !== undefined && {
          amount: Number(amount),
        }),

        ...(issueDate !== undefined && { issueDate: parsedIssueDate }),
        ...(dueDate !== undefined && { dueDate: parsedDueDate }),

        ...(subtotal !== undefined && { subtotal: Number(subtotal) }),

        ...(tax !== undefined && { tax: Number(tax) }),

        ...(discount !== undefined && { discount: Number(discount) }),

        ...(status !== undefined && {
          status: String(status).toUpperCase(),
        }),

        ...(notes !== undefined && {
          notes,
        }),

        ...(clientId !== undefined && {
          clientId,
        }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      data: invoice,
    });

  } catch (error) {
    console.error("UPDATE INVOICE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update invoice",
    });
  }
};


// ==========================================
// DELETE INVOICE
// DELETE /api/invoices/:id
// ==========================================

export const deleteInvoice = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);
    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }
     if(existingInvoice.status === "PAID" || existingInvoice.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a PAID or CANCELLED invoice",
      });
    }
    console.log("Deleting invoice:", invoice);
    await prisma.invoice.delete({
      where: {
        id: invoice.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });

  } catch (error) {
    console.error("DELETE INVOICE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete invoice",
    });
  }
};


// ==========================================
// UPDATE STATUS
// PATCH /api/invoices/:id/status
// ==========================================

export const updateStatus = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);
    const { id } = req.params;
    const { status } = req.body;

    const normalizedStatus = String(status || "").toUpperCase();
    if (!invoiceStatuses.has(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: "A valid invoice status is required",
      });
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }
   if(existingInvoice.status === "PAID" || existingInvoice.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Cannot update a PAID or CANCELLED invoice",
      });
    }
    const updatedInvoice = await prisma.invoice.update({
      where: {
        id,
      },

      data: {
        status: normalizedStatus,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Invoice status updated",
      data: updatedInvoice,
    });

  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};


// ==========================================
// MARK PAID
// PATCH /api/invoices/:id/paid
// ==========================================

export const markPaid = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);
    const { id } = req.params;

    const { amount, method = "MANUAL" } = req.body;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    await prisma.$transaction(async (tx) => {
      const payments = await tx.payment.findMany({
        where: { invoiceId: id },
      });
      const paidAmount = payments.reduce(
        (total, payment) => total + Number(payment.amountPaid || 0),
        0
      );
      const remainingAmount = Math.max(Number(invoice.amount) - paidAmount, 0);
      const paymentAmount = amount === undefined
        ? remainingAmount
        : Number(amount);

      if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
        throw new Error("A valid remaining payment amount is required");
      }
      if (paymentAmount > remainingAmount) {
        throw new Error("Payment amount exceeds the invoice balance");
      }
      if (paymentAmount < remainingAmount) {
        throw new Error("Mark-paid amount must cover the invoice balance");
      }

      await tx.payment.create({
        data: {
          invoiceId: id,
          amountPaid: paymentAmount,
          method,
        },
      });

      await tx.invoice.update({
        where: { id },
        data: { status: "PAID" },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Invoice marked as paid",
    });

  } catch (error) {
    console.error("MARK PAID ERROR:", error);

    if (error.message.includes("payment amount") || error.message.includes("Mark-paid amount")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to mark invoice as paid",
    });
  }
};


// ==========================================
// MARK PARTIAL
// PATCH /api/invoices/:id/partial
// ==========================================

export const markPartial = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);
    const { id } = req.params;

    const { amount, method = "MANUAL" } = req.body;

    if (
      amount === undefined ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid payment amount is required",
      });
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }
   if(existingInvoice.status === "PAID" || existingInvoice.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Cannot mark a PAID or CANCELLED invoice as partial",
      });
    }
    await prisma.$transaction(async (tx) => {
      const payments = await tx.payment.findMany({
        where: { invoiceId: id },
      });
      const paidAmount = payments.reduce(
        (total, payment) => total + Number(payment.amountPaid || 0),
        0
      );
      const updatedPaidAmount = paidAmount + Number(amount);
      if (updatedPaidAmount > Number(invoice.amount)) {
        throw new Error("Payment amount exceeds the invoice balance");
      }

      await tx.payment.create({
        data: {
          invoiceId: id,
          amountPaid: Number(amount),
          method,
        },
      });
      await tx.invoice.update({
        where: { id },
        data: {
          status: updatedPaidAmount >= Number(invoice.amount) ? "PAID" : "PARTIAL",
        },
      });

    });

    return res.status(200).json({
      success: true,
      message: "Partial payment recorded",
    });

  } catch (error) {
    console.error("MARK PARTIAL ERROR:", error);

    if (error.message.includes("Payment amount")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to record partial payment",
    });
  }
};


// ==========================================
// STATISTICS
// GET /api/invoices/statistics
// ==========================================

export const getInvoiceStatistics = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Organization not found",
      });
    }

    const [
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      partialInvoices,
      totalAmount,
      paidAmount,
    ] = await Promise.all([

      prisma.invoice.count({
        where: {
          organizationId,
        },
      }),

      prisma.invoice.count({
        where: {
          organizationId,
          status: "PAID",
        },
      }),

      prisma.invoice.count({
        where: {
          organizationId,
          status: "PENDING",
        },
      }),

      prisma.invoice.count({
        where: {
          organizationId,
          status: "OVERDUE",
        },
      }),

      prisma.invoice.count({
        where: {
          organizationId,
          status: "PARTIAL",
        },
      }),

      prisma.invoice.aggregate({
        where: {
          organizationId,
        },

        _sum: {
          amount: true,
        },
      }),

      prisma.invoice.aggregate({
        where: {
          organizationId,
          status: "PAID",
        },

        _sum: {
          amount: true,
        },
      }),

    ]);

    return res.status(200).json({
      success: true,

      data: {
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        partialInvoices,

        totalAmount:
          totalAmount._sum.amount || 0,

        paidAmount:
          paidAmount._sum.amount || 0,
      },
    });

  } catch (error) {
    console.error(
      "INVOICE STATISTICS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoice statistics",
    });
  }
};


export const getClientInvoices = async (req, res) => {
  try {
    const { clientId } = req.params;

    const organizationId = req.user?.organizationId;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: "Client ID is required",
      });
    }

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Organization authentication required",
      });
    }

    // Verify that the client belongs to this organization.
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId,
      },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Fetch all invoices belonging to this client.
    const invoices = await prisma.invoice.findMany({
      where: {
        clientId,
        organizationId,
      },
      orderBy: {
        dueDate: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Client invoices fetched successfully",
      data: invoices,
      count: invoices.length,
    });
  } catch (error) {
    console.error("Get client invoices error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch client invoices",
    });
  }
};