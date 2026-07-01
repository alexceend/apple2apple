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
  nextGlobalBlockIndex: number;
};

export type FileCancelMessage = {
  type: "file.cancel";
  fileId: string;
};

export type FileTransferControlMessage =
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