export type FileMetaMessage = {
  type: "file.meta";
  fileId: string;
  fileName: string;
  fileSize: number;

  pieceSize: number;
  blockSize: number;

  totalPieces: number;
  totalBlocks: number;
};

export type FileDoneMessage = {
  type: "file.done";
  fileId: string;
};

export type FileResumeStatusMessage = {
  type: "file.resume.status";
  fileId: string;
  missingPieces: number[];
};

export type FileCancelMessage = {
  type: "file.cancel";
  fileId: string;
};

export type FileTransferControlMessage =
  | FileOfferMessage
  | FileAcceptMessage
  | FileRejectMessage
  | FileMetaMessage
  | FileDoneMessage
  | FileResumeStatusMessage
  | FileCancelMessage;


export type TransferProgress = {
  fileId: string;
  fileName: string;
  bytesTransferred: number;
  totalBytes: number;
  speedMBps: number;
  percent: number;
  direction: "send" | "receive";
};


export type FileOfferMessage = {
  type: "file.offer";
  fileId: string;
  fileName: string;
  fileSize: number;
  pieceSize: number;
  blockSize: number;
  totalPieces: number;
  totalBlocks: number;
};

export type FileAcceptMessage = {
  type: "file.accept";
  fileId: string;
};

export type FileRejectMessage = {
  type: "file.reject";
  fileId: string;
};