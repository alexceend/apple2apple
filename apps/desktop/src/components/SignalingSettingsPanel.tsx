type SignalingSettingsPanelProps = {
  serverUrl: string;
  setServerUrl: (value: string) => void;
  serverToken: string;
  setServerToken: (value: string) => void;
  saveConfig: () => void;
  connect: () => void;
  disconnect: () => void;
};

export function SignalingSettingsPanel({
  serverUrl,
  setServerUrl,
  serverToken,
  setServerToken,
  saveConfig,
  connect,
  disconnect
}: SignalingSettingsPanelProps) {
  return (
    <details style={{ marginBottom: 24, textAlign: "center" }}>
      <summary
        style={{
          cursor: "pointer",
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 12
        }}
      >
        Servidor de señalización
      </summary>

      <div
        style={{
          marginTop: 16,
          padding: 16,
          border: "1px solid #ccc",
          borderRadius: 8,
          maxWidth: 620,
          marginLeft: "auto",
          marginRight: "auto",
          textAlign: "left"
        }}
      >
        <label>
          Server URL:
          <br />
          <input
            value={serverUrl}
            onChange={(event) => setServerUrl(event.target.value)}
            placeholder="wss://apple2apple.alexceend.duckdns.org/ws"
            style={{ width: "100%" }}
          />
        </label>

        <br />
        <br />

        <label>
          Token:
          <br />
          <input
            value={serverToken}
            onChange={(event) => setServerToken(event.target.value)}
            placeholder="token del servidor"
            type="password"
            style={{ width: "100%" }}
          />
        </label>

        <br />
        <br />

        <button onClick={saveConfig}>Guardar configuración</button>

        <button onClick={connect} style={{ marginLeft: 8 }}>
          Conectar WS
        </button>

        <button onClick={disconnect} style={{ marginLeft: 8 }}>
          Desconectar
        </button>
      </div>
    </details>
  );
}