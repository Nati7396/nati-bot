import { Router } from "express";
import { getBot } from "../lib/telegram-bot.js";

const router = Router();

router.get("/bot/status", (_req, res) => {
  const bot = getBot();
  res.json({
    status: bot ? "running" : "not started",
    mode: "secretary",
    personality: "Nati",
  });
});

export default router;
