export type FileMetaMessage = {
  type: "file.meta";
  fileId: string;
  fileName: string;
  fileSize: number;
  chunkSize: number;
  totalChunks: number;
};

export type FileChunkHeaderMessage = {
  type: "file.chunk";
  fileId: string;
  index: number;
  size: number;
};

export type FileDoneMessage = {
  type: "file.done";
  fileId: string;
};

export type FileTransferControlMessage =
  | FileMetaMessage
  | FileChunkHeaderMessage
  | FileDoneMessage;