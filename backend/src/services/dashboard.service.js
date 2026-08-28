import { prisma } from '../db/db.js';

export const getDashboardData = async (organizationId) => {
  if (!organizationId) {
    throw new Error("Organization ID is required");
  }

  // -----------------------------
  // CLIENTS
  // -----------------------------

  const totalClients = await prisma.client.count({
    where: {
      organizationId,
    },
  });

  // -----------------------------
  // INVOICES
  // -----------------------------

  const totalInvoices = await prisma.invoice.count({
    where: {
      organizationId,
    },
  });

  // -----------------------------
  // ALL INVOICES
  // -----------------------------

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
    },
    include: {
      client: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // -----------------------------
  // CALCULATE MONEY
  // -----------------------------

  let totalRevenue = 0;
  let outstandingAmount = 0;
  let overdueAmount = 0;
  let pendingAmount = 0;

  let pendingInvoices = 0;

  const today = new Date();

  invoices.forEach((invoice) => {
    const amount = Number(invoice.amount || 0);

    const status = String(
      invoice.status || ""
    ).toUpperCase();

    if (status === "PAID") {
      totalRevenue += amount;
    }

    if (
      status === "PENDING" ||
      status === "UNPAID"
    ) {
      outstandingAmount += amount;

      pendingAmount += amount;

      pendingInvoices++;
    }

    const dueDate = invoice.dueDate
      ? new Date(invoice.dueDate)
      : null;

    if (
      dueDate &&
      dueDate < today &&
      status !== "PAID"
    ) {
      overdueAmount += amount;
    }
  });

  // -----------------------------
  // COLLECTION RATE
  // -----------------------------

  const totalInvoiceValue =
    invoices.reduce(
      (sum, invoice) =>
        sum + Number(invoice.amount || 0),
      0
    );

  const collectionRate =
    totalInvoiceValue > 0
      ? Math.round(
          (totalRevenue /
            totalInvoiceValue) *
            100
        )
      : 0;

  // -----------------------------
  // RECENT INVOICES
  // -----------------------------

  const recentInvoices =
    invoices.slice(0, 5);

  // -----------------------------
  // UPCOMING PAYMENTS
  // -----------------------------

  const upcomingPayments =
    invoices
      .filter((invoice) => {
        if (!invoice.dueDate) {
          return false;
        }

        const dueDate =
          new Date(invoice.dueDate);

        return (
          dueDate >= today &&
          String(invoice.status)
            .toUpperCase() !== "PAID"
        );
      })
      .sort(
        (a, b) =>
          new Date(a.dueDate) -
          new Date(b.dueDate)
      )
      .slice(0, 5);

  // -----------------------------
  // REMINDERS
  // -----------------------------

  const reminderConfigs =
    await prisma.reminderConfig.findMany({
      where: {
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

  const activeReminders =
    reminderConfigs.filter(
      (item) => item.enabled
    ).length;

  const pausedReminders =
    reminderConfigs.filter(
      (item) => !item.enabled
    ).length;

  const scheduledReminders =
    reminderConfigs.filter(
      (item) =>
        item.enabled &&
        item.nextReminderAt
    ).length;

  const overdueReminders =
    reminderConfigs.filter(
      (item) => {
        const dueDate =
          item.invoice?.dueDate;

        if (!dueDate) {
          return false;
        }

        return (
          new Date(dueDate) < today &&
          String(
            item.invoice?.status
          ).toUpperCase() !== "PAID"
        );
      }
    ).length;

  const nextReminder =
    reminderConfigs
      .filter(
        (item) =>
          item.enabled &&
          item.nextReminderAt
      )
      .sort(
        (a, b) =>
          new Date(a.nextReminderAt) -
          new Date(b.nextReminderAt)
      )[0];

  // -----------------------------
  // ACTIVITIES
  // -----------------------------

  const escalationLogs =
    await prisma.escalationLog.findMany({
      where: {
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
      orderBy: {
        sentAt: "desc",
      },
      take: 10,
    });

  const activities =
    escalationLogs.map((log) => ({
      id: log.id,

      type: "REMINDER",

      title: `Reminder sent via ${
        log.channel || "Unknown"
      }`,

      description:
        log.invoice?.client?.name ||
        "Unknown client",

      createdAt:
        log.sentAt,
    }));

  // -----------------------------
  // FINAL RESPONSE
  // -----------------------------

  return {
    stats: {
      totalClients,

      totalInvoices,

      outstandingAmount,

      overdueAmount,

      totalRevenue,

      pendingAmount,

      pendingInvoices,

      collectionRate,

      // We don't have historical
      // monthly comparison yet.
      clientGrowth: "0%",

      invoiceGrowth: "0%",

      overdueGrowth: "0%",
    },

    recentInvoices,

    upcomingPayments,

    activities,

    reminders: {
      total: reminderConfigs.length,

      active: activeReminders,

      scheduled: scheduledReminders,

      overdue: overdueReminders,

      paused: pausedReminders,

      nextCount: scheduledReminders,

      nextReminderAt:
        nextReminder?.nextReminderAt ||
        null,
    },
  };
};