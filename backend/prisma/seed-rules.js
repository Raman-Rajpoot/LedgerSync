
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const organizationId = "6acf435bb7ea8f2c88f39860"; // Replace with your existing Organization ID

  const rules = [
    {
      name: "Before Due Reminder",
      description: "Remind the client before the invoice due date.",
      stage: "BEFORE_DUE",
      daysOffset: -3,
      channel: "EMAIL",
      templateName: "Before Due Reminder",
    },
    {
      name: "Due Today Reminder",
      description: "Notify the client on the invoice due date.",
      stage: "DUE_TODAY",
      daysOffset: 0,
      channel: "EMAIL",
      templateName: "Due Today Reminder",
    },
    {
      name: "First Overdue Reminder",
      description: "Follow up three days after the due date.",
      stage: "FIRST_REMINDER",
      daysOffset: 3,
      channel: "EMAIL",
      templateName: "First Overdue Reminder",
    },
    {
      name: "Second Overdue Reminder",
      description: "Follow up seven days after the due date.",
      stage: "SECOND_REMINDER",
      daysOffset: 7,
      channel: "EMAIL",
      templateName: "Second Overdue Reminder",
    },
    {
      name: "Third Overdue Reminder",
      description: "Follow up fourteen days after the due date.",
      stage: "THIRD_REMINDER",
      daysOffset: 14,
      channel: "EMAIL",
      templateName: "Third Overdue Reminder",
    },
    {
      name: "Final Payment Notice",
      description: "Send a final notice twenty-one days after the due date.",
      stage: "FINAL_NOTICE",
      daysOffset: 21,
      channel: "EMAIL",
      templateName: "Final Payment Notice",
    },
  ];

  for (const rule of rules) {
    const template = await prisma.template.findFirst({
      where: {
        organizationId,
        name: rule.templateName,
        channel: rule.channel,
        stage: rule.stage,
      },
    });

    if (!template) {
      throw new Error(
        `Template not found: ${rule.templateName}. Seed templates first.`
      );
    }

    const existingRule = await prisma.escalationRule.findFirst({
      where: {
        organizationId,
        name: rule.name,
        stage: rule.stage,
        channel: rule.channel,
      },
    });

    const data = {
      name: rule.name,
      description: rule.description,
      stage: rule.stage,
      daysOffset: rule.daysOffset,
      channel: rule.channel,
      templateId: template.id,
      organizationId,
      isActive: true,
    };

    if (existingRule) {
      await prisma.escalationRule.update({
        where: { id: existingRule.id },
        data,
      });
      console.log(`Updated: ${rule.name}`);
    } else {
      await prisma.escalationRule.create({ data });
      console.log(`Created: ${rule.name}`);
    }
  }
}

main()
  .catch((error) => {
    console.error("Failed to seed escalation rules:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
