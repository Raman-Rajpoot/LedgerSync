import { prisma } from "../db/db.js";


// ==========================================
// HELPER
// ==========================================

const getOrganizationId = (req) => {
  return req.user?.organizationId || req.organizationId;
};


// ==========================================
// GET ALL PAYMENTS
// GET /api/payment
// ==========================================

export const getAllPayments = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Organization not found",
      });
    }

    const {
      invoiceId,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const where = {
      invoice: {
        organizationId,
      },
    };

    // Optional invoice filter
    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,

        include: {
          invoice: {
            include: {
              client: true,
            },
          },
        },

        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,

        orderBy: {
          paidAt: "desc",
        },
      }),

      prisma.payment.count({
        where,
      }),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNumber,
      limit: limitNumber,
      data: payments,
    });

  } catch (error) {
    console.error("GET ALL PAYMENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
    });
  }
};


// ==========================================
// GET SINGLE PAYMENT
// GET /api/payment/:id
// ==========================================

export const getPayment = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);
    const { id } = req.params;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Organization not found",
      });
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id,

        invoice: {
          organizationId,
        },
      },

      include: {
        invoice: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });

  } catch (error) {
    console.error("GET PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
    });
  }
};


// ==========================================
// GET PAYMENTS BY INVOICE
// GET /api/payment/invoice/:invoiceId
// ==========================================

export const getPaymentsByInvoice = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);
    const { invoiceId } = req.params;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Organization not found",
      });
    }

    // Make sure invoice belongs to organization
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        organizationId,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const payments = await prisma.payment.findMany({
      where: {
        invoiceId,
      },

      orderBy: {
        paidAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: payments,
    });

  } catch (error) {
    console.error(
      "GET PAYMENTS BY INVOICE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoice payments",
    });
  }
};


// ==========================================
// CREATE PAYMENT
// POST /api/payment
// ==========================================

export const createPayment = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Organization not found",
      });
    }

    const {
      amountPaid,
      method,
      paidAt,
      invoiceId,
    } = req.body;

    if (
      amountPaid === undefined ||
      !method ||
      !invoiceId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "amountPaid, method and invoiceId are required",
      });
    }

    if (Number(amountPaid) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than 0",
      });
    }

    // Make sure invoice belongs to same organization
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        organizationId,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const payment = await prisma.payment.create({
      data: {
        amountPaid: Number(amountPaid),
        method,
        paidAt: paidAt
          ? new Date(paidAt)
          : new Date(),
        invoiceId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: payment,
    });

  } catch (error) {
    console.error("CREATE PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create payment",
    });
  }
};


// ==========================================
// UPDATE PAYMENT
// PUT /api/payment/:id
// ==========================================

export const updatePayment = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);
    const { id } = req.params;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Organization not found",
      });
    }

    const existingPayment = await prisma.payment.findFirst({
      where: {
        id,

        invoice: {
          organizationId,
        },
      },
    });

    if (!existingPayment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const {
      amountPaid,
      method,
      paidAt,
      invoiceId,
    } = req.body;

    // If invoice is changed, verify new invoice
    if (invoiceId) {
      const invoice = await prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          organizationId,
        },
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }
    }

    const payment = await prisma.payment.update({
      where: {
        id,
      },

      data: {
        ...(amountPaid !== undefined && {
          amountPaid: Number(amountPaid),
        }),

        ...(method !== undefined && {
          method,
        }),

        ...(paidAt !== undefined && {
          paidAt: new Date(paidAt),
        }),

        ...(invoiceId !== undefined && {
          invoiceId,
        }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: payment,
    });

  } catch (error) {
    console.error("UPDATE PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update payment",
    });
  }
};


// ==========================================
// DELETE PAYMENT
// DELETE /api/payment/:id
// ==========================================

export const deletePayment = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);
    const { id } = req.params;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Organization not found",
      });
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id,

        invoice: {
          organizationId,
        },
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    await prisma.payment.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Payment deleted successfully",
    });

  } catch (error) {
    console.error("DELETE PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete payment",
    });
  }
};