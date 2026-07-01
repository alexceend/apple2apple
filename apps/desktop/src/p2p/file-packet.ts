const MAGIC_FILE_BLOCK = 0xA2A20001;

const HEADER_SIZE = 24;
// 0  - 3  magic
// 4  - 7  pieceIndex
// 8  - 11 blockIndex
// 12 - 15 globalBlockIndex
// 16 - 19 payloadSize
// 20 - 23 reserved

export function createFileBlockPacket(params: {
  pieceIndex: number;
  blockIndex: number;
  globalBlockIndex: number;
  payload: ArrayBuffer;
}) {
  const packet = new ArrayBuffer(HEADER_SIZE + params.payload.byteLength);
  const view = new DataView(packet);

  view.setUint32(0, MAGIC_FILE_BLOCK);
  view.setUint32(4, params.pieceIndex);
  view.setUint32(8, params.blockIndex);
  view.setUint32(12, params.globalBlockIndex);
  view.setUint32(16, params.payload.byteLength);
  view.setUint32(20, 0);

  new Uint8Array(packet, HEADER_SIZE).set(new Uint8Array(params.payload));

  return packet;
}

export function parseFileBlockPacket(packet: ArrayBuffer) {
  if (packet.byteLength < HEADER_SIZE) {
    return null;
  }

  const view = new DataView(packet);
  const magic = view.getUint32(0);

  if (magic !== MAGIC_FILE_BLOCK) {
    return null;
  }

  const pieceIndex = view.getUint32(4);
  const blockIndex = view.getUint32(8);
  const globalBlockIndex = view.getUint32(12);
  const payloadSize = view.getUint32(16);

  const payloadStart = HEADER_SIZE;
  const payloadEnd = payloadStart + payloadSize;

  if (payloadEnd > packet.byteLength) {
    return null;
  }

  return {
    pieceIndex,
    blockIndex,
    globalBlockIndex,
    payload: packet.slice(payloadStart, payloadEnd)
  };
}