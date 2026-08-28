import {
  getTwilioClient,
} from "./integration.service.js";


export const sendWhatsApp =
  async ({
    phone,
    message,
    organizationId,
  }) => {

    if (!organizationId) {
      throw new Error(
        "organizationId is required"
      );
    }


    const twilioData =
      await getTwilioClient(
        organizationId
      );


    if (!twilioData) {
      throw new Error(
        "Twilio integration is not configured for this organization"
      );
    }


    const whatsappNumber =
      twilioData.whatsappNumber;


    if (!whatsappNumber) {
      throw new Error(
        "Twilio WhatsApp number is not configured"
      );
    }


    const result =
      await twilioData.client.messages.create({

        body: message,

        from:
          `whatsapp:${whatsappNumber}`,

        to:
          `whatsapp:${phone}`,

      });


    return {

      success: true,

      messageSid:
        result.sid,

    };
  };