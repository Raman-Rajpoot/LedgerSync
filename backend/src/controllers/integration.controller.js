import { prisma } from "../db/db.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import {
  getOrgIntegration,
  getMailer,
  getTwilioClient,
} from "../services/integration.service.js";

const getOrganizationId = (req) =>
  req.user?.organizationId ??
  req.query?.organizationId ??
  req.query?.organisationId ??
  req.body?.organizationId ??
  req.body?.organisationId;

const parseEncryptedConfig = (integration) => {
  if (!integration?.encryptedKey) {
    return null;
  }

  try {
    return JSON.parse(decrypt(integration.encryptedKey));
  } catch (error) {
    console.error("Failed to parse encrypted integration config", error);
    return null;
  }
};

export const getIntegrations = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId is required",
      });
    }

    const integrations = await prisma.integration.findMany({
      where: { organizationId },
    });

    const data = {
      email: {
        connected: false,
        host: "",
        port: "587",
        username: "",
        fromEmail: "",
        fromName: "",
      },
      twilio: {
        connected: false,
        accountSid: "",
        phoneNumber: "",
      },
    };

    for (const integration of integrations) {
      const config = parseEncryptedConfig(integration);
      if (!config) continue;

      if (integration.provider === "EMAIL") {
        data.email = {
          connected: true,
          host: config.host || "",
          port: config.port ? String(config.port) : "587",
          username: config.username || "",
          fromEmail: config.fromEmail || "",
          fromName: config.fromName || "",
        };
      }

      if (integration.provider === "TWILIO") {
        data.twilio = {
          connected: true,
          accountSid: config.accountSid || "",
          phoneNumber: config.phoneNumber || "",
        };
      }
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("GET INTEGRATIONS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch integrations",
    });
  }
};

export const saveEmailIntegration = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);
    const { config } = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization is required",
      });
    }

    if (!config) {
      return res.status(400).json({
        success: false,
        message: "Email configuration is required",
      });
    }

    if (
      !config.host ||
      !config.port ||
      !config.username ||
      !config.password ||
      !config.fromEmail
    ) {
      return res.status(400).json({
        success: false,
        message: "SMTP host, port, username, password and fromEmail are required",
      });
    }

    const emailConfig = {
      host: config.host,
      port: Number(config.port),
      username: config.username,
      password: config.password,
      fromEmail: config.fromEmail,
      fromName: config.fromName || "LedgerSync",
    };

    const encryptedKey = encrypt(JSON.stringify(emailConfig));

    let integration = await prisma.integration.findFirst({
      where: {
        organizationId,
        provider: "EMAIL",
      },
    });

    if (integration) {
      integration = await prisma.integration.update({
        where: { id: integration.id },
        data: { encryptedKey },
      });
    } else {
      integration = await prisma.integration.create({
        data: {
          organizationId,
          provider: "EMAIL",
          encryptedKey,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Email integration saved successfully",
      data: {
        id: integration.id,
        provider: integration.provider,
        connected: true,
      },
    });
  } catch (error) {
    console.error("SAVE EMAIL INTEGRATION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save email integration",
    });
  }
};

export const saveTwilioIntegration = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);
    const { config } = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId is required",
      });
    }

    const accountSid = config?.accountSid ?? req.body.accountSid;
    const authToken = config?.authToken ?? req.body.authToken;
    const phoneNumber = config?.phoneNumber ?? req.body.phoneNumber;

    if (!accountSid || !authToken || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Account SID, Auth Token and phone number are required",
      });
    }

    const twilioConfig = {
      accountSid,
      authToken,
      phoneNumber,
    };

    const encryptedKey = encrypt(JSON.stringify(twilioConfig));

    let integration = await prisma.integration.findFirst({
      where: {
        organizationId,
        provider: "TWILIO",
      },
    });

    if (integration) {
      integration = await prisma.integration.update({
        where: { id: integration.id },
        data: { encryptedKey },
      });
    } else {
      integration = await prisma.integration.create({
        data: {
          organizationId,
          provider: "TWILIO",
          encryptedKey,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Twilio integration saved successfully",
      data: {
        id: integration.id,
        connected: true,
      },
    });
  } catch (error) {
    console.error("SAVE TWILIO INTEGRATION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save Twilio integration",
    });
  }
};

export const testEmailIntegration = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId is required",
      });
    }

    const mailer = await getMailer(organizationId);
    if (!mailer) {
      return res.status(400).json({
        success: false,
        message: "Email integration is not configured",
      });
    }

    await mailer.transporter.verify();

    return res.status(200).json({
      success: true,
      message: "Email connection successful",
    });
  } catch (error) {
    console.error("TEST EMAIL ERROR:", error);
    return res.status(400).json({
      success: false,
      message: "Email connection failed",
      error: error.message,
    });
  }
};

export const testTwilioIntegration = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId is required",
      });
    }

    const twilioClient = await getTwilioClient(organizationId);
    if (!twilioClient) {
      return res.status(400).json({
        success: false,
        message: "Twilio integration is not configured",
      });
    }

    await twilioClient.client.api.accounts.get(twilioClient.accountSid).fetch();

    return res.status(200).json({
      success: true,
      message: "Twilio connection successful",
    });
  } catch (error) {
    console.error("TEST TWILIO ERROR:", error);
    return res.status(400).json({
      success: false,
      message: "Twilio connection failed",
      error: error.message,
    });
  }
};

export const deleteIntegration = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);
    const { type } = req.params;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId is required",
      });
    }

    const integrationType = String(type || "").toUpperCase();
    if (!integrationType || !["EMAIL", "TWILIO"].includes(integrationType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid integration type",
      });
    }

    await prisma.integration.deleteMany({
      where: {
        organizationId,
        provider: integrationType,
      },
    });

    return res.status(200).json({
      success: true,
      message: `${type} integration disconnected successfully`,
    });
  } catch (error) {
    console.error("DELETE INTEGRATION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to disconnect integration",
    });
  }
};