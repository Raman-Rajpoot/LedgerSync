import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const personalizeMessage = async ({
  client,
  invoice,
  template,
  channel,
}) => {
  try {
    const prompt = `
You are an AI assistant for LedgerSync.

Personalize the following payment reminder for the client.

CLIENT:
Name: ${client.name}
Company: ${client.companyName || "N/A"}

INVOICE:
Invoice ID: ${invoice.id}
Amount: ₹${invoice.amount}
Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
Status: ${invoice.status}

ORIGINAL TEMPLATE:
${template}

CHANNEL:
${channel}

RULES:
1. Keep the message professional and polite.
2. Make it feel personally written for this client.
3. Do not invent information.
4. Do not change the invoice amount, invoice ID, or payment status.
5. Do not threaten the client.
6. Do not add fake payment links.
7. For SMS keep it very short.
8. For WhatsApp keep it concise and friendly.
9. For EMAIL make it professional and slightly detailed.
10. Return ONLY the final message.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text.trim();

  } catch (error) {
    console.error("Gemini personalization error:", error);

    throw new Error("Failed to personalize message");
  }
};