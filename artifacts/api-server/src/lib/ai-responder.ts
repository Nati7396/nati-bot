import { GoogleGenerativeAI } from "@google/generative-ai";
import { NATI_SYSTEM_PROMPT } from "./nati-personality.js";
import { getHistory, addMessage } from "./memory-store.js";

const genAI = new GoogleGenerativeAI(process.env["GEMINI_API_KEY"] ?? "");

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: NATI_SYSTEM_PROMPT,
});

export async function generateReply(
  chatId: string,
  incomingText: string,
  senderName?: string,
): Promise<string> {
  const history = getHistory(chatId);

  const contextNote = senderName
    ? `[Message from ${senderName}]: ${incomingText}`
    : incomingText;

  addMessage(chatId, "user", contextNote);

  const geminiHistory = history.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({
    history: geminiHistory,
    generationConfig: {
      maxOutputTokens: 200,
    },
  });

  const result = await chat.sendMessage(contextNote);
  const reply = result.response.text().trim() || "yea gimme a sec";

  addMessage(chatId, "assistant", reply);

  return reply;
}
