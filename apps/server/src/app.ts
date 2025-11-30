import http from "http";
import dotenv from "dotenv";
import { attachWebsocketServer } from "./ws/ws";
import app from ".";
import { initDb } from "./db";
import { startPgListener } from "./ws/pgListener";

dotenv.config();

const port = Number(process.env.PORT || 4000);
const server = http.createServer(app);

attachWebsocketServer(server);
// start DB and pg listener, then server
initDb()
  .then(async () => {
    // start a background PG LISTEN/NOTIFY listener so this node receives updates from other nodes
    try {
      await startPgListener();
    } catch (e) {
      console.error("Failed to start pg listener", e);
    }

    server.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
      console.log(`WebSocket path ws://localhost:${port}/ws`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize DB", err);
    process.exit(1);
  });
