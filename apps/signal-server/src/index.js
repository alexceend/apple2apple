import Fastify from "fastify";
import websocket from "@fastify/websocket";

const app = Fastify({
  logger: true
});

await app.register(websocket);

const PORT = Number(process.env.PORT || 6767);
const TOKEN = process.env.P2P_SERVER_TOKEN || "";

const peers = new Map();

function mask(value){
  if(!value || typeof value !== "string"){
    return null;
  }

  if(value.length <= 8){
    return "***";
  }

  return `${value.slice(0,3)}...${value.slice(-3)}`;
}

function getClientIp(request){
  const forwardedFor = request.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string") {
    return forwardedFor.split(",")[0].trim();
  }

  return request.socket?.remoteAddress || "unknown";
}

function logSecurity(level, event, data = {}){
  app.log[level]({
    event,
    security: true,
    timestamp: new Date().toISOString(),
    ...data
  })
}

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
    const clientIp = getClientIp(req);

    logSecurity("info", "ws_connection_attempt", {ip: clientIp, userAgent: req.headers["userg-agent"] || "unknown"})

    if (TOKEN && token !== TOKEN) {
      logSecurity("warn", "invalid_token", { ip: clientIp, tokenPresent: Boolean(token)});
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


        if (peers.has(msg.routeId)) {
          logSecurity("warn", "route_id_replaced", {
            ip: clientIp,
            routeId: mask(msg.routeId)
          });
        }
        routeId = msg.routeId;
        peers.set(routeId, socket);

        logSecurity("info", "peer_registered", { 
          ip: clientIp, routeId: mask(routeId), onlinePeers: peers.size 
        });

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

          logSecurity("warn", "relay_peer_offline", {
            ip: clientIp,
            from: mask(msg.from),
            to: mask(msg.to)
          });

          logSecurity("info", "relay_forwarded", {
            ip: clientIp,
            from: mask(msg.from),
            to: mask(msg.to),
            envelopeType: msg.envelope?.type || "unknown"
          });

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

      logSecurity("warn", "unknown_message_type", {
        ip: clientIp,
        routeId: mask(routeId),
        messageType: msg.type || "missing"
      });

      socket.send(JSON.stringify({
        type: "error",
        error: "unknown_message_type"
      }));
    });

    socket.on("close", () => {
      if (routeId) {
        peers.delete(routeId);
        logSecurity("info", "peer_disconnected", {
          ip: clientIp,
          routeId: mask(routeId),
          onlinePeers: peers.size
        });
      }
    });
  });
});

await app.listen({
  host: "0.0.0.0",
  port: PORT
});
