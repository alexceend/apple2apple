export type LocalIdentity = {
  deviceId: string;
  nickname: string;
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
  fingerprint: string;
};

const IDENTITY_KEY = "apple2apple.identity.v1";

function arrayBufferToHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(":")
    .toUpperCase();
}

async function fingerprintFromPublicKey(publicKeyJwk: JsonWebKey) {
  const encoded = new TextEncoder().encode(JSON.stringify(publicKeyJwk));
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return arrayBufferToHex(hash).slice(0, 47);
}

export async function getOrCreateIdentity(): Promise<LocalIdentity> {
  const existing = localStorage.getItem(IDENTITY_KEY);

  if (existing) {
    return JSON.parse(existing);
  }

  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256"
    },
    true,
    ["sign", "verify"]
  );

  const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

  const fingerprint = await fingerprintFromPublicKey(publicKeyJwk);

  const identity: LocalIdentity = {
    deviceId: `dev-${crypto.randomUUID()}`,
    nickname: "Mi PC",
    publicKeyJwk,
    privateKeyJwk,
    fingerprint
  };

  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));

  return identity;
}

export async function updateNickname(
  newNickname: string
): Promise<LocalIdentity> {
  const stored = localStorage.getItem(IDENTITY_KEY);

  if (!stored) {
    throw new Error("No existe identidad");
  }

  const identity: LocalIdentity = JSON.parse(stored);

  identity.nickname = newNickname;

  localStorage.setItem(
    IDENTITY_KEY,
    JSON.stringify(identity)
  );

  return identity;
}


export function createInviteLink(identity: LocalIdentity) {
  const payload = {
    nickname: identity.nickname,
    publicKeyJwk: identity.publicKeyJwk,
    fingerprint: identity.fingerprint
  };

  const encoded = btoa(JSON.stringify(payload));

  return `apple2apple://friend/${encoded}`;
}

export function parseInviteLink(link: string) {
  const prefix = "apple2apple://friend/";

  if (!link.startsWith(prefix)) {
    throw new Error("Link de invitación inválido");
  }

  const encoded = link.slice(prefix.length);
  return JSON.parse(atob(encoded));
}