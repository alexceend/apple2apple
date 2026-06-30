type StatusPanelProps = {
  settingsStatus: string;
  connectionStatus: string;
  routeId: string;
  serverUrl: string;
  hasToken: boolean;
};

export function StatusPanel({
  settingsStatus,
  connectionStatus,
  routeId,
  serverUrl,
  hasToken
}: StatusPanelProps) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2>Estado</h2>

      <div
        style={{
          display: "flex",
          gap: 24,
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap"
        }}
      >
        <p>
          <strong>Settings:</strong> {settingsStatus}
        </p>

        <p>
          <strong>WebSocket:</strong> {connectionStatus}
        </p>

        <p>
          <strong>Token cargado:</strong> {hasToken ? "sí" : "no"}
        </p>
      </div>

      <p>
        <strong>Mi routeId:</strong> {routeId}
      </p>

      <p>
        <strong>Server URL cargada:</strong>{" "}
        {serverUrl ? serverUrl : "no configurada"}
      </p>
    </section>
  );
}