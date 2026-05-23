import TelegramBot from "node-telegram-bot-api";
import { generateReply } from "./ai-responder.js";
import { logger } from "./logger.js";

type BusinessMessage = TelegramBot.Message & {
  business_connection_id?: string;
};

let bot: TelegramBot | null = null;

const processingSet = new Set<string>();

export function initBot(): TelegramBot {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }

  bot = new TelegramBot(token, { polling: true });

  logger.info("Telegram bot started with polling");

  bot.on("business_message", async (msg) => {
    await handleMessage(msg as BusinessMessage);
  });

  bot.on("message", async (msg) => {
    const bMsg = msg as BusinessMessage;
    if (!bMsg.business_connection_id) return;
    await handleMessage(bMsg);
  });

  bot.on("polling_error", (err) => {
    logger.error({ err }, "Telegram polling error");
  });

  bot.on("error", (err) => {
    logger.error({ err }, "Telegram bot error");
  });

  return bot;
}

async function handleMessage(msg: BusinessMessage): Promise<void> {
  const chatId = String(msg.chat.id);
  const text = msg.text;
  const businessConnectionId = msg.business_connection_id;

  if (!text || !businessConnectionId) return;

  const dedupeKey = `${chatId}:${msg.message_id}`;
  if (processingSet.has(dedupeKey)) return;
  processingSet.add(dedupeKey);
  setTimeout(() => processingSet.delete(dedupeKey), 60_000);

  const senderName =
    msg.from?.first_name ??
    msg.from?.username ??
    "them";

  logger.info({ chatId, senderName }, "Incoming business message");

  try {
    const reply = await generateReply(chatId, text, senderName);

    if (!bot) return;

    await bot.sendMessage(chatId, reply, {
      business_connection_id: businessConnectionId,
    } as TelegramBot.SendMessageOptions);

    logger.info({ chatId }, "Reply sent");
  } catch (err) {
    logger.error({ err, chatId }, "Failed to generate or send reply");
  }
}

export function getBot(): TelegramBot | null {
  return bot;
}
