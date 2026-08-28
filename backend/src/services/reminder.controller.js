import sendEmail from "../services/mail.service.js";

import {
  prisma,
} from "../db/db.js";


export const sendInvoiceReminder =
  async (req, res) => {

    try {

      const {
        invoiceId,
        message,
        subject,
        organizationId,
      } = req.body;


      /* ======================================
         VALIDATION
      ====================================== */

      if (!invoiceId) {

        return res.status(400).json({

          success: false,

          message:
            "invoiceId is required",

        });

      }


      if (!organizationId) {

        return res.status(400).json({

          success: false,

          message:
            "organizationId is required",

        });

      }


      if (!message) {

        return res.status(400).json({

          success: false,

          message:
            "message is required",

        });

      }


      if (!subject) {

        return res.status(400).json({

          success: false,

          message:
            "subject is required",

        });

      }


      /* ======================================
         FIND INVOICE
      ====================================== */

      const invoice =
        await prisma.invoice.findUnique({

          where: {
            id: invoiceId,
          },

          include: {
            client: true,
          },

        });


      if (!invoice) {

        return res.status(404).json({

          success: false,

          message:
            "Invoice not found",

        });

      }


      /* ======================================
         CHECK CLIENT
      ====================================== */

      if (!invoice.client) {

        return res.status(404).json({

          success: false,

          message:
            "Client not found",

        });

      }


      if (!invoice.client.email) {

        return res.status(400).json({

          success: false,

          message:
            "Client does not have an email address",

        });

      }


      /* ======================================
         SEND EMAIL
      ====================================== */

      const result =
        await sendEmail({

          to:
            invoice.client.email,

          subject,

          message,

          organizationId,

        });


      /* ======================================
         SAVE COMMUNICATION LOG
      ====================================== */

      await prisma.escalationLog.create({

        data: {

          invoiceId,

          organizationId,

          channel: "EMAIL",

          content: message,

          status: "SENT",

          subject,

          sentAt: new Date(),

        },

      });


      /* ======================================
         RESPONSE
      ====================================== */

      return res.status(200).json({

        success: true,

        message:
          "Invoice reminder sent successfully",

        data: result,

      });

    } catch (error) {

      console.error(
        "SEND INVOICE REMINDER ERROR:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          error.message ||
          "Failed to send invoice reminder",

      });

    }

  };