import type {
  FileTransferControlMessage,
  FileMetaMessage,
  FileChunkHeaderMessage
} from "./file-transfer-types";

const DEFAULT_CHUNK_SIZE = 256 * 1024;

type SendData = (data: string | ArrayBuffer) => Promise<void>;
type OnLog = (message: unknown) => void;

type ReceivedFileState = {
  meta: FileMetaMessage;
  chunks: ArrayBuffer[];
  nextChunkIndex: number;
  pendingChunkHeader: FileChunkHeaderMessage | null;
};

type FileTransferClientOptions = {
  sendData: SendData;
  onLog: OnLog;
  onReceiveComplete: (file: {
    fileId: string;
    fileName: string;
    blob: Blob;
  }) => void;
  onProgress?: (progress: {
    fileId: string;
    fileName: string;
    sentOrReceivedChunks: number;
    totalChunks: number;
    direction: "send" | "receive";
  }) => void;
};

export class FileTransferClient {
  private receivingFiles = new Map<string, ReceivedFileState>();
  private activeReceiveFileId: string | null = null;

  private lastProgressAt = 0;

  constructor(private readonly options: FileTransferClientOptions) {}


  private emitProgress(progress: {
    fileId: string;
    fileName: string;
    sentOrReceivedChunks: number;
    totalChunks: number;
    direction: "send" | "receive";
  }) {
    const now = Date.now();
    const isLastChunk = progress.sentOrReceivedChunks === progress.totalChunks;

    if (now - this.lastProgressAt < 100 && !isLastChunk) {
      return;
    }

    this.lastProgressAt = now;
    this.options.onProgress?.(progress);
  }

  async sendFile(file: File) {
    const fileId = crypto.randomUUID();
    const chunkSize = DEFAULT_CHUNK_SIZE;
    const totalChunks = Math.ceil(file.size / chunkSize);

    const meta: FileMetaMessage = {
      type: "file.meta",
      fileId,
      fileName: file.name,
      fileSize: file.size,
      chunkSize,
      totalChunks
    };

    await this.sendJson(meta);

    for (let index = 0; index < totalChunks; index++) {
      const start = index * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = await file.slice(start, end).arrayBuffer();

      await this.sendJson({
        type: "file.chunk",
        fileId,
        index,
        size: chunk.byteLength
      });

      await this.options.sendData(chunk);

      this.emitProgress({
        fileId,
        fileName: file.name,
        sentOrReceivedChunks: index + 1,
        totalChunks,
        direction: "send"
      });
    }

    await this.sendJson({
      type: "file.done",
      fileId
    });

    this.options.onLog({
      type: "file.send.done",
      fileId,
      fileName: file.name,
      fileSize: file.size
    });
  }

  handleData(data: string | ArrayBuffer) {
    if (typeof data === "string") {
      this.handleJson(data);
      return;
    }

    this.handleBinaryChunk(data);
  }

  private handleJson(raw: string) {
    let message: FileTransferControlMessage;

    try {
      message = JSON.parse(raw);
    } catch {
      this.options.onLog({
        type: "file.invalid_json",
        raw
      });
      return;
    }

    if (message.type === "file.meta") {
      this.receivingFiles.set(message.fileId, {
        meta: message,
        chunks: [],
        nextChunkIndex: 0,
        pendingChunkHeader: null
      });

      this.activeReceiveFileId = message.fileId;

      this.options.onLog({
        type: "file.meta.received",
        fileName: message.fileName,
        fileSize: message.fileSize,
        totalChunks: message.totalChunks
      });

      return;
    }

    if (message.type === "file.chunk") {
      const state = this.receivingFiles.get(message.fileId);

      if (!state) {
        this.options.onLog({
          type: "file.chunk_without_meta",
          fileId: message.fileId
        });
        return;
      }

      state.pendingChunkHeader = message;
      this.activeReceiveFileId = message.fileId;
      return;
    }

    if (message.type === "file.done") {
      const state = this.receivingFiles.get(message.fileId);

      if (!state) {
        return;
      }

      const blob = new Blob(state.chunks);
      this.options.onReceiveComplete({
        fileId: message.fileId,
        fileName: state.meta.fileName,
        blob
      });

      this.options.onLog({
        type: "file.receive.done",
        fileId: message.fileId,
        fileName: state.meta.fileName,
        receivedChunks: state.chunks.length
      });

      this.receivingFiles.delete(message.fileId);

      if (this.activeReceiveFileId === message.fileId) {
        this.activeReceiveFileId = null;
      }
    }
  }

  private handleBinaryChunk(chunk: ArrayBuffer) {
    if (!this.activeReceiveFileId) {
      this.options.onLog({
        type: "file.binary_without_active_file",
        size: chunk.byteLength
      });
      return;
    }

    const state = this.receivingFiles.get(this.activeReceiveFileId);

    if (!state || !state.pendingChunkHeader) {
      this.options.onLog({
        type: "file.binary_without_header",
        size: chunk.byteLength
      });
      return;
    }

    state.chunks[state.pendingChunkHeader.index] = chunk;
    state.nextChunkIndex = state.pendingChunkHeader.index + 1;
    state.pendingChunkHeader = null;

    this.emitProgress({
      fileId: state.meta.fileId,
      fileName: state.meta.fileName,
      sentOrReceivedChunks: state.nextChunkIndex,
      totalChunks: state.meta.totalChunks,
      direction: "receive"
    });
  }

  private async sendJson(message: FileTransferControlMessage) {
    await this.options.sendData(JSON.stringify(message));
  }
}