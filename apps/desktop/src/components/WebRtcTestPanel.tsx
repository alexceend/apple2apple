type WebRtcTestPanelProps = {
  startWebRtc: () => void;
  sendP2PMessage: () => void;
};

export function WebRtcTestPanel({
  startWebRtc,
  sendP2PMessage
}: WebRtcTestPanelProps) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2>Prueba WebRTC</h2>

      <button onClick={startWebRtc}>
        Iniciar WebRTC con routeId destino
      </button>

      <button onClick={sendP2PMessage} style={{ marginLeft: 8 }}>
        Enviar mensaje P2P por DataChannel
      </button>
    </section>
  );
}