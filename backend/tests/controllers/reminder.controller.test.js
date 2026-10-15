import sendEmail from "../../src/services/mail.service.js";

export const testSendEmail = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const result = await sendEmail({
      to: "ramanrajpoot690@gmail.com",
      subject: "LedgerSync Email Test",
      message: `
        <h2>Hello from LedgerSync 🚀</h2>
        <p>This is a test email.</p>
      `,
      organizationId,
    });

    res.status(200).json({
      to : to,
      sms : message,
      success: true,
      message: "Email sent successfully",
      data: result,
    });

  } catch (error) {
    console.error("TEST EMAIL ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};