import { LocalIdentity } from "../p2p/identity";

type StatusPanelProps = {
  settingsStatus: string;
  connectionStatus: string;
  routeId: string;
  serverUrl: string;
  hasToken: boolean;

  identity: LocalIdentity | null;
  nickname: string;
  onNicknameChange: (value: string) => void;
  onSaveNickname: () => void;
};

export function StatusPanel({
  settingsStatus,
  connectionStatus,
  routeId,
  serverUrl,
  hasToken,
  identity,
  nickname,
  onNicknameChange,
  onSaveNickname
}: StatusPanelProps) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2>Estado</h2>

      <div>
        <label>
          Nickname:{" "}
          <input
            value={nickname}
            onChange={(e) => onNicknameChange(e.target.value)}
          />
        </label>

        <button onClick={onSaveNickname}>
          Guardar
        </button>

        <p>
          <strong>Nickname:</strong> {nickname}
        </p>

        <p>
          <strong>Device ID:</strong> {identity?.deviceId}
        </p>

        <p>
          <strong>Fingerprint:</strong> {identity?.fingerprint}
        </p>
      </div>


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