type RelayTestPanelProps = {
  targetRouteId: string;
  setTargetRouteId: (value: string) => void;
  sendTestRelay: () => void;
};

export function RelayTestPanel({
  targetRouteId,
  setTargetRouteId,
  sendTestRelay
}: RelayTestPanelProps) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2>Prueba relay</h2>

      <input
        value={targetRouteId}
        onChange={(event) => setTargetRouteId(event.target.value)}
        placeholder="routeId destino"
        style={{ width: 280, marginRight: 8 }}
      />

      <button onClick={sendTestRelay}>Enviar mensaje test</button>
    </section>
  );
}