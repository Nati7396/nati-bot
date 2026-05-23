import { Router } from "express";
import { getBotStatus } from "../lib/telegram-bot.js";

const router = Router();

router.get("/bot/status", (_req, res) => {
  const { running } = getBotStatus();
  res.json({
    status: running ? "running" : "stopped",
    mode: "secretary",
    personality: "Nati",
  });
});

export default router;
