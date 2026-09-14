import { prisma } from "../db/db.js";
import nodemailer from "nodemailer";
import twilio from "twilio";
import crypto from "crypto";
import validator from "validator";

const getOrgId = (req) => req.user?.organizationId ?? req.organizationId;

const ENCRYPTION_SECRET = process.env.INTEGRATION_ENCRYPTION_KEY;

// -----------------------------
// Decrypt Integration
// -----------------------------
function decrypt(encryptedKey) {
  const [ivHex, tagHex, dataHex] = encryptedKey.split(":");

  const key = Buffer.from(ENCRYPTION_SECRET, "hex");

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

async function getOrgIntegration(organizationId, provider) {
  const integration = await prisma.integration.findFirst({
    where: {
      organizationId,
      provider,
    },
  });

  if (!integration) return null;

  return JSON.parse(decrypt(integration.encryptedKey));
}

// -----------------------------
// Mailer
// -----------------------------
async function getMailer(organizationId) {
  const config = await getOrgIntegration(organizationId, "smtp");

  return nodemailer.createTransport({
    host: config?.host || process.env.SMTP_HOST,
    port: Number(config?.port || process.env.SMTP_PORT),
    secure: Number(config?.port || process.env.SMTP_PORT) === 465,
    auth: {
      user: config?.user || process.env.SMTP_USER,
      pass: config?.pass || process.env.SMTP_PASS,
    },
  });
}

// -----------------------------
// Twilio
// -----------------------------
async function getTwilioClient(organizationId) {
  const config = await getOrgIntegration(organizationId, "twilio");

  return {
    client: twilio(
      config?.accountSid || process.env.TWILIO_ACCOUNT_SID,
      config?.authToken || process.env.TWILIO_AUTH_TOKEN
    ),
    smsFrom: config?.smsFrom || process.env.TWILIO_SMS_FROM,
    whatsappFrom:
      config?.whatsappFrom || process.env.TWILIO_WHATSAPP_FROM,
  };
}

// -----------------------------
// Invoice
// -----------------------------
async function getOrgInvoice(invoiceId, organizationId) {
  return prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      organizationId,
    },
    include: {
      client: true,
    },
  });
}

// -----------------------------
// Escalation Logger
// -----------------------------
async function logEscalation({
  invoiceId,
  channel,
  recipient,
  subject = null,
  content,
  status,
  providerId = null,
  error = null,
}) {
  return prisma.escalationLog.create({
    data: {
      invoiceId,
      channel,
      recipient,
      subject,
      content,
      status,
      providerMessageId: providerId,
      error,
    },
  });
}

// ==========================================================
// SEND EMAIL
// ==========================================================

export const sendEmail = async (req, res) => {
  const organizationId = getOrgId(req);
  const { invoiceId } = req.params;

  const { to, subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({
      success: false,
      error: "Subject and message are required.",
    });
  }

  try {
    const invoice = await getOrgInvoice(
      invoiceId,
      organizationId
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found.",
      });
    }

    const recipient = to || invoice.client.email;

    if (!recipient) {
      return res.status(400).json({
        success: false,
        error: "Client email not found.",
      });
    }

    if (!validator.isEmail(recipient)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email address.",
      });
    }

    const transporter = await getMailer(organizationId);

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: recipient,
      subject,
      text: message,
    });

    const log = await logEscalation({
      invoiceId,
      channel: "EMAIL",
      recipient,
      subject,
      content: message,
      status: "SENT",
      providerId: info.messageId,
    });

    return res.status(200).json({
      success: true,
      message: "Email sent successfully.",
      data: log,
    });
  } catch (err) {
    console.error(err);

    await logEscalation({
      invoiceId,
      channel: "EMAIL",
      recipient: req.body.to || null,
      subject: req.body.subject,
      content: req.body.message,
      status: "FAILED",
      error: err.message,
    });

    return res.status(500).json({
      success: false,
      error: "Failed to send email.",
    });
  }
};

// ==========================================================
// SEND SMS
// ==========================================================

export const sendSMS = async (req, res) => {
  const organizationId = getOrgId(req);

  const { invoiceId } = req.params;

  const { to, message } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: "Message is required.",
    });
  }

  try {
    const invoice = await getOrgInvoice(
      invoiceId,
      organizationId
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found.",
      });
    }

    const recipient = to || invoice.client.phone;

    if (!recipient) {
      return res.status(400).json({
        success: false,
        error: "Client phone number not found.",
      });
    }

    if (!validator.isMobilePhone(recipient, "any")) {
      return res.status(400).json({
        success: false,
        error: "Invalid phone number.",
      });
    }

    const { client, smsFrom } =
      await getTwilioClient(organizationId);

    const sms = await client.messages.create({
      from: smsFrom,
      to: recipient,
      body: message,
    });

    const log = await logEscalation({
      invoiceId,
      channel: "SMS",
      recipient,
      content: message,
      status: "SENT",
      providerId: sms.sid,
    });

    return res.status(200).json({
      success: true,
      message: "SMS sent successfully.",
      sid: sms.sid,
      data: log,
    });
  } catch (err) {
    console.error(err);

    await logEscalation({
      invoiceId,
      channel: "SMS",
      recipient: req.body.to || null,
      content: req.body.message,
      status: "FAILED",
      error: err.message,
    });

    return res.status(500).json({
      success: false,
      error: "Failed to send SMS.",
    });
  }
};

// ==========================================================
// SEND WHATSAPP
// ==========================================================

export const sendWhatsApp = async (req, res) => {
  const organizationId = getOrgId(req);

  const { invoiceId } = req.params;

  const { to, message } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: "Message is required.",
    });
  }

  try {
    const invoice = await getOrgInvoice(
      invoiceId,
      organizationId
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found.",
      });
    }

    const recipient = to || invoice.client.phone;

    if (!recipient) {
      return res.status(400).json({
        success: false,
        error: "Client phone number not found.",
      });
    }

    if (!validator.isMobilePhone(recipient, "any")) {
      return res.status(400).json({
        success: false,
        error: "Invalid phone number.",
      });
    }

    const { client, whatsappFrom } =
      await getTwilioClient(organizationId);

    const whatsapp = await client.messages.create({
      from: `whatsapp:${whatsappFrom}`,
      to: `whatsapp:${recipient}`,
      body: message,
    });

    const log = await logEscalation({
      invoiceId,
      channel: "WHATSAPP",
      recipient,
      content: message,
      status: "SENT",
      providerId: whatsapp.sid,
    });

    return res.status(200).json({
      success: true,
      message: "WhatsApp message sent successfully.",
      sid: whatsapp.sid,
      data: log,
    });
  } catch (err) {
    console.error(err);

    await logEscalation({
      invoiceId,
      channel: "WHATSAPP",
      recipient: req.body.to || null,
      content: req.body.message,
      status: "FAILED",
      error: err.message,
    });

    return res.status(500).json({
      success: false,
      error: "Failed to send WhatsApp message.",
    });
  }
};



export const getAllReminders = async (req, res) => {
  try {
    const organizationId = getOrgId(req);

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Organization not found",
      });
    }

    const {
      page = 1,
      limit = 10,
      enabled,
      search,
    } = req.query;

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(Number(limit) || 10, 1),
      100
    );

    const where = {
      invoice: {
        organizationId,
      },
    };


    // --------------------------------------
    // ENABLED FILTER
    // --------------------------------------

    if (enabled !== undefined) {
      where.enabled =
        enabled === "true";
    }


    // --------------------------------------
    // SEARCH
    // Invoice number / client name
    // --------------------------------------

    if (search) {
      where.invoice = {
        organizationId,

        OR: [
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
        ],
      };
    }


    // --------------------------------------
    // FETCH
    // --------------------------------------

    const [reminders, total] =
      await Promise.all([
        prisma.reminder.findMany({
          where,

          include: {
            invoice: {
              include: {
                client: true,
              },
            },
          },

          skip:
            (pageNumber - 1) *
            limitNumber,

          take: limitNumber,

          orderBy: {
            updatedAt: "asc",
          },
        }),

        prisma.reminder.count({
          where,
        }),
      ]);


    return res.status(200).json({
      success: true,

      total,

      page: pageNumber,

      limit: limitNumber,

      totalPages: Math.ceil(
        total / limitNumber
      ),

      data: reminders,
    });

  } catch (error) {
    console.error(
      "GET ALL REMINDERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch reminders",
    });
  }
};


// ==========================================
// GET SINGLE REMINDER
// GET /v1/api/reminders/:id
// ==========================================

export const getReminder = async (
  req,
  res
) => {
  try {
    const organizationId = getOrgId(req);

    const { id } = req.params;


    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Organization not found",
      });
    }


    const reminder =
      await prisma.reminder.findFirst({
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
              payments: true,
              escalationLogs: {
                orderBy: {
                  createdAt: "desc",
                },
              },
            },
          },
        },
      });


    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found",
      });
    }


    return res.status(200).json({
      success: true,
      data: reminder,
    });

  } catch (error) {
    console.error(
      "GET REMINDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch reminder",
    });
  }
};