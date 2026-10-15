
import { prisma } from "../db/db.js";
import sendEmail from "../services/mail.service.js";
import { personalizeReminder } from "../services/ai.service.js";
import { sendSMS } from "./sms.service.js";
import { sendWhatsApp } from "./whatsapp.service.js";

const renderTemplate = (text, invoice) => {
  const values = {
    clientName: invoice.client?.name || "Customer",
    invoiceNumber: invoice.invoiceNumber || "",
    amount: String(invoice.amount ?? ""),
    dueDate: invoice.dueDate
      ? new Date(invoice.dueDate).toDateString()
      : "",
  };

  return String(text || "").replace(
    /{{\s*(clientName|invoiceNumber|amount|dueDate)\s*}}/g,
    (_, key) => values[key] ?? ""
  );
};

const getDaysOffset = (dueDate, now = new Date()) => {
  const due = new Date(dueDate);
  const today = new Date(now);

  const dueDay = Date.UTC(
    due.getUTCFullYear(),
    due.getUTCMonth(),
    due.getUTCDate()
  );

  const todayDay = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );

  return Math.round((todayDay - dueDay) / 86400000);
};

// Uses the server's local timezone.
const getTodayRange = (now = new Date()) => {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

export const processReminders = async () => {
  console.log("Starting reminder processing...");

  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        status: {
          in: ["PENDING", "PARTIAL"],
        },
      },
      include: {
        client: true,
      },
    });

    console.log(`Found ${invoices.length} unpaid invoice(s).`);

    for (const invoice of invoices) {
      let rule = null;
      let originalSubject = "";
      let originalContent = "";
      let finalSubject = "";
      let finalContent = "";

      try {
        const now = new Date();
        const daysOffset = getDaysOffset(invoice.dueDate, now);

        console.log(
          `Checking ${invoice.invoiceNumber} | daysOffset: ${daysOffset}`
        );

        // 1. Find the applicable active rule.
        rule = await prisma.escalationRule.findFirst({
          where: {
            organizationId: invoice.organizationId,
            daysOffset,
            isActive: true,
          },
          include: {
            template: true,
          },
        });

        if (!rule) {
          continue;
        }

        if (!rule.template) {
          throw new Error(`Template missing for rule ${rule.id}`);
        }

        // 2. Condition: do not send before nextReminder.
        // Assumes nextReminder exists on the Invoice model.
        if (
          invoice.nextReminder &&
          now < new Date(invoice.nextReminder)
        ) {
          console.log(
            `Skipping ${invoice.invoiceNumber}: next reminder is not due yet.`
          );
          continue;
        }

       
const { start, end } = getTodayRange(now);

const alreadySentToday = await prisma.escalationLog.findFirst({
  where: {
    invoiceId: invoice.id,
    channel: rule.channel,
    status: "SENT",
    sentAt: {
      gte: start,
      lt: end,
    },
  },
});

if (alreadySentToday) {
  console.log(
    `Skipping ${invoice.invoiceNumber}: reminder already sent today.`
  );
  continue;
}

        // 4. Render the saved template.
        originalSubject =
          renderTemplate(rule.template.subject, invoice) ||
          `${rule.stage} reminder - ${invoice.invoiceNumber}`;

        originalContent = renderTemplate(
          rule.template.content,
          invoice
        );

        if (!originalContent.trim()) {
          throw new Error("Reminder template content is empty");
        }

        // 5. Personalize the message with AI.
        const aiResult = await personalizeReminder({
          subject: originalSubject,
          content: originalContent,
          clientName: invoice.client?.name || "Customer",
          invoiceNumber: invoice.invoiceNumber,
          amount: String(invoice.amount ?? ""),
          dueDate: invoice.dueDate
            ? new Date(invoice.dueDate).toDateString()
            : "",
          channel: rule.channel,
        });

        finalSubject =
          aiResult?.subject?.trim() || originalSubject;

        finalContent =
          aiResult?.content?.trim() || originalContent;

        // 6. Recheck invoice status immediately before sending.
        const currentInvoice = await prisma.invoice.findUnique({
          where: {
            id: invoice.id,
          },
          select: {
            status: true,
          },
        });

        if (!currentInvoice) {
          console.log(`Invoice ${invoice.invoiceNumber} no longer exists.`);
          continue;
        }

        if (!["PENDING", "PARTIAL"].includes(currentInvoice.status)) {
          console.log(
            `Skipping ${invoice.invoiceNumber}; status is ${currentInvoice.status}.`
          );
          continue;
        }

        // 7. Send through the selected channel.
        switch (rule.channel) {
          case "EMAIL": {
            if (!invoice.client?.email) {
              throw new Error("Client email address is missing");
            }

            const emailResult = await sendEmail({
              to: invoice.client.email,
              subject: finalSubject,
              message: finalContent,
              organizationId: invoice.organizationId,
            });

            console.log(`Email sent for ${invoice.invoiceNumber}`, {
              messageId: emailResult?.messageId,
              response: emailResult?.response,
            });

            break;
          }

          case "SMS": {
            if (!invoice.client?.phone) {
              throw new Error("Client phone number is missing");
            }

            await sendSMS({
              phone: invoice.client.phone,
              message: finalContent,
            });

            break;
          }

          case "WHATSAPP": {
            if (!invoice.client?.phone) {
              throw new Error("Client phone number is missing");
            }

            await sendWhatsApp({
              phone: invoice.client.phone,
              message: finalContent,
            });

            break;
          }

          default:
            throw new Error(`Unsupported channel: ${rule.channel}`);
        }

        // 8. Log successful delivery.
        await prisma.escalationLog.create({
          data: {
            invoiceId: invoice.id,
            channel: rule.channel,
            subject: finalSubject,
            content: finalContent,
            status: "SENT",
            response: "Message accepted by delivery provider",
          },
        });

        console.log(
          `Reminder completed for ${invoice.invoiceNumber} (${rule.stage}).`
        );
      } catch (error) {
        console.error(
          `Reminder failed for ${invoice.invoiceNumber}:`,
          error
        );

        // Record failure. Failed logs do not block a future retry.
        try {
          await prisma.escalationLog.create({
            data: {
              invoiceId: invoice.id,
              channel: rule?.channel || "EMAIL",
              subject:
                finalSubject ||
                originalSubject ||
                `Reminder - ${invoice.invoiceNumber}`,
              content: finalContent || originalContent || "",
              status: "FAILED",
              response: error.message || "Unknown error",
            },
          });
        } catch (logError) {
          console.error(
            `Failed to save escalation log for ${invoice.invoiceNumber}:`,
            logError.message
          );
        }
      }
    }

    console.log("Reminder processing completed.");
  } catch (error) {
    console.error("Reminder Scheduler Error:", error.message);
    throw error;
  }
};
