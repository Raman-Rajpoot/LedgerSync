
import nodemailer from "nodemailer";
import twilio from "twilio";

import { prisma } from "../db/db.js";
import { decrypt } from "../utils/encryption.js";

const toProviderType = (type) => String(type || "").toUpperCase();

const parseEncryptedConfig = (integration) => {
  if (!integration?.encryptedKey) {
    return null;
  }

  try {
    return JSON.parse(decrypt(integration.encryptedKey));
  } catch (error) {
    console.error("Failed to decode integration config:", error.message);
    throw new Error("Unable to decrypt integration configuration");
  }
};

// Cache the Ethereal account promise so it isn't recreated per email.
let etherealAccountPromise = null;

const getEtherealAccount = async () => {
  if (!etherealAccountPromise) {
    etherealAccountPromise = nodemailer
      .createTestAccount()
      .catch((error) => {
        etherealAccountPromise = null;
        throw error;
      });
  }

  return etherealAccountPromise;
};

export const getOrgIntegration = async ({ organizationId, type }) => {
  if (!organizationId) {
    throw new Error("organizationId is required");
  }

  const provider = toProviderType(type);

  if (!["EMAIL", "TWILIO"].includes(provider)) {
    throw new Error("Invalid integration type");
  }

  return prisma.integration.findFirst({
    where: {
      organizationId,
      provider,
    },
  });
};



export const getMailer = async () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;


  console.log(host, port, user, pass);
  if (!host || !user || !pass) {


    throw new Error("SMTP environment variables are missing");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  });

  return {
    transporter,
    fromEmail: process.env.SMTP_FROM_EMAIL || user,
    fromName: process.env.SMTP_FROM_NAME || "LedgerSync",
  };
};



export const verifyMailer = async (organizationId) => {
  const mailer = await getMailer(organizationId);

  if (!mailer) {
    throw new Error("Email integration is not configured");
  }

  await mailer.transporter.verify();

  return {
    success: true,
    isTestMode: mailer.isTestMode,
    message: mailer.isTestMode
      ? "SMTP connection verified. Emails are captured by Ethereal."
      : "SMTP connection verified.",
  };
};

export const getTwilioClient = async (organizationId) => {
  const integration = await getOrgIntegration({
    organizationId,
    type: "TWILIO",
  });

  if (!integration) {
    return null;
  }

  const config = parseEncryptedConfig(integration);

  if (!config) {
    throw new Error("Twilio integration configuration is missing");
  }

  if (!config.accountSid || !config.authToken) {
    throw new Error("Twilio integration configuration is incomplete");
  }

  const client = twilio(config.accountSid, config.authToken);

  return {
    client,
    accountSid: config.accountSid,
    phoneNumber: config.phoneNumber,
    whatsappNumber: config.whatsappNumber || config.phoneNumber,
  };
};
