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
    console.error("Failed to decode integration config:", error);
    return null;
  }
};

export const getOrgIntegration = async ({ organizationId, type }) => {
  if (!organizationId) {
    throw new Error("organizationId is required");
  }

  const provider = toProviderType(type);
  if (!provider) {
    throw new Error("Integration type is required");
  }

  const integration = await prisma.integration.findFirst({
    where: {
      organizationId,
      provider,
    },
  });

  return integration;
};

export const getMailer = async (organizationId) => {
  const integration = await getOrgIntegration({
    organizationId,
    type: "EMAIL",
  });

  if (!integration) {
    return null;
  }

  const config = parseEncryptedConfig(integration);
  if (!config) {
    throw new Error("Email integration configuration is missing");
  }

  if (!config.host || !config.username || !config.password) {
    throw new Error("Email integration configuration is incomplete");
  }

  const password = config.password;
  const port = Number(config.port) || 587;

  const transporter = nodemailer.createTransport({
    host: config.host,
    port,
    secure: port === 465,
    auth: {
      user: config.username,
      pass: password,
    },
  });

  return {
    transporter,
    fromEmail: config.fromEmail || config.username,
    fromName: config.fromName || "LedgerSync",
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

  const authToken = config.authToken;
  const client = twilio(config.accountSid, authToken);

  return {
    client,
    accountSid: config.accountSid,
    phoneNumber: config.phoneNumber,
    whatsappNumber: config.whatsappNumber || config.phoneNumber,
  };
};