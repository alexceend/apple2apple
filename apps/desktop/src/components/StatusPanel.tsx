import { LocalIdentity } from "../p2p/identity";
import { QRCodeCanvas } from "qrcode.react";

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

  inviteLink: string;
  onCopyInviteLink: () => void;
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
  onSaveNickname,
  inviteLink,
  onCopyInviteLink
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

      <p>
        <strong>Invitación:</strong>
      </p>

      <textarea
        readOnly
        value={inviteLink}
        style={{ width: "100%", minHeight: 80, marginBottom: 15}}
      />

      {inviteLink && (
        <QRCodeCanvas
          value={inviteLink}
          size={180}
        />
      )}

      <br/>
      <br/>

      <button onClick={onCopyInviteLink}>
        Copiar invitación
      </button>


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