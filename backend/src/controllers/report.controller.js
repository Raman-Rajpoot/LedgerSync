import { prisma } from "../db/db.js";

/**
 * GET /v1/api/reports
 *
 * Query:
 * ?organizationId=xxx&period=6months
 */


const getOrganizationId = (req) => {
  return req.user?.organizationId || req.organizationId;
};

export const getReports = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);
    const  period = "6months" 

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId is required",
      });
    }

    // -----------------------------
    // Calculate date range
    // -----------------------------

    const now = new Date();

    const startDate = new Date();

    switch (period) {
      case "30days":
        startDate.setDate(now.getDate() - 30);
        break;

      case "3months":
        startDate.setMonth(now.getMonth() - 3);
        break;

      case "6months":
        startDate.setMonth(now.getMonth() - 6);
        break;

      case "12months":
        startDate.setMonth(now.getMonth() - 12);
        break;

      default:
        startDate.setMonth(now.getMonth() - 6);
    }

    // -----------------------------
    // Get invoices
    // -----------------------------

    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId,

        createdAt: {
          gte: startDate,
          lte: now,
        },
      },

      include: {
        client: true,
        payments: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    // -----------------------------
    // Summary
    // -----------------------------

    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;

    let paidInvoices = 0;
    let overdueInvoices = 0;

    invoices.forEach((invoice) => {
      const amount = Number(invoice.amount || 0);

      const paid = (invoice.payments || []).reduce(
        (sum, payment) =>
          sum + Number(payment.amount || 0),
        0
      );

      const outstanding = Math.max(
        amount - paid,
        0
      );

      totalInvoiced += amount;

      totalPaid += paid;

      totalOutstanding += outstanding;

      // Invoice status
      if (
        invoice.status === "PAID" ||
        outstanding === 0
      ) {
        paidInvoices++;
      }

      // Overdue
      if (
        invoice.dueDate &&
        new Date(invoice.dueDate) < now &&
        outstanding > 0
      ) {
        totalOverdue += outstanding;
        overdueInvoices++;
      }
    });

    // -----------------------------
    // Monthly Revenue
    // -----------------------------

    const monthlyRevenue = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();

      date.setMonth(
        now.getMonth() - i
      );

      const month = date.toLocaleString(
        "en-IN",
        {
          month: "short",
        }
      );

      const year = date.getFullYear();

      let revenue = 0;

      invoices.forEach((invoice) => {
        const payments =
          invoice.payments || [];

        payments.forEach((payment) => {
          const paymentDate =
            new Date(payment.createdAt);

          if (
            paymentDate.getMonth() ===
              date.getMonth() &&
            paymentDate.getFullYear() ===
              year
          ) {
            revenue += Number(
              payment.amount || 0
            );
          }
        });
      });

      monthlyRevenue.push({
        month,
        revenue,
      });
    }

    // -----------------------------
    // Client Revenue
    // -----------------------------

    const clientMap = {};

    invoices.forEach((invoice) => {
      const client =
        invoice.client;

      if (!client) return;

      const clientId =
        client.id;

      if (!clientMap[clientId]) {
        clientMap[clientId] = {
          clientId,
          name: client.name,

          invoices: 0,

          paid: 0,

          outstanding: 0,

          revenue: 0,
        };
      }

      const amount =
        Number(invoice.amount || 0);

      const paid =
        (invoice.payments || []).reduce(
          (sum, payment) =>
            sum +
            Number(
              payment.amount || 0
            ),
          0
        );

      const outstanding =
        Math.max(
          amount - paid,
          0
        );

      clientMap[clientId].invoices++;

      clientMap[clientId].paid += paid;

      clientMap[clientId].outstanding +=
        outstanding;

      clientMap[clientId].revenue +=
        amount;
    });

    const clientRevenue =
      Object.values(clientMap)
        .sort(
          (a, b) =>
            b.revenue -
            a.revenue
        )
        .slice(0, 10);

    // -----------------------------
    // Response
    // -----------------------------

    return res.status(200).json({
      success: true,

      data: {
        summary: {
          totalRevenue: totalPaid,

          totalInvoiced,

          totalPaid,

          totalOutstanding,

          totalOverdue,

          totalInvoices:
            invoices.length,

          paidInvoices,

          overdueInvoices,
        },

        monthlyRevenue,

        clientRevenue,
      },
    });

  } catch (error) {
    console.error(
      "REPORT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate report",
      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};