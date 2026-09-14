import { prisma } from "../db/db.js";
import { createRemindersForInvoice } from "../services/reminder.service.js";


// ==========================================
// HELPER
// ==========================================

const getOrganizationId = (req) => {
  return req.user?.organizationId || req.organizationId;
};


// ==========================================
// GET ALL INVOICES
// GET /api/invoices
// ==========================================
export const getAllInvoices = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    console.log("Organization ID:", organizationId);
    console.log("Query Parameters:", req.query);

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Organization not found",
      });
    }

    const {
      status,
      search,
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
      where.status = status.toUpperCase();
    }

    // Optional search
    if (search) {
      where.invoiceNumber = {
        contains: search,
        mode: "insensitive",
      };
    }

    console.log("Where Clause:", where);

    console.log("Finding invoices with pagination:")
    const data = await Promise.all([
      prisma.invoice.findMany({
        where,

        include: {
          client: true,
          payments: true,
        },

        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,

        orderBy: {
          dueDate: "asc",
        },
      }),
  

      prisma.invoice.count({
        where,
      }),
    ]);

    console.log("Invoices fetched:", data);
    return res.status(200).json({
      success: true,
      total: data[1],
      page: pageNumber,
      limit: limitNumber,
      data: data[0],
    });

  } catch (error) {
    console.error("GET ALL INVOICES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
      error: error.message, // keep while debugging
    });
  }
};

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
        payments: true,
        escalationLogs: true,
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
      dueDate,
      // status,
      notes,
      clientId,
    } = req.body;

    if (
      !invoiceNumber ||
      amount === undefined ||
      !dueDate ||
      !clientId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "invoiceNumber, amount, dueDate and clientId are required",
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
        invoiceNumber,
        amount: Number(amount),
        dueDate: new Date(dueDate),
        // status: status || "PENDING",
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

    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const {
      invoiceNumber,
      amount,
      dueDate,
      status,
      notes,
      clientId,
    } = req.body;

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

        ...(dueDate !== undefined && {
          dueDate: new Date(dueDate),
        }),

        ...(status !== undefined && {
          status,
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

    await prisma.invoice.delete({
      where: {
        id,
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

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
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

    const updatedInvoice = await prisma.invoice.update({
      where: {
        id,
      },

      data: {
        status,
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

    const {
      amount,
      paymentMethod,
      transactionId,
      notes,
    } = req.body;

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

      await tx.payment.create({
        data: {
          invoiceId: id,

          amount:
            amount !== undefined
              ? Number(amount)
              : Number(invoice.amount),

          paymentMethod,
          transactionId,
          notes,
        },
      });

      await tx.invoice.update({
        where: {
          id,
        },

        data: {
          status: "PAID",
        },
      });

    });

    return res.status(200).json({
      success: true,
      message: "Invoice marked as paid",
    });

  } catch (error) {
    console.error("MARK PAID ERROR:", error);

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

    const {
      amount,
      paymentMethod,
      transactionId,
      notes,
    } = req.body;

    if (!amount || Number(amount) <= 0) {
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

    await prisma.$transaction(async (tx) => {

      await tx.payment.create({
        data: {
          invoiceId: id,
          amount: Number(amount),
          paymentMethod,
          transactionId,
          notes,
        },
      });

      await tx.invoice.update({
        where: {
          id,
        },

        data: {
          status: "PARTIAL",
        },
      });

    });

    return res.status(200).json({
      success: true,
      message: "Partial payment recorded",
    });

  } catch (error) {
    console.error("MARK PARTIAL ERROR:", error);

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