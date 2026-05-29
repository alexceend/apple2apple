import Fastify from "fastify";
import websocket from "@fastify/websocket";

const app = Fastify({
  logger: true
});

await app.register(websocket);

const PORT = Number(process.env.PORT || 3000);
const TOKEN = process.env.P2P_SERVER_TOKEN || "";

const peers = new Map();

app.get("/health", async () => {
  return {
    ok: true,
    peers: peers.size
  };
});

app.get("/", async () => {
  return {
    name: "apple2apple-signal-server",
    ok: true
  };
});

app.register(async function (fastify) {
  fastify.get("/ws", { websocket: true }, (socket, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (TOKEN && token !== TOKEN) {
      socket.close(1008, "Invalid token");
      return;
    }

    let routeId = null;

    socket.on("message", (raw) => {
      let msg;

      try {
        msg = JSON.parse(raw.toString());
      } catch {
        socket.send(JSON.stringify({
          type: "error",
          error: "invalid_json"
        }));
        return;
      }

      if (msg.type === "hello") {
        if (!msg.routeId) {
          socket.send(JSON.stringify({
            type: "error",
            error: "missing_route_id"
          }));
          return;
        }

        routeId = msg.routeId;
        peers.set(routeId, socket);

        socket.send(JSON.stringify({
          type: "hello.ok",
          routeId,
          onlinePeers: peers.size
        }));

        return;
      }

      if (msg.type === "relay") {
        const target = peers.get(msg.to);

        if (!target) {
          socket.send(JSON.stringify({
            type: "relay.error",
            error: "peer_offline",
            to: msg.to
          }));
          return;
        }

        target.send(JSON.stringify({
          type: "relay",
          from: msg.from,
          envelope: msg.envelope
        }));

        return;
      }

      socket.send(JSON.stringify({
        type: "error",
        error: "unknown_message_type"
      }));
    });

    socket.on("close", () => {
      if (routeId) {
        peers.delete(routeId);
      }
    });
  });
});

await app.listen({
  host: "0.0.0.0",
  port: PORT
});
