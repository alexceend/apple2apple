import { useState, useEffect, useRef, useMemo } from 'react'
import './App.css'
import { SignalingClient } from "./p2p/signaling-client";

type SettingsStatus = "loading" | "loaded" | "error";

function createRouteId() {
  const existing = localStorage.getItem("routeId");

  if (existing) {
    return existing;
  }

  const routeId = `pc-${crypto.randomUUID()}`;
  localStorage.setItem("routeId", routeId);
  return routeId;
}

function App() {
  const [serverUrl, setServerUrl] = useState("");
  const [serverToken, setServerToken] = useState("");

  const [settingsStatus, setSettingsStatus] =
    useState<SettingsStatus>("loading");

  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [targetRouteId, setTargetRouteId] = useState("raspi-test");
  const [messages, setMessages] = useState<string[]>([]);

  const clientRef = useRef<SignalingClient | null>(null);
  const routeId = useMemo(() => createRouteId(), []);

  const addMessage = (message: unknown) => {
    setMessages((prev) => [
      typeof message === "string" ? message : JSON.stringify(message),
      ...prev
    ]);
  };

  useEffect(() => {
    async function loadSettings() {
      try {
        addMessage("Cargando settings...");

        const settings = await window.apple2apple.loadSettings();

        setServerUrl(settings.serverUrl);
        setServerToken(settings.serverToken);

        setSettingsStatus("loaded");

        addMessage({
          type: "settings.loaded",
          serverUrl: settings.serverUrl || null,
          hasToken: Boolean(settings.serverToken)
        });
      } catch (error) {
        setSettingsStatus("error");

        addMessage({
          type: "settings.error",
          error: String(error)
        });
      }
    }

    loadSettings();
  }, []);

  const saveConfig = async () => {
    try {
      const saved = await window.apple2apple.saveSettings({
        serverUrl,
        serverToken
      });

      setServerUrl(saved.serverUrl);
      setServerToken(saved.serverToken);

      addMessage({
        type: "settings.saved",
        serverUrl: saved.serverUrl,
        hasToken: Boolean(saved.serverToken)
      });
    } catch (error) {
      addMessage({
        type: "settings.save_error",
        error: String(error)
      });
    }
  };

  const connect = () => {
    if (!serverUrl.trim()) {
      addMessage("Falta Server URL");
      return;
    }

    if (!serverToken.trim()) {
      addMessage("Falta Server Token");
      return;
    }

    clientRef.current?.close();

    const client = new SignalingClient({
      url: serverUrl.trim(),
      token: serverToken.trim(),
      routeId,
      onStatus: (status) => {
        setConnectionStatus(status);
        addMessage({
          type: "connection.status",
          status
        });
      },
      onMessage: (message) => {
        addMessage(message);
      }
    });

    clientRef.current = client;
    client.connect();
  };

  const disconnect = () => {
    clientRef.current?.close();
    clientRef.current = null;
  };

  const sendTestRelay = () => {
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
  };

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Apple2Apple</h1>

      <section style={{ marginBottom: 24 }}>
        <h2>Estado</h2>

        <p>
          <strong>Settings:</strong> {settingsStatus}
        </p>

        <p>
          <strong>WebSocket:</strong> {connectionStatus}
        </p>

        <p>
          <strong>Mi routeId:</strong> {routeId}
        </p>

        <p>
          <strong>Server URL cargada:</strong>{" "}
          {serverUrl ? serverUrl : "no configurada"}
        </p>

        <p>
          <strong>Token cargado:</strong> {serverToken ? "sí" : "no"}
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Servidor de señalización</h2>

        <label>
          Server URL:
          <br />
          <input
            value={serverUrl}
            onChange={(event) => setServerUrl(event.target.value)}
            placeholder="wss://apple2apple.alexceend.duckdns.org/ws"
            style={{ width: 560 }}
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
            style={{ width: 560 }}
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
      </section>

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

      <section>
        <h2>Mensajes</h2>

        <pre
          style={{
            background: "#111",
            color: "#0f0",
            padding: 12,
            minHeight: 260,
            whiteSpace: "pre-wrap",
            overflow: "auto"
          }}
        >
          {messages.join("\n")}
        </pre>
      </section>
    </main>
  );
}

export default App;


/*
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://electron-vite.github.io" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
*/