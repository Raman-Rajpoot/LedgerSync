import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const personalizeReminder = async ({
  subject,
  content,
  clientName,
  invoiceNumber,
  amount,
  dueDate,
  channel,
}) => {
  try {
    const prompt = `
You are an AI assistant for LedgerSync.

Personalize this payment reminder.

Client Name: ${clientName}
Invoice Number: ${invoiceNumber}
Amount: ₹${amount}
Due Date: ${dueDate}
Channel: ${channel}

Original Subject:
${subject}

Original Message:
${content}

Rules:
1. Keep the message professional and polite.
2. Make it feel naturally personalized.
3. Do not invent any information.
4. Do not change the client name.
5. Do not change the invoice number.
6. Do not change the amount.
7. Do not change the due date.
8. Do not add payment links.
9. Do not threaten the client.
10. For SMS, keep it very short.
11. For WhatsApp, keep it concise and friendly.
12. For EMAIL, keep it professional and slightly detailed.
13. Return ONLY valid JSON.
14. Do not wrap the JSON in markdown.

Return exactly:
{
  "subject": "personalized subject",
  "content": "personalized message"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });

    const text = response.text?.trim();

    if (!text) {
      return {
        subject,
        content,
      };
    }

    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const result = JSON.parse(cleaned);

    return {
      subject: result.subject?.trim() || subject,
      content: result.content?.trim() || content,
    };
  } catch (error) {
    console.error("Gemini personalization error:", error);

    return {
      subject,
      content,
    };
  }
};