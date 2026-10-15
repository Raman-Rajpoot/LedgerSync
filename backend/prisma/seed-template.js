
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Replace this with your existing Organization ID
const organizationId = "6acf435bb7ea8f2c88f39860"; // Example Organization ID

const templates = [
  {
    name: "Before Due Reminder",
    channel: "EMAIL",
    stage: "BEFORE_DUE",
    subject: "Friendly Reminder: Invoice {{invoiceNumber}} Due Soon",
    content: `Hi {{clientName}},

This is a friendly reminder that invoice {{invoiceNumber}} for {{amount}} is due on {{dueDate}}.

Please arrange payment by the due date. If you have already paid, please disregard this reminder.

Thank you for your business!

Best regards,
Accounts Team`,
  },
  {
    name: "Due Today Reminder",
    channel: "EMAIL",
    stage: "DUE_TODAY",
    subject: "Payment Due Today: Invoice {{invoiceNumber}}",
    content: `Hi {{clientName}},

Invoice {{invoiceNumber}} for {{amount}} is due today, {{dueDate}}.

Please arrange payment if you have not already done so.

Best regards,
Accounts Team`,
  },
  {
    name: "First Overdue Reminder",
    channel: "EMAIL",
    stage: "FIRST_REMINDER",
    subject: "Payment Follow-up: Invoice {{invoiceNumber}}",
    content: `Hi {{clientName}},

Our records indicate that invoice {{invoiceNumber}} for {{amount}}, due on {{dueDate}}, is still outstanding.

Please check the payment status and arrange payment when possible. If you have already paid, please let us know.

Best regards,
Accounts Team`,
  },
  {
    name: "Second Overdue Reminder",
    channel: "EMAIL",
    stage: "SECOND_REMINDER",
    subject: "Second Payment Reminder: Invoice {{invoiceNumber}}",
    content: `Hi {{clientName}},

We are following up regarding invoice {{invoiceNumber}} for {{amount}}, due on {{dueDate}}.

Please arrange payment or let us know if there is an issue preventing payment.

Best regards,
Accounts Team`,
  },
  {
    name: "Third Overdue Reminder",
    channel: "EMAIL",
    stage: "THIRD_REMINDER",
    subject: "Urgent Payment Follow-up: Invoice {{invoiceNumber}}",
    content: `Hi {{clientName}},

Invoice {{invoiceNumber}} for {{amount}}, due on {{dueDate}}, remains outstanding in our records.

Please arrange payment as soon as possible or contact us to discuss the status.

Best regards,
Accounts Team`,
  },
  {
    name: "Final Payment Notice",
    channel: "EMAIL",
    stage: "FINAL_NOTICE",
    subject: "Final Payment Reminder: Invoice {{invoiceNumber}}",
    content: `Hi {{clientName}},

This is our final scheduled reminder regarding invoice {{invoiceNumber}} for {{amount}}, due on {{dueDate}}.

Please arrange payment promptly or contact us to discuss the next steps. If you have already paid, please share confirmation.

Best regards,
Accounts Team`,
  },
];

async function main() {
  if (organizationId === "YOUR_ORGANIZATION_ID") {
    throw new Error("Set organizationId to a real Organization ID first.");
  }

  for (const item of templates) {
    const existing = await prisma.template.findFirst({
      where: {
        organizationId,
        name: item.name,
        channel: item.channel,
        stage: item.stage,
      },
    });

    if (existing) {
      await prisma.template.update({
        where: { id: existing.id },
        data: {
          subject: item.subject,
          content: item.content,
          isActive: true,
        },
      });

      console.log(`Updated: ${item.name}`);
    } else {
      await prisma.template.create({
        data: {
          ...item,
          organizationId,
          isActive: true,
        },
      });

      console.log(`Created: ${item.name}`);
    }
  }

  console.log("All reminder templates seeded successfully.");
}

main()
  .catch((error) => {
    console.error("Template seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
