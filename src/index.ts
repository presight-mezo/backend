import express from "express";
import cors from "cors";
import morgan from "morgan";
import http from "http";
import * as dotenv from "dotenv";

dotenv.config();

import { PORT, CORS_ORIGIN } from "./config.js";
import { migrateDb } from "./db/schema.js";
import { initWebSocket } from "./services/websocket.js";
import { startContractEventListener } from "./services/contractEvents.js";
import { errorHandler } from "./middleware/errorHandler.js";

// ── Routes ────────────────────────────────────────────────────────────────────
import groupsRouter   from "./routes/groups.js";
import marketsRouter  from "./routes/markets.js";
import stakesRouter   from "./routes/stakes.js";
import mandateRouter  from "./routes/mandate.js";
import resolverRouter from "./routes/resolver.js";
import profileRouter  from "./routes/profile.js";

// ── Bootstrap DB ──────────────────────────────────────────────────────────────
migrateDb();
console.log("[db] Schema migrated ✓");

// ── Express App ───────────────────────────────────────────────────────────────
const app = express();

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────────────────────
const BASE = "/api/v1";
app.use(`${BASE}/groups`,   groupsRouter);
app.use(`${BASE}/markets`,  marketsRouter);
app.use(`${BASE}/stakes`,   stakesRouter);
app.use(`${BASE}/mandate`,  mandateRouter);
app.use(`${BASE}/resolver`, resolverRouter);
app.use(`${BASE}/profile`,  profileRouter);

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── HTTP + WebSocket Server ───────────────────────────────────────────────────
const server = http.createServer(app);
initWebSocket(server);

server.listen(PORT, () => {
  console.log(`[server] Presight API running on http://localhost:${PORT}`);
  console.log(`[server] WebSocket listening on ws://localhost:${PORT}`);
  console.log(`[server] CORS origin: ${CORS_ORIGIN}`);
});

// ── Contract Event Listener ───────────────────────────────────────────────────
startContractEventListener();
