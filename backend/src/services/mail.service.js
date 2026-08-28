import {
  getMailer,
} from "./integration.service.js";


const sendEmail = async ({
  to,
  subject,
  message,
  organizationId,
}) => {

  if (!organizationId) {
    throw new Error(
      "organizationId is required"
    );
  }


  const mailer =
    await getMailer(
      organizationId
    );


  if (!mailer) {
    throw new Error(
      "Email integration is not configured for this organization"
    );
  }


  const result =
    await mailer.transporter.sendMail({

      from:
        `"${mailer.fromName}" <${mailer.fromEmail}>`,

      to,

      subject,

      html: message,

    });


  return {

    success: true,

    messageId:
      result.messageId,

  };
};


export default sendEmail;