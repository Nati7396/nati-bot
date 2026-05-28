import app from "./app";
import { logger } from "./lib/logger";
import { initBot } from "./lib/telegram-bot.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  if (process.env["BOT_ENABLED"] === "true") {
    try {
      initBot();
      logger.info("Nati secretary bot initialized");
    } catch (err) {
      logger.error({ err }, "Failed to initialize Telegram bot");
    }
  } else {
    logger.info("BOT_ENABLED not set — skipping bot polling (set BOT_ENABLED=true to activate)");
  }
});
