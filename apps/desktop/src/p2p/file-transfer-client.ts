import type {
  FileTransferControlMessage,
  FileMetaMessage,
  TransferProgress,
} from "./file-transfer-types";

import {
  createFileBlockPacket,
  parseFileBlockPacket
} from "./file-packet";


const BLOCK_SIZE = 240 * 1024;

type SendData = (data: string | ArrayBuffer) => Promise<void>;
type OnLog = (message: unknown) => void;

type ReceivedFileState = {
  meta: FileMetaMessage;
  blocks: ArrayBuffer[];
  receivedBlocks: number;
  completedPieces: boolean[];
  startedAt: number;
  lastUpdatedAt: number;
};



type FileTransferClientOptions = {
  sendData: SendData;
  onLog: OnLog;
  onReceiveComplete: (file: {
    fileId: string;
    fileName: string;
    blob: Blob;
  }) => void;
  onProgress?: (progress: TransferProgress) => void;
};

export class FileTransferClient {
  private receivingFiles = new Map<string, ReceivedFileState>();
  private activeReceiveFileId: string | null = null;

  private resumeResolvers = new Map<
    string,
    (missingPieces: number[]) => void
  >();

  private lastProgressAt = 0;


  constructor(private readonly options: FileTransferClientOptions) {}


  async sendFile(file: File) {
    const fileId = this.getFileId(file);

    const blockSize = BLOCK_SIZE;
    const pieceSize = this.choosePieceSize(file.size);
    const blocksPerPiece = Math.ceil(pieceSize / blockSize);

    const totalBlocks = Math.ceil(file.size / blockSize);
    const totalPieces = Math.ceil(file.size / pieceSize);


    const meta: FileMetaMessage = {
      type: "file.meta",
      fileId,
      fileName: file.name,
      fileSize: file.size,
      pieceSize,
      blockSize,
      totalPieces,
      totalBlocks
    };

    await this.sendJson(meta);

    const missingPieces = await this.waitForResumeStatus(fileId);

    this.options.onLog({
      type: "file.send.start",
      fileId,
      fileName: file.name,
      fileSize: file.size,
      pieceSize,
      blockSize,
      totalPieces,
      totalBlocks,
      missingPieces
    });

    const startedAt = Date.now();

    for (const pieceIndex of missingPieces) {
  const firstBlock = pieceIndex * blocksPerPiece;
  const lastBlock = Math.min(firstBlock + blocksPerPiece, totalBlocks);

  for (
    let globalBlockIndex = firstBlock;
    globalBlockIndex < lastBlock;
    globalBlockIndex++
  ) {
      const start = globalBlockIndex * blockSize;
      const end = Math.min(start + blockSize, file.size);

      const payload = await file.slice(start, end).arrayBuffer();

      const blockIndex = globalBlockIndex % blocksPerPiece;

      const packet = createFileBlockPacket({
        pieceIndex,
        blockIndex,
        globalBlockIndex,
        payload
      });

      await this.options.sendData(packet);

      const bytesTransferred = Math.min(
        (globalBlockIndex + 1) * blockSize,
        file.size
      );

      const elapsedSeconds = Math.max(
        (Date.now() - startedAt) / 1000,
        0.001
      );

      this.emitProgress({
        fileId,
        fileName: file.name,
        bytesTransferred,
        totalBytes: file.size,
        speedMBps: bytesTransferred / 1024 / 1024 / elapsedSeconds,
        percent: (bytesTransferred / file.size) * 100,
        direction: "send"
      });
    }
  }

    await this.sendJson({
      type: "file.done",
      fileId
    });

    const elapsedSeconds = Math.max((Date.now() - startedAt) / 1000, 0.001);
    const mb = file.size / 1024 / 1024;


    this.options.onLog({
      type: "file.send.done",
      fileId,
      fileName: file.name,
      fileSize: file.size,
      seconds: elapsedSeconds,
      mbps: mb / elapsedSeconds
    });
  }

  handleData(data: string | ArrayBuffer) {
    if (typeof data === "string") {
      this.handleJson(data);
      return;
    }

    this.handleBinaryBlock(data);
  }

  private async handleJson(raw: string) {
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
      await this.handleFileMeta(message);
      return;
    }

    if (message.type === "file.resume.status") {
      const resolver = this.resumeResolvers.get(message.fileId);

      if (resolver) {
        resolver(message.missingPieces);
      }

      this.options.onLog({
        type: "file.resume.status.received",
        fileId: message.fileId,
        missingPieces: message.missingPieces
      });

      return;
    }

    if (message.type === "file.done"){
      this.handleFileDone(message.fileId);
      return;
    }

    if(message.type === "file.cancel"){
      this.receivingFiles.delete(message.fileId);

      if (this.activeReceiveFileId === message.fileId) {
        this.activeReceiveFileId = null;
      }

      this.options.onLog({
        type: "file.cancel.received",
        fileId: message.fileId
      });
    }
  }

  private async handleFileMeta(message: FileMetaMessage) {
    const existing = this.receivingFiles.get(message.fileId);

    if (existing) {
      this.activeReceiveFileId = message.fileId;

      await this.sendJson({
        type: "file.resume.status",
        fileId: message.fileId,
        missingPieces: this.getMissingPieces(existing)
      });

      this.options.onLog({
        type: "file.resume.status.sent",
        fileId: message.fileId,
        fileName: message.fileName,
        missingPieces: this.getMissingPieces(existing)
      });

      return;
    }

    const now = Date.now();

    this.receivingFiles.set(message.fileId, {
      meta: message,
      blocks: [],
      receivedBlocks: 0,
      completedPieces: new Array(message.totalPieces).fill(false),
      startedAt: now,
      lastUpdatedAt: now
    });

    this.activeReceiveFileId = message.fileId;

    await this.sendJson({
      type: "file.resume.status",
      fileId: message.fileId,
      missingPieces: Array.from(
        { length: message.totalPieces },
        (_, index) => index
      )
    });

    this.options.onLog({
      type: "file.meta.received",
      fileId: message.fileId,
      fileName: message.fileName,
      fileSize: message.fileSize,
      pieceSize: message.pieceSize,
      blockSize: message.blockSize,
      totalPieces: message.totalPieces,
      totalBlocks: message.totalBlocks
    });
  }

  private getMissingPieces(state: ReceivedFileState) {
    const missingPieces: number[] = [];

    for (let i = 0; i < state.meta.totalPieces; i++) {
      if (!state.completedPieces[i]) {
        missingPieces.push(i);
      }
    }

    return missingPieces;
  }

  private handleBinaryBlock(packet: ArrayBuffer) {
    const parsed = parseFileBlockPacket(packet);

    if (!parsed) {
      this.options.onLog({
        type: "file.invalid_binary_packet",
        size: packet.byteLength
      });
      return;
    }

    if (!this.activeReceiveFileId) {
      this.options.onLog({
        type: "file.binary_without_active_file",
        size: packet.byteLength
      });
      return;
    }

    const state = this.receivingFiles.get(this.activeReceiveFileId);

    if (!state) {
      this.options.onLog({
        type: "file.binary_without_state",
        fileId: this.activeReceiveFileId
      });
      return;
    }

    if (parsed.globalBlockIndex >= state.meta.totalBlocks) {
      this.options.onLog({
        type: "file.block_out_of_range",
        fileId: state.meta.fileId,
        globalBlockIndex: parsed.globalBlockIndex,
        totalBlocks: state.meta.totalBlocks
      });
      return;
    }

    if (!state.blocks[parsed.globalBlockIndex]) {
      state.receivedBlocks++;
    }

    state.blocks[parsed.globalBlockIndex] = parsed.payload;

    const blocksPerPiece = Math.ceil(
      state.meta.pieceSize / state.meta.blockSize
    );

    const firstBlock = parsed.pieceIndex * blocksPerPiece;
    const lastBlock = Math.min(
      firstBlock + blocksPerPiece,
      state.meta.totalBlocks
    );

    let pieceComplete = true;

    for (let i = firstBlock; i < lastBlock; i++) {
      if (!state.blocks[i]) {
        pieceComplete = false;
        break;
      }
    }

    if (pieceComplete) {
      state.completedPieces[parsed.pieceIndex] = true;
    }

    state.lastUpdatedAt = Date.now();


    const bytesTransferred = Math.min(
      state.receivedBlocks * state.meta.blockSize,
      state.meta.fileSize
    );

    const elapsedSeconds = Math.max(
      (Date.now() - state.startedAt) / 1000,
      0.001
    );

    const speedMBps =
      bytesTransferred / 1024 / 1024 / elapsedSeconds;

    this.emitProgress({
      fileId: state.meta.fileId,
      fileName: state.meta.fileName,
      bytesTransferred,
      totalBytes: state.meta.fileSize,
      speedMBps,
      percent: (bytesTransferred / state.meta.fileSize) * 100,
      direction: "receive"
    });
  }

  private async handleFileDone(fileId: string) {
    const state = this.receivingFiles.get(fileId);

    if (!state) {
      this.options.onLog({
        type: "file.done_without_state",
        fileId
      });
      return;
    }

    const missingPieces = this.getMissingPieces(state);

    if (missingPieces.length > 0) {
      this.options.onLog({
        type: "file.receive.incomplete",
        fileId,
        fileName: state.meta.fileName,
        missingPieces
      });
      return;
    }

    const blob = new Blob(state.blocks);

    this.options.onReceiveComplete({
      fileId,
      fileName: state.meta.fileName,
      blob
    });

    this.options.onLog({
      type: "file.receive.done",
      fileId,
      fileName: state.meta.fileName,
      receivedBlocks: state.receivedBlocks,
      totalBlocks: state.meta.totalBlocks
    });

    this.receivingFiles.delete(fileId);

    if (this.activeReceiveFileId === fileId) {
      this.activeReceiveFileId = null;
    }
  }

  private waitForResumeStatus(fileId: string) {
    return new Promise<number[]>((resolve) => {
      const timeoutId = window.setTimeout(() => {
        this.resumeResolvers.delete(fileId);

        this.options.onLog({
          type: "file.resume.status.timeout",
          fileId,
        });

        resolve([]);
      }, 3000);

      this.resumeResolvers.set(fileId, (missingPieces) => {
        window.clearTimeout(timeoutId);
        this.resumeResolvers.delete(fileId);
        resolve(missingPieces);
      });
    });
  }

  private emitProgress(progress: TransferProgress) {
    const now = Date.now();
    const isFinished = progress.bytesTransferred >= progress.totalBytes;

    if (now - this.lastProgressAt < 100 && !isFinished) {
      return;
    }

    this.lastProgressAt = now;
    this.options.onProgress?.(progress);
  }

  private async sendJson(message: FileTransferControlMessage) {
    await this.options.sendData(JSON.stringify(message));
  }

  private getFileId(file: File) {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  private choosePieceSize(fileSize: number) {
    const mib = 1024 * 1024;

    if (fileSize < 350 * mib) {
      return 1 * mib;
    }

    if (fileSize < 2 * 1024 * mib) {
      return 2 * mib;
    }

    return 4 * mib;
  }
}