export type TestEnvelope = {
  type: "test";
  message: string;
  sentAt: number;
};

export type WebRtcOfferEnvelope = {
  type: "webrtc.offer";
  sdp: RTCSessionDescriptionInit;
};

export type WebRtcAnswerEnvelope = {
  type: "webrtc.answer";
  sdp: RTCSessionDescriptionInit;
};

export type WebRtcIceEnvelope = {
  type: "webrtc.ice";
  candidate: RTCIceCandidateInit;
};

export type SignalEnvelope =
  | TestEnvelope
  | WebRtcOfferEnvelope
  | WebRtcAnswerEnvelope
  | WebRtcIceEnvelope;

export type RelayMessage = {
  type: "relay";
  from: string;
  envelope: SignalEnvelope;
};