import { useCallback, useMemo, useRef, useState } from "react";
import { SignalingClient } from "../p2p/signaling-client";
import { WebRtcClient } from "../p2p/webrtc-client";
import { getOrCreateRouteId } from "../p2p/route-id";
import type { RelayMessage, SignalEnvelope } from "../p2p/p2p-types";
import type { LocalIdentity } from "../p2p/identity";
import { Friend, updateFriendRouteId } from "../p2p/friends";

type UseP2PConnectionOptions = {
  serverUrl: string;
  serverToken: string;
  identity: LocalIdentity | null;
  addMessage: (message: unknown) => void;
  onDataChannelMessage?: (data: string | ArrayBuffer) => void;
};

export function useP2PConnection({
  serverUrl,
  serverToken,
  identity,
  addMessage,
  onDataChannelMessage
}: UseP2PConnectionOptions) {
  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [targetRouteId, setTargetRouteId] = useState("raspi-test");

  const clientRef = useRef<SignalingClient | null>(null);
  const webRtcRef = useRef<WebRtcClient | null>(null);

  const routeId = useMemo(() => getOrCreateRouteId(), []);

  const getOrCreateWebRtcClient = useCallback(
    (remoteRouteId: string) => {
      if (webRtcRef.current) {
        return webRtcRef.current;
      }

      if (!clientRef.current) {
        throw new Error("No hay cliente WebSocket activo");
      }

      if(!identity){
        throw new Error("La identidad local todavía no está cargada");
      }

      const webRtc = new WebRtcClient({
        localRouteId: routeId,
        remoteRouteId,
        identity,
        sendSignal: (to, envelope) => {
          clientRef.current?.relay(to, envelope);
        },
        onLog: addMessage,
        onDataMessage: (data) => {
          onDataChannelMessage?.(data);
        }
      });

      webRtcRef.current = webRtc;
      return webRtc;
    },
    [routeId, addMessage, onDataChannelMessage]
  );

  const handleWebRtcSignal = useCallback(
    async (from: string, envelope: SignalEnvelope) => {
      try {
        const webRtc = getOrCreateWebRtcClient(from);

        if (envelope.type === "webrtc.offer") {
          await webRtc.handleOffer(envelope.sdp, envelope.senderIdentity);
          return;
        }

        if (envelope.type === "webrtc.answer") {
          await webRtc.handleAnswer(envelope.sdp);
          return;
        }

        if (envelope.type === "webrtc.ice") {
          await webRtc.handleIceCandidate(envelope.candidate);
          return;
        }
      } catch (error) {
        addMessage({
          type: "webrtc.signal_error",
          error: String(error)
        });
      }
    },
    [getOrCreateWebRtcClient, addMessage]
  );

  const connect = useCallback(() => {
    if (!serverUrl.trim()) {
      addMessage("Falta Server URL");
      return;
    }

    if (!serverToken.trim()) {
      addMessage("Falta Server Token");
      return;
    }

    clientRef.current?.close();

    if(!identity){
      addMessage("La identidad local todavía no está cargada");
      return;
    }

    const client = new SignalingClient({
      url: serverUrl.trim(),
      token: serverToken.trim(),
      routeId,
      identity,
      onStatus: (status) => {
        setConnectionStatus(status);
        addMessage({
          type: "connection.status",
          status
        });
      },
      onMessage: async (message) => {
        addMessage(message);

        const maybeRelay = message as Partial<RelayMessage>;

        if (maybeRelay.type !== "relay") {
          return;
        }

        const maybeResolve = message as {
          type?: string;
          fingerprint?: string;
          online?: boolean;
          routeId?: string | null;
        };

        if (maybeResolve.type === "resolve.peer.ok") {
          const pending = pendingResolveRef.current;

          if (!pending) {
            return;
          }

          if (pending.fingerprint !== maybeResolve.fingerprint) {
            return;
          }

          pendingResolveRef.current = null;
          pending.resolve(maybeResolve.routeId ?? null);

          return;
        }

        const from = maybeRelay.from;
        const envelope = maybeRelay.envelope;

        if (!from || !envelope) {
          return;
        }

        if (
          "senderIdentity" in envelope &&
          envelope.senderIdentity
        ) {
          updateFriendRouteId(
            envelope.senderIdentity.fingerprint,
            from
          );
        }

        if (
          envelope.type === "webrtc.offer" ||
          envelope.type === "webrtc.answer" ||
          envelope.type === "webrtc.ice"
        ) {
          await handleWebRtcSignal(from, envelope);
        }
      }
    });

    clientRef.current = client;
    client.connect();
  }, [serverUrl, serverToken, routeId, addMessage, handleWebRtcSignal]);

  const disconnect = useCallback(() => {
    webRtcRef.current?.close();
    webRtcRef.current = null;

    clientRef.current?.close();
    clientRef.current = null;
  }, []);

  const sendTestRelay = useCallback(() => {
    if (!clientRef.current) {
      addMessage("No hay cliente WebSocket activo");
      return;
    }

    try {
      clientRef.current.relay(targetRouteId, {
        type: "test",
        message: "hola desde Electron",
        sentAt: Date.now()
      });
    } catch (error) {
      addMessage({
        type: "relay.error",
        error: String(error)
      });
    }
  }, [targetRouteId, addMessage]);

  const startWebRtc = useCallback(async () => {
    try {
      const webRtc = getOrCreateWebRtcClient(targetRouteId);
      await webRtc.startAsCaller();
    } catch (error) {
      addMessage({
        type: "webrtc.start_error",
        error: String(error)
      });
    }
  }, [targetRouteId, getOrCreateWebRtcClient, addMessage]);

  const sendP2PMessage = useCallback(() => {
    webRtcRef.current?.sendDataMessage("hola por WebRTC DataChannel");
  }, []);

  const sendData = useCallback(async (data: string | ArrayBuffer) => {
    await webRtcRef.current?.sendData(data);
  }, []);

  const pendingResolveRef = useRef<{
    fingerprint: string;
    resolve: (routeId: string | null) => void;
    reject: (error: Error) => void;
  } | null>(null);

  const resolveFriendRouteId = useCallback(
    (fingerprint: string) => {
      return new Promise<string | null>((resolve, reject) => {
        if (!clientRef.current) {
          reject(new Error("No hay cliente WebSocket activo"));
          return;
        }

        pendingResolveRef.current = {
          fingerprint,
          resolve,
          reject
        };

        clientRef.current.resolvePeer(fingerprint);
      });
    },
    []
  );

  const startWebRtcWithFriend = useCallback(
    async (friend: Friend) => {
      try {
        const resolvedRouteId = await resolveFriendRouteId(friend.fingerprint);

        if (!resolvedRouteId) {
          addMessage({
            type: "friend.offline",
            nickname: friend.nickname,
            fingerprint: friend.fingerprint
          });
          return;
        }

        const webRtc = getOrCreateWebRtcClient(resolvedRouteId);
        await webRtc.startAsCaller();
      } catch (error) {
        addMessage({
          type: "webrtc.start_friend_error",
          nickname: friend.nickname,
          error: String(error)
        });
      }
    },
    [resolveFriendRouteId, getOrCreateWebRtcClient, addMessage]
  );

  return {
    routeId,
    connectionStatus,
    targetRouteId,
    setTargetRouteId,
    connect,
    disconnect,
    sendTestRelay,
    startWebRtc,
    startWebRtcWithFriend,
    sendP2PMessage,
    sendData
  };
}