import { useState } from "react";

type FileTransferPanelProps = {
  sendFile: (file: File | null) => void;
  receivedFiles: {
    fileId: string;
    fileName: string;
    url: string;
  }[];
  progress: {
    fileName: string;
    sentOrReceivedChunks: number;
    totalChunks: number;
    direction: "send" | "receive";
  } | null;
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
          {progress.fileName}: {progress.sentOrReceivedChunks}/
          {progress.totalChunks} chunks
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