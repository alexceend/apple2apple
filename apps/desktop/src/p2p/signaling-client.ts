import type { SignalEnvelope } from "./p2p-types";
import type { LocalIdentity } from "./identity";

type SignalingStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "closed"
  | "error";

type SignalingClientOptions = {
  url: string;
  token: string;
  routeId: string;
  identity: LocalIdentity;
  onStatus?: (status: SignalingStatus) => void;
  onMessage?: (message: unknown) => void;
};

export class SignalingClient {
  private ws: WebSocket | null = null;

  constructor(private readonly options: SignalingClientOptions) {}

  connect() {
    this.options.onStatus?.("connecting");

    const fullUrl = `${this.options.url}?token=${encodeURIComponent(
      this.options.token
    )}`;

    this.ws = new WebSocket(fullUrl);

    this.ws.onopen = () => {
      this.options.onStatus?.("connected");

      this.send({
        type: "hello",
        routeId: this.options.routeId,
        identity: {
          deviceId: this.options.identity.deviceId,
          nickname: this.options.identity.nickname,
          publicKeyJwk: this.options.identity.publicKeyJwk,
          fingerprint: this.options.identity.fingerprint
        }
      });
    };

    this.ws.onmessage = (event) => {
      try {
        this.options.onMessage?.(JSON.parse(event.data));
      } catch {
        this.options.onMessage?.({
          type: "client.error",
          error: "invalid_json_from_server",
          raw: event.data
        });
      }
    };

    this.ws.onerror = () => {
      this.options.onStatus?.("error");
    };

    this.ws.onclose = () => {
      this.options.onStatus?.("closed");
    };
  }

  send(message: unknown) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }

    this.ws.send(JSON.stringify(message));
  }

  relay(to: string, envelope: SignalEnvelope) {
    this.send({
      type: "relay",
      from: this.options.routeId,
      to,
      envelope
    });
  }

  close() {
    this.ws?.close();
    this.ws = null;
    this.options.onStatus?.("closed");
  }
}