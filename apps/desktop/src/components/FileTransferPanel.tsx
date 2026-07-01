import { useState } from "react";

import type { TransferProgress } from "../p2p/file-transfer-types";

type FileTransferPanelProps = {
  sendFile: (file: File | null) => void;
  receivedFiles: {
    fileId: string;
    fileName: string;
    url: string;
  }[];
  progress: TransferProgress | null;
};

export function FileTransferPanel({
  sendFile,
  receivedFiles,
  progress
}: FileTransferPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <section style={{ marginBottom: 24 }}>
      <h2>Transferencia de archivos</h2>

      <input
        type="file"
        onChange={(event) => {
          setSelectedFile(event.target.files?.[0] ?? null);
        }}
      />

      <button
        onClick={() => sendFile(selectedFile)}
        style={{ marginLeft: 8 }}
      >
        Enviar archivo
      </button>

      {progress && (
        <p>
          {progress.direction === "send" ? "Enviando" : "Recibiendo"}{" "}
          {progress.fileName}:{" "}
          {(progress.bytesTransferred / 1024 / 1024).toFixed(1)} MB /{" "}
          {(progress.totalBytes / 1024 / 1024).toFixed(1)} MB ·{" "}
          {progress.percent.toFixed(1)}% ·{" "}
          {progress.speedMBps.toFixed(2)} MB/s
        </p>
      )}

      {receivedFiles.length > 0 && (
        <>
          <h3>Archivos recibidos</h3>

          {receivedFiles.map((file) => (
            <p key={file.fileId}>
              <a href={file.url} download={file.fileName}>
                Descargar {file.fileName}
              </a>
            </p>
          ))}
        </>
      )}
    </section>
  );
}