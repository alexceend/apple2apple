import "./App.css";

import { StatusPanel } from "./components/StatusPanel";
import { SignalingSettingsPanel } from "./components/SignalingSettingsPanel";
import { RelayTestPanel } from "./components/RelayTestPanel";
import { WebRtcTestPanel } from "./components/WebRtcTestPanel";
import { MessageLog } from "./components/MessageLog";

import { useMessages } from "./hooks/useMessages";
import { useSettings } from "./hooks/useSettings";
import { useP2PConnection } from "./hooks/useP2PConnection";
function App() {
  const { messages, addMessage } = useMessages();

  const {
    serverUrl,
    setServerUrl,
    serverToken,
    setServerToken,
    settingsStatus,
    saveConfig
  } = useSettings({ addMessage });

  const {
    routeId,
    connectionStatus,
    targetRouteId,
    setTargetRouteId,
    connect,
    disconnect,
    sendTestRelay,
    startWebRtc,
    sendP2PMessage
  } = useP2PConnection({
    serverUrl,
    serverToken,
    addMessage
  });

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Apple2Apple</h1>

      <StatusPanel
        settingsStatus={settingsStatus}
        connectionStatus={connectionStatus}
        routeId={routeId}
        serverUrl={serverUrl}
        hasToken={Boolean(serverToken)}
      />

      <SignalingSettingsPanel
        serverUrl={serverUrl}
        setServerUrl={setServerUrl}
        serverToken={serverToken}
        setServerToken={setServerToken}
        saveConfig={saveConfig}
        connect={connect}
        disconnect={disconnect}
      />

      <RelayTestPanel
        targetRouteId={targetRouteId}
        setTargetRouteId={setTargetRouteId}
        sendTestRelay={sendTestRelay}
      />

      <WebRtcTestPanel
        startWebRtc={startWebRtc}
        sendP2PMessage={sendP2PMessage}
      />

      <MessageLog messages={messages} />
    </main>
  );
}

export default App;