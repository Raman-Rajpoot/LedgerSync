import { prisma } from "../db/db.js";

function calculateReminderDate(
  dueDate,
  daysOffset,
  hour = 10,
  minute = 0
) {
  const date = new Date(dueDate);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid invoice due date");
  }

  date.setDate(date.getDate() + Number(daysOffset));
  date.setHours(hour, minute, 0, 0);

  return date;
}

async function createRemindersForInvoice(invoice) {
  try {
    console.log("Starting reminder creation...");

    // 1. Validate invoice data
    if (!invoice?.id) {
      throw new Error("Invoice ID is missing");
    }

    if (!invoice?.organizationId) {
      throw new Error("Invoice organizationId is missing");
    }

    if (!invoice?.dueDate) {
      throw new Error("Invoice dueDate is missing");
    }

    console.log("Invoice:", {
      id: invoice.id,
      organizationId: invoice.organizationId,
      dueDate: invoice.dueDate,
    });

    // 2. Get active escalation rules for this organization
    const rules = await prisma.escalationRule.findMany({
      where: {
        organizationId: invoice.organizationId,
        isActive: true,
      },
    });

    console.log(`Found ${rules.length} active rules`);

    // 3. No rules configured
    if (rules.length === 0) {
      console.log("No active escalation rules found");
      return [];
    }

    const reminders = [];
    const now = new Date();

    // 4. Create reminder for every future rule
    for (const rule of rules) {
      const scheduledAt = calculateReminderDate(
        invoice.dueDate,
        rule.daysOffset
      );

      console.log("Checking rule:", {
        ruleId: rule.id,
        name: rule.name,
        daysOffset: rule.daysOffset,
        scheduledAt,
        now,
      });

      // Skip reminders whose scheduled time has already passed
      if (scheduledAt <= now) {
        console.log(
          `Skipping ${rule.name} because scheduled time has passed`
        );
        continue;
      }

      reminders.push({
        invoiceId: invoice.id,
        ruleId: rule.id,
        organizationId: invoice.organizationId,
        scheduledAt,
        status: "PENDING",
      });
    }

    console.log("Reminders to create:", reminders);

    // 5. Nothing to create
    if (reminders.length === 0) {
      console.log("No future reminders to create");
      return [];
    }

    // 6. Save reminders
    const result = await prisma.reminder.createMany({
      data: reminders,
    });

    console.log(
      `Successfully created ${result.count} reminders`
    );

    return result;

  } catch (error) {
    console.error(
      "Error creating reminders for invoice:",
      error
    );

    throw new Error(
      `Failed to create reminders for invoice: ${error.message}`
    );
  }
}

export {
  calculateReminderDate,
  createRemindersForInvoice,
};