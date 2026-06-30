import type { SignalEnvelope } from "./p2p-types";

type SendSignal = (to: string, envelope: SignalEnvelope) => void;
type OnLog = (message: unknown) => void;
type OnDataMessage = (message: string | ArrayBuffer) => void;

type WebRtcClientOptions = {
    localRouteId: string;
    remoteRouteId: string;
    sendSignal: SendSignal;
    onLog: OnLog;
    onDataMessage: OnDataMessage;
};

export class WebRtcClient {
    private peer: RTCPeerConnection;
    private channel: RTCDataChannel | null = null;

    private localRouteId: string;
    private remoteRouteId: string;
    private sendSignal: SendSignal;
    private onLog: OnLog;
    private onDataMessage: OnDataMessage;

    constructor(options: WebRtcClientOptions){
        this.localRouteId = options.localRouteId;
        this.remoteRouteId = options.remoteRouteId;
        this.sendSignal = options.sendSignal;
        this.onLog = options.onLog;
        this.onDataMessage = options.onDataMessage;

        this.onLog({
            type: "webrtc.client.created",
            localRouteId: this.localRouteId,
            remoteRouteId: this.remoteRouteId
        });

        this.peer = new RTCPeerConnection({
            iceServers : [
                {
                    urls: "stun:stun.l.google.com:19302"
                }
            ]
        });

        this.peer.onicecandidate = (event) => {
            if (!event.candidate) return;

            this.onLog({
                type: "webrtc.local_ice",
                candidate: event.candidate.candidate
            });

            this.sendSignal(this.remoteRouteId, {
                type: "webrtc.ice",
                candidate: event.candidate.toJSON()
            });
        };

        this.peer.onconnectionstatechange = () => {
            this.onLog({
                type: "webrtc.connection_state",
                state: this.peer.connectionState
            });
        };

        this.peer.ondatachannel = (event) => {
            this.onLog({
                type: "webrtc.datachannel.received",
                label: event.channel.label
            });

            this.setupChannel(event.channel);
        };
    }

    async startAsCaller() {
        this.channel = this.peer.createDataChannel("apple2apple");

        this.setupChannel(this.channel);

        const offer = await this.peer.createOffer();
        await this.peer.setLocalDescription(offer);

        this.onLog({
            type: "webrtc.offer.created"
        });

        this.sendSignal(this.remoteRouteId, {
            type: "webrtc.offer",
            sdp: offer
        });
    }

    async handleOffer(sdp: RTCSessionDescriptionInit) {
        this.onLog({
            type: "webrtc.offer.received"
        });

        await this.peer.setRemoteDescription(sdp);

        const answer = await this.peer.createAnswer();
        await this.peer.setLocalDescription(answer);

        this.onLog({
            type: "webrtc.answer.created"
        });

        this.sendSignal(this.remoteRouteId, {
            type: "webrtc.answer",
            sdp: answer
        });
    }


    async handleAnswer(sdp: RTCSessionDescriptionInit) {
        this.onLog({
            type: "webrtc.answer.received"
        });

        await this.peer.setRemoteDescription(sdp);
    }

    async handleIceCandidate(candidate: RTCIceCandidateInit) {
        this.onLog({
            type: "webrtc.ice.received",
            candidate: candidate.candidate
        });

        await this.peer.addIceCandidate(candidate);
    }
    sendDataMessage(message: string) {
        this.sendData(message);
    }

    sendData(data: string | ArrayBuffer){
        if(!this.channel){
            this.onLog("No hay DataChannel creado");
            return;
        }

        if(this.channel.readyState != "open"){
            this.onLog({
                type: "webrtc.datachannel.not_open",
                state: this.channel.readyState
            });
            return;
        }

        this.channel.send(data);

        this.onLog({
            type: "webrtc.datachannel.sent",
            kind: typeof data === "string" ? "text" : "binary",
            size: typeof data === "string" ? data.length : data.byteLength
        });
    }

    close() {
        this.channel?.close();
        this.peer.close();
    }

    private setupChannel(channel: RTCDataChannel) {
        this.channel = channel;
        channel.binaryType = "arraybuffer";

        channel.onopen = () => {
            this.onLog({
                type: "webrtc.datachannel.open"
            });
        };

        channel.onclose = () => {
            this.onLog({
                type: "webrtc.datachannel.close"
            });
        };

        channel.onerror = (event) => {
            this.onLog({
                type: "webrtc.datachannel.error",
                event: String(event)
            });
        };

        channel.onmessage = (event) => {
            const data = event.data as string | ArrayBuffer;

            this.onLog({
                type: "webrtc.datachannel.message",
                kind: typeof data === "string" ? "text" : "binary",
                size: typeof data === "string" ? data.length : data.byteLength
            });

            this.onDataMessage(data);
        };
    }
}