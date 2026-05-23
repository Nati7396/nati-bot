import Groq from "groq-sdk";
import { NATI_SYSTEM_PROMPT } from "./nati-personality.js";
import { getHistory, addMessage } from "./memory-store.js";

const groq = new Groq({
  apiKey: process.env["GROQ_API_KEY"],
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

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: NATI_SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages,
    max_tokens: 200,
  });

  const reply =
    response.choices[0]?.message?.content?.trim() ?? "yea gimme a sec";

  addMessage(chatId, "assistant", reply);

  return reply;
}
