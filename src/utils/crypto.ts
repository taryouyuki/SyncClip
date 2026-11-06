import { ClipType } from '../types';

// Convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Derive a 256-bit AES-GCM key from passphrase and salt using PBKDF2
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Compute SHA-256 hash formatted in hex
export async function computeHash(text: string): Promise<string> {
  const enc = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', enc.encode(text));
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Generate human-verifiable key fingerprint (e.g., "8F3C-9A12-B4E8-710D")
export async function generateKeyFingerprint(passphrase: string): Promise<string> {
  if (!passphrase) return '0000-0000-0000-0000';
  const fullHash = await computeHash(`syncclip_salt_v1_${passphrase}`);
  const blocks = [
    fullHash.substring(0, 4),
    fullHash.substring(4, 8),
    fullHash.substring(8, 12),
    fullHash.substring(12, 16),
  ].map((b) => b.toUpperCase());
  return blocks.join('-');
}

// Encrypt plaintext using AES-256-GCM
export async function encryptText(
  text: string,
  passphrase: string
): Promise<{ encryptedPayload: string; iv: string; salt: string; hash: string }> {
  const enc = new TextEncoder();
  const encodedText = enc.encode(text);

  // Generate 16-byte random salt and 12-byte random IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(passphrase, salt);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    encodedText
  );

  const hash = await computeHash(text);

  return {
    encryptedPayload: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
    hash,
  };
}

// Decrypt AES-256-GCM ciphertext
export async function decryptText(
  encryptedPayload: string,
  iv: string,
  salt: string,
  passphrase: string
): Promise<string> {
  try {
    const cipherBuffer = base64ToBuffer(encryptedPayload);
    const ivBuffer = base64ToBuffer(iv);
    const saltBuffer = base64ToBuffer(salt);

    const key = await deriveKey(passphrase, saltBuffer);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer as unknown as BufferSource,
      },
      key,
      cipherBuffer as unknown as BufferSource
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    throw new Error('復号化に失敗しました。暗号化キーが一致していません。');
  }
}

// Generate secure random passphrase
export function generateSecurePassphrase(length = 24): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  return result;
}

// Detect clip type (url, code snippet, multiline, plain text)
export function detectClipType(text: string): ClipType {
  const trimmed = text.trim();
  if (/^https?:\/\/[^\s]+$/i.test(trimmed)) {
    return 'url';
  }
  if (
    trimmed.includes('{') ||
    trimmed.includes(';') ||
    trimmed.includes('function') ||
    trimmed.includes('import ') ||
    trimmed.includes('class ') ||
    trimmed.includes('const ') ||
    trimmed.includes('let ') ||
    trimmed.includes('def ') ||
    trimmed.includes('val ') ||
    trimmed.startsWith('curl ') ||
    trimmed.startsWith('git ') ||
    trimmed.startsWith('npm ')
  ) {
    return 'code';
  }
  if (trimmed.includes('\n')) {
    return 'multiline';
  }
  return 'text';
}
