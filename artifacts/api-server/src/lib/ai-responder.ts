import OpenAI from "openai";
import { NATI_SYSTEM_PROMPT } from "./nati-personality.js";
import { getHistory, addMessage } from "./memory-store.js";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
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

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: NATI_SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 200,
  });

  const reply =
    response.choices[0]?.message?.content?.trim() ?? "yea gimme a sec";

  addMessage(chatId, "assistant", reply);

  return reply;
}
