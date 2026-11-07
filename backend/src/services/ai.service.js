
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
1. Keep the message professional, polite, and naturally personalized.
2. Do not invent information.
3. Preserve the client name, invoice number, amount, and due date exactly.
4. Do not add payment links or threats.
5. For SMS, return one short, concise message without paragraph breaks.
6. For WhatsApp, keep the message concise and friendly, using line breaks where helpful.
7. For EMAIL, format the content into separate readable paragraphs:
   - Greeting
   - Reminder details
   - Acknowledgment or next steps
   - Closing and signature
8. For EMAIL, separate paragraphs using two newline characters (\\n\\n).
9. Do not return HTML tags or Markdown formatting.
10. Do not include literal escaped newline sequences in the output;
    use actual newline characters in the content string.
11. Return ONLY valid JSON without Markdown code fences.

Return exactly this structure:
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
      return { subject, content };
    }

    const cleaned = text
      .replace(/^```json\\s*/i, "")
      .replace(/^```\\s*/i, "")
      .replace(/\\s*```$/i, "")
      .trim();

    const result = JSON.parse(cleaned);

    return {
      subject: result.subject?.trim() || subject,
      content: result.content?.trim() || content,
    };
  } catch (error) {
    console.error("Gemini personalization error:", error);
    return { subject, content };
  }
};
