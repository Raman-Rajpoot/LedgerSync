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
    throw new Error("organizationId is required");
  }

  // SMTP credentials are loaded from .env
  const mailer = await getMailer();

  const result = await mailer.transporter.sendMail({
    from: `"${mailer.fromName}" <${mailer.fromEmail}>`,
    to,
    subject,
    html: message,
  });

  if (result.rejected?.length > 0 || result.accepted?.length === 0) {
    throw new Error(
      `Email was not accepted by the SMTP server for: ${to}`
    );
  }

  return {
    success: true,
    messageId: result.messageId,
    accepted: result.accepted,
    rejected: result.rejected,
    response: result.response,
  };
};

export default sendEmail;



