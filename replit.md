# Nati — Telegram AI Secretary Bot

An AI-powered Telegram secretary bot that connects to your account via Business Mode and auto-replies to incoming messages as "Nati" — a real, human-sounding persona from Ethiopia.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- Required env: `TELEGRAM_BOT_TOKEN` — your bot token from @BotFather
- Required env: `OPENAI_API_KEY` — your OpenAI API key for AI responses

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Bot: node-telegram-bot-api (polling mode)
- AI: OpenAI gpt-4o-mini
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/lib/telegram-bot.ts` — bot init and message handler
- `artifacts/api-server/src/lib/ai-responder.ts` — OpenAI call logic
- `artifacts/api-server/src/lib/nati-personality.ts` — Nati's system prompt / personality
- `artifacts/api-server/src/lib/memory-store.ts` — in-memory per-chat conversation history (30 msgs, 24h TTL)
- `artifacts/api-server/src/routes/bot.ts` — `/api/bot/status` endpoint

## Architecture decisions

- Uses Telegram Business Mode (`business_message` event) so bot replies on behalf of the account owner
- In-memory conversation history per chat (no DB needed for MVP)
- Loop prevention via deduplication set keyed on `chatId:messageId`
- gpt-4o-mini for fast, cheap responses with max 200 tokens (keeps replies short like real texting)

## Product

Nati is your AI secretary on Telegram. When someone messages you, Nati responds on your behalf in your style — casual, direct, human. Supports full multi-turn conversation with per-chat memory.

## User preferences

- Personality prompt: "Nati" — Ethiopian teen chat style, short msgs, direct, slang (bruh/bro/man), emotionally intense but chill

## Gotchas

- Bot must have Secretary Mode enabled in @BotFather (Business > Secretary Mode)
- You must connect the bot to your Telegram account via Telegram Business settings
- Bot only replies to `business_message` updates (messages in your managed chats)
- Memory is in-RAM only — restarting the server clears all chat histories
