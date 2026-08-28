import {
  getTwilioClient,
} from "./integration.service.js";


export const sendSMS = async ({
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


  if (!twilioData.phoneNumber) {
    throw new Error(
      "Twilio phone number is not configured"
    );
  }


  const result =
    await twilioData.client.messages.create({

      body: message,

      from:
        twilioData.phoneNumber,

      to: phone,

    });


  return {

    success: true,

    messageSid:
      result.sid,

  };
};