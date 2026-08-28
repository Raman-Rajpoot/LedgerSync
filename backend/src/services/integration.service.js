import nodemailer from "nodemailer";
import twilio from "twilio";

import { prisma } from "../db/db.js";

import {
  decrypt,
} from "../utils/encryption.js";


/* ==========================================
   GET ORGANIZATION INTEGRATION
========================================== */

export const getOrgIntegration = async ({
  organizationId,
  type,
}) => {

  if (!organizationId) {
    throw new Error(
      "organizationId is required"
    );
  }

  if (!type) {
    throw new Error(
      "Integration type is required"
    );
  }

  const integration =
    await prisma.integration.findUnique({
      where: {
        organizationId_type: {
          organizationId,
          type,
        },
      },
    });

  if (!integration) {
    return null;
  }

  if (!integration.isActive) {
    return null;
  }

  return integration;
};


/* ==========================================
   GET EMAIL MAILER
========================================== */

export const getMailer = async (
  organizationId
) => {

  const integration =
    await getOrgIntegration({
      organizationId,
      type: "EMAIL",
    });

  if (!integration) {
    return null;
  }

  const config = integration.config;

  if (!config) {
    throw new Error(
      "Email integration configuration is missing"
    );
  }

  if (
    !config.host ||
    !config.username ||
    !config.password
  ) {
    throw new Error(
      "Email integration configuration is incomplete"
    );
  }

  /*
   * Password was encrypted before
   * being stored in database.
   */

  const password =
    decrypt(config.password);


  const port =
    Number(config.port) || 587;


  const transporter =
    nodemailer.createTransport({

      host: config.host,

      port,

      secure:
        port === 465,

      auth: {

        user: config.username,

        pass: password,

      },

    });


  return {

    transporter,

    fromEmail:
      config.fromEmail ||
      config.username,

    fromName:
      config.fromName ||
      "LedgerSync",

  };
};


/* ==========================================
   GET TWILIO CLIENT
========================================== */

export const getTwilioClient = async (
  organizationId
) => {

  const integration =
    await getOrgIntegration({
      organizationId,
      type: "TWILIO",
    });

  if (!integration) {
    return null;
  }

  const config = integration.config;

  if (!config) {
    throw new Error(
      "Twilio integration configuration is missing"
    );
  }

  if (
    !config.accountSid ||
    !config.authToken
  ) {
    throw new Error(
      "Twilio integration configuration is incomplete"
    );
  }


  /*
   * Auth token was encrypted
   * before storing it.
   */

  const authToken =
    decrypt(config.authToken);


  const client =
    twilio(
      config.accountSid,
      authToken
    );


  return {

    client,

    phoneNumber:
      config.phoneNumber,

    whatsappNumber:
      config.whatsappNumber ||
      config.phoneNumber,

  };
};