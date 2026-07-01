import { useMemo, useState } from "react";
import { FileTransferClient } from "../p2p/file-transfer-client";
import { TransferProgress } from "../p2p/file-transfer-types";

type ReceivedFile = {
  fileId: string;
  fileName: string;
  url: string;
};


type UseFileTransferOptions = {
  sendData: (data: string | ArrayBuffer) => Promise<void>;
  addMessage: (message: unknown) => void;
};

export function useFileTransfer({
  sendData,
  addMessage
}: UseFileTransferOptions) {
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
  const [progress, setProgress] = useState<TransferProgress | null>(null);

  const fileTransfer = useMemo(() => {
    return new FileTransferClient({
      sendData,
      onLog: addMessage,
      onProgress: setProgress,
      onReceiveComplete: ({ fileId, fileName, blob }) => {
        const url = URL.createObjectURL(blob);

        setReceivedFiles((prev) => [
          {
            fileId,
            fileName,
            url
          },
          ...prev
        ]);
      }
    });
  }, [sendData, addMessage]);

  const sendFile = async (file: File | null) => {
    if (!file) {
      addMessage("No hay archivo seleccionado");
      return;
    }

    await fileTransfer.sendFile(file);
  };

  const handleIncomingData = (data: string | ArrayBuffer) => {
    fileTransfer.handleData(data);
  };

  return {
    sendFile,
    handleIncomingData,
    receivedFiles,
    progress,
    pauseTransfer: () => fileTransfer.pause(),
    resumeTransfer: () => fileTransfer.resume()
  };
}