import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  // WebSocket Server setup
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws) => {
    console.log('Client connected');

    // Handle RFC ping frames (used internally by OkHttp/ws)
    ws.on('ping', () => ws.pong());

    ws.on('message', (rawData) => {
      try {
        const text = rawData.toString();
        if (!text.startsWith('{')) return;

        const msg = JSON.parse(text);

        // Handle JSON ping/pong protocol
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: Date.now(),
            author: 'server',
            text: ''
          }));
          return;
        }

        // Broadcast user messages to other clients
        if (msg.type === 'msg') {
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              // We send it back to the sender too for consistency in this simulation
              client.send(text);
            }
          });
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  // Handle HTTP upgrade to WebSocket
  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
