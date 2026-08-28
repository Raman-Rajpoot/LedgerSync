import {prisma} from "../db/db.js";

import {
  encrypt,
  decrypt,
} from "../utils/encryption.js";

import {
  getOrgIntegration,
  getMailer,
  getTwilioClient,
} from "../services/integration.service.js";

/*
|--------------------------------------------------------------------------
| GET ALL INTEGRATIONS
|--------------------------------------------------------------------------
*/

export const getIntegrations = async (req, res) => {
  try {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId is required",
      });
    }

    const integrations =
      await prisma.integration.findMany({
        where: {
          organizationId,
        },
      });

    /*
     * Never send passwords/tokens to frontend.
     */

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
      if (integration.type === "EMAIL") {
        data.email = {
          connected: integration.isActive,

          host:
            integration.config?.host || "",

          port:
            integration.config?.port || "587",

          username:
            integration.config?.username || "",

          fromEmail:
            integration.config?.fromEmail || "",

          fromName:
            integration.config?.fromName || "",
        };
      }

      if (integration.type === "TWILIO") {
        data.twilio = {
          connected: integration.isActive,

          accountSid:
            integration.config?.accountSid || "",

          phoneNumber:
            integration.config?.phoneNumber || "",
        };
      }
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "GET INTEGRATIONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch integrations",
    });
  }
};


/*
|--------------------------------------------------------------------------
| SAVE EMAIL / SMTP
|--------------------------------------------------------------------------
*/

export const saveEmailIntegration = async (
  req,
  res
) => {
  try {
    const {
      organizationId,
      host,
      port,
      username,
      password,
      fromEmail,
      fromName,
    } = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId is required",
      });
    }

    if (
      !host ||
      !port ||
      !username ||
      !password ||
      !fromEmail
    ) {
      return res.status(400).json({
        success: false,
        message:
          "SMTP host, port, username, password and fromEmail are required",
      });
    }

    /*
     * Encrypt sensitive credentials.
     */

    const encryptedPassword =
      encrypt(password);

    /*
     * Store configuration.
     *
     * Adjust `config` depending on your Prisma
     * Integration model.
     */

    const integration =
      await prisma.integration.upsert({
        where: {
          organizationId_type: {
            organizationId,
            type: "EMAIL",
          },
        },

        update: {
          config: {
            host,
            port,
            username,
            password: encryptedPassword,
            fromEmail,
            fromName,
          },

          isActive: true,
        },

        create: {
          organizationId,

          type: "EMAIL",

          config: {
            host,
            port,
            username,
            password: encryptedPassword,
            fromEmail,
            fromName,
          },

          isActive: true,
        },
      });

    return res.status(200).json({
      success: true,
      message: "Email integration saved successfully",
      data: {
        id: integration.id,
        connected: integration.isActive,
      },
    });
  } catch (error) {
    console.error(
      "SAVE EMAIL INTEGRATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to save email integration",
    });
  }
};


/*
|--------------------------------------------------------------------------
| SAVE TWILIO
|--------------------------------------------------------------------------
*/

export const saveTwilioIntegration = async (
  req,
  res
) => {
  try {
    const {
      organizationId,
      accountSid,
      authToken,
      phoneNumber,
    } = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId is required",
      });
    }

    if (
      !accountSid ||
      !authToken ||
      !phoneNumber
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Account SID, Auth Token and phone number are required",
      });
    }

    const encryptedToken =
      encrypt(authToken);

    const integration =
      await prisma.integration.upsert({
        where: {
          organizationId_type: {
            organizationId,
            type: "TWILIO",
          },
        },

        update: {
          config: {
            accountSid,
            authToken: encryptedToken,
            phoneNumber,
          },

          isActive: true,
        },

        create: {
          organizationId,

          type: "TWILIO",

          config: {
            accountSid,
            authToken: encryptedToken,
            phoneNumber,
          },

          isActive: true,
        },
      });

    return res.status(200).json({
      success: true,
      message: "Twilio integration saved successfully",
      data: {
        id: integration.id,
        connected: integration.isActive,
      },
    });
  } catch (error) {
    console.error(
      "SAVE TWILIO INTEGRATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to save Twilio integration",
    });
  }
};


/*
|--------------------------------------------------------------------------
| TEST EMAIL
|--------------------------------------------------------------------------
*/

export const testEmailIntegration = async (
  req,
  res
) => {
  try {
    const { organizationId } =
      req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId is required",
      });
    }

    /*
     * Use your existing mail service.
     */

    const mailer =
      await getMailer(
        organizationId
      );

    if (!mailer) {
      return res.status(400).json({
        success: false,
        message:
          "Email integration is not configured",
      });
    }

    /*
     * Verify SMTP connection.
     */

    await mailer.verify();

    return res.status(200).json({
      success: true,
      message:
        "Email connection successful",
    });
  } catch (error) {
    console.error(
      "TEST EMAIL ERROR:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        "Email connection failed",
      error: error.message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| TEST TWILIO
|--------------------------------------------------------------------------
*/

export const testTwilioIntegration = async (
  req,
  res
) => {
  try {
    const { organizationId } =
      req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId is required",
      });
    }

    /*
     * Use your existing Twilio service.
     */

    const twilioClient =
      await getTwilioClient(
        organizationId
      );

    if (!twilioClient) {
      return res.status(400).json({
        success: false,
        message:
          "Twilio integration is not configured",
      });
    }

    /*
     * Fetch account information.
     *
     * This verifies that the credentials
     * actually work.
     */

    await twilioClient.api
      .accounts
      .get(
        twilioClient.accountSid
      )
      .fetch();

    return res.status(200).json({
      success: true,
      message:
        "Twilio connection successful",
    });
  } catch (error) {
    console.error(
      "TEST TWILIO ERROR:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        "Twilio connection failed",
      error: error.message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| DELETE / DISCONNECT INTEGRATION
|--------------------------------------------------------------------------
*/

export const deleteIntegration = async (
  req,
  res
) => {
  try {
    const {
      organizationId,
    } = req.body;

    const { type } = req.params;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId is required",
      });
    }

    let integrationType;

    if (type === "email") {
      integrationType = "EMAIL";
    }

    if (type === "twilio") {
      integrationType = "TWILIO";
    }

    if (!integrationType) {
      return res.status(400).json({
        success: false,
        message: "Invalid integration type",
      });
    }

    /*
     * Don't delete the integration.
     *
     * Just disable it so historical information
     * remains available.
     */

    await prisma.integration.updateMany({
      where: {
        organizationId,
        type: integrationType,
      },

      data: {
        isActive: false,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        `${type} integration disconnected successfully`,
    });
  } catch (error) {
    console.error(
      "DELETE INTEGRATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to disconnect integration",
    });
  }
};