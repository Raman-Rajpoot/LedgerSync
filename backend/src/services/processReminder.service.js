import { prisma } from "../db/db.js";
import sendEmail from "../services/mail.service.js";
import { sendSMS } from "./sms.service.js";
import { sendWhatsApp } from "./whatsapp.service.js";

export const processReminders = async () => {

    try {

        const today = new Date();

        // 1. Get all invoices that still need reminders
        const invoices = await prisma.invoice.findMany({
            where: {
                status: {
                    in: ["PENDING", "PARTIAL"]
                }
            },
            include: {
                client: true
            }
        });

        for (const invoice of invoices) {

            // 2. Calculate how many days from due date
            const daysOffset = Math.floor(
                (today.getTime() - invoice.dueDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            // 3. Find matching escalation rule
            const rule = await prisma.escalationRule.findFirst({
                where: {
                    organizationId: invoice.organizationId,
                    daysOffset,
                    isActive: true
                },
                include: {
                    template: true
                }
            });

            if (!rule) continue;

            // 4. Check duplicate reminder (by invoice, channel and subject)
            const alreadySent = await prisma.escalationLog.findFirst({
                where: {
                    invoiceId: invoice.id,
                    channel: rule.channel,
                    subject
                }
            });

            if (alreadySent) continue;

            // 5. Load template
            let subject = rule.template.subject || "";
            let content = rule.template.content;

            // 6. Replace variables
            subject = subject
                .replace(/{{clientName}}/g, invoice.client.name)
                .replace(/{{invoiceNumber}}/g, invoice.invoiceNumber)
                .replace(/{{amount}}/g, invoice.amount)
                .replace(/{{dueDate}}/g, invoice.dueDate.toDateString());

            content = content
                .replace(/{{clientName}}/g, invoice.client.name)
                .replace(/{{invoiceNumber}}/g, invoice.invoiceNumber)
                .replace(/{{amount}}/g, invoice.amount)
                .replace(/{{dueDate}}/g, invoice.dueDate.toDateString());

            // 7. AI Personalization (optional)
            // content = await rewriteWithAI(content);

            // 8. Send communication
            switch (rule.channel) {

                case "EMAIL":
                    await sendEmail({
                        to: invoice.client.email,
                        subject,
                        message: content,
                        organizationId: invoice.organizationId,
                    });
                    break;

                case "SMS":
                    await sendSMS({
                        phone: invoice.client.phone,
                        message: content,
                    });
                    break;

                case "WHATSAPP":
                    await sendWhatsApp({
                        phone: invoice.client.phone,
                        message: content,
                    });
                    break;
            }

            // 9. Save escalation log
            await prisma.escalationLog.create({
                data: {
                    invoiceId: invoice.id,
                    channel: rule.channel,
                    subject,
                    content,
                    status: "SENT"
                }
            });

            console.log(
                `${rule.stage} sent for ${invoice.invoiceNumber}`
            );
        }

    } catch (error) {

        console.error("Reminder Scheduler Error:", error);

    }

};