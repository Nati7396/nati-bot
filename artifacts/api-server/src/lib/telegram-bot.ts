import { generateReply } from "./ai-responder.js";
import { logger } from "./logger.js";

const TELEGRAM_API = `https://api.telegram.org/bot`;

interface TelegramUser {
  id: number;
  first_name?: string;
  username?: string;
  is_bot?: boolean;
}

interface TelegramChat {
  id: number;
  type: string;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  text?: string;
  business_connection_id?: string;
}

interface BusinessConnection {
  id: string;
  user: TelegramUser;
  user_chat_id: number;
  date: number;
  can_reply: boolean;
  is_enabled: boolean;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  business_connection?: BusinessConnection;
  business_message?: TelegramMessage;
  edited_business_message?: TelegramMessage;
}

interface GetUpdatesResult {
  ok: boolean;
  result: TelegramUpdate[];
}

let running = false;
let offset = 0;
let token: string | null = null;

const processingSet = new Set<string>();

function apiUrl(method: string): string {
  return `${TELEGRAM_API}${token}/${method}`;
}

async function getUpdates(): Promise<TelegramUpdate[]> {
  const params = new URLSearchParams({
    offset: String(offset),
    timeout: "30",
    allowed_updates: JSON.stringify([
      "message",
      "business_connection",
      "business_message",
      "edited_business_message",
      "deleted_business_messages",
    ]),
  });

  const res = await fetch(`${apiUrl("getUpdates")}?${params}`, {
    signal: AbortSignal.timeout(40_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`getUpdates failed: ${res.status} ${body}`);
  }

  const data = (await res.json()) as GetUpdatesResult;
  return data.result ?? [];
}

async function sendReply(
  chatId: number,
  text: string,
  businessConnectionId: string,
): Promise<void> {
  const res = await fetch(apiUrl("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      business_connection_id: businessConnectionId,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`sendMessage failed: ${res.status} ${body}`);
  }
}

async function handleMessage(msg: TelegramMessage): Promise<void> {
  const chatId = msg.chat.id;
  const text = msg.text;
  const businessConnectionId = msg.business_connection_id;

  if (!text || !businessConnectionId) return;

  const dedupeKey = `${chatId}:${msg.message_id}`;
  if (processingSet.has(dedupeKey)) return;
  processingSet.add(dedupeKey);
  setTimeout(() => processingSet.delete(dedupeKey), 60_000);

  const senderName =
    msg.from?.first_name ?? msg.from?.username ?? "them";

  logger.info({ chatId, senderName, businessConnectionId }, "Business message received — generating reply");

  try {
    const reply = await generateReply(String(chatId), text, senderName);
    await sendReply(chatId, reply, businessConnectionId);
    logger.info({ chatId }, "Reply sent");
  } catch (err) {
    logger.error({ err, chatId }, "Failed to reply");
  }
}

async function pollLoop(): Promise<void> {
  logger.info("Polling loop started");

  while (running) {
    try {
      const updates = await getUpdates();

      for (const update of updates) {
        offset = update.update_id + 1;

        if (update.business_connection) {
          const conn = update.business_connection;
          logger.info(
            {
              connectionId: conn.id,
              userId: conn.user.id,
              canReply: conn.can_reply,
              isEnabled: conn.is_enabled,
            },
            "Business connection update",
          );
        }

        if (update.business_message) {
          await handleMessage(update.business_message);
        }

        if (update.edited_business_message) {
          logger.info({ updateId: update.update_id }, "Business message edited — ignoring");
        }
      }
    } catch (err) {
      if (!running) break;
      logger.error({ err }, "Polling error — retrying in 3s");
      await new Promise((r) => setTimeout(r, 3_000));
    }
  }

  logger.info("Polling loop stopped");
}

export function initBot(): void {
  token = process.env["TELEGRAM_BOT_TOKEN"] ?? null;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }

  running = true;
  pollLoop().catch((err) => {
    logger.error({ err }, "Poll loop crashed");
  });

  logger.info("Nati bot started — polling for business messages");
}

export function stopBot(): void {
  running = false;
}

export function getBotStatus(): { running: boolean } {
  return { running };
}
