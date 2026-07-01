import { useMemo, useState } from "react";
import { FileTransferClient } from "../p2p/file-transfer-client";
import { TransferProgress } from "../p2p/file-transfer-types";

type ReceivedFile = {
  fileId: string;
  fileName: string;
  url: string;
};

type IncomingFileOffer = {
  fileId: string;
  fileName: string;
  fileSize: number;
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
  const [incomingOffers, setIncomingOffers] = useState<IncomingFileOffer[]>([]);

  const fileTransfer = useMemo(() => {
    return new FileTransferClient({
      sendData,
      onLog: addMessage,
      onProgress: setProgress,
      onFileOffer: (offer) => {
        setIncomingOffers((prev) => {
          const alreadyExists = prev.some(
            (item) => item.fileId === offer.fileId
          );

          if (alreadyExists) {
            return prev;
          }

          return [offer, ...prev];
        });

        addMessage({
          type: "file.offer.received",
          ...offer
        });
      },

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

  const acceptFile = async (fileId: string) => {
    await fileTransfer.acceptFile(fileId);
    setIncomingOffers((prev) =>
    prev.filter((offer) => offer.fileId !== fileId));
  };

  const rejectFile = async (fileId: string) => {
    await fileTransfer.rejectFile(fileId);
    setIncomingOffers((prev) =>
      prev.filter((offer) => offer.fileId !== fileId)
    );
  }

  return {
    sendFile,
    handleIncomingData,
    receivedFiles,
    progress,
    incomingOffers,
    acceptFile,
    rejectFile,
    pauseTransfer: () => fileTransfer.pause(),
    resumeTransfer: () => fileTransfer.resume()
  };
}