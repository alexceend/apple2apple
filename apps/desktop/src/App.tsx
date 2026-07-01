import "./App.css";

import { StatusPanel } from "./components/StatusPanel";
import { SignalingSettingsPanel } from "./components/SignalingSettingsPanel";
import { RelayTestPanel } from "./components/RelayTestPanel";
import { WebRtcTestPanel } from "./components/WebRtcTestPanel";
import { MessageLog } from "./components/MessageLog";
import { useFileTransfer } from "./hooks/useFileTransfer";

import { useMessages } from "./hooks/useMessages";
import { useSettings } from "./hooks/useSettings";
import { useP2PConnection } from "./hooks/useP2PConnection";
import { useEffect, useState } from "react";
import { useIdentity } from "./hooks/useIdentity";

import logo from "./assets/logo-big.ico"
import { FileTransferPanel } from "./components/FileTransferPanel";
import { updateNickname, createInviteLink } from "./p2p/identity";

import { FriendsPanel } from "./components/FriendsPanel";

function App() {
  const { messages, addMessage } = useMessages();
  const [darkMode, setDarkMode] = useState(true);
  const { identity, setIdentity } = useIdentity({ addMessage });
  const [nickname, setNickname] = useState("");

  const {
    serverUrl,
    setServerUrl,
    serverToken,
    setServerToken,
    settingsStatus,
    saveConfig
  } = useSettings({ addMessage });

  const [incomingDataHandler, setIncomingDataHandler] =
  useState<((data: string | ArrayBuffer) => void) | null>(null);

  const {
    routeId,
    connectionStatus,
    targetRouteId,
    setTargetRouteId,
    connect,
    disconnect,
    sendTestRelay,
    startWebRtc,
    sendP2PMessage,
    sendData
  } = useP2PConnection({
    serverUrl,
    serverToken,
    identity,
    addMessage,
    onDataChannelMessage: (data) => {
      incomingDataHandler?.(data);
    }
  });

  const {
    sendFile,
    handleIncomingData,
    receivedFiles,
    progress,
    incomingOffers,
    acceptFile,
    rejectFile,
    pauseTransfer,
    resumeTransfer
  } = useFileTransfer({
    sendData,
    addMessage
  });

  useEffect(() => {
    setIncomingDataHandler(() => handleIncomingData);
  }, [handleIncomingData]);


  useEffect(() => {
    if (identity) {
      setNickname(identity.nickname);
    }
  }, [identity]);


  const inviteLink = identity ? createInviteLink(identity) : "";

  return (
    <main className={darkMode ? "app app-dark" : "app app-light"}>
      <button
        onClick={() => setDarkMode(!darkMode)}
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #666",
          cursor: "pointer",
          background: darkMode ? "#333" : "#eee",
          color: darkMode ? "#fff" : "#000",
          zIndex: 1000,
        }}
      >
        {darkMode ? "☀️" : "🌙"}
      </button>

      <div className="app-content">
        <h1>Apple2Apple</h1>
              <img
            src={logo}
            alt="Apple2Apple logo"
            style={{
              width: 150,
              height: "auto",
              display: "block",
              margin: "16px auto",
            }}
        />

        <StatusPanel
          settingsStatus={settingsStatus}
          connectionStatus={connectionStatus}
          routeId={routeId}
          serverUrl={serverUrl}
          hasToken={Boolean(serverToken)}
          identity={identity}
          nickname={nickname}
          onNicknameChange={setNickname}
          onSaveNickname={async () => {
            const updated = await updateNickname(nickname);
            setIdentity(updated);
          }}
          inviteLink={inviteLink}
          onCopyInviteLink={async () => {
            navigator.clipboard.writeText(inviteLink);

            addMessage({
              type: "identity.invite_link.copied"
            });
          }}
        />

        <FriendsPanel
          addMessage={addMessage}
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

        <FileTransferPanel
          sendFile={sendFile}
          pauseTransfer={pauseTransfer}
          resumeTransfer={resumeTransfer}
          receivedFiles={receivedFiles}
          progress={progress}
          incomingOffers={incomingOffers}
          acceptFile={acceptFile}
          rejectFile={rejectFile}
        />

        <MessageLog messages={messages} />

      </div>
    </main>
  );
}

export default App;