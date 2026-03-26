import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { ValueTransformer } from 'typeorm';

const ENCRYPTION_PREFIX = Buffer.from('enc:v1:');
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const AES_256_KEY_LENGTH = 32;

const normalizeKey = (rawKey: string): Buffer => {
  const trimmed = rawKey.trim();

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }

  try {
    const decoded = Buffer.from(trimmed, 'base64');
    if (decoded.length === AES_256_KEY_LENGTH) {
      return decoded;
    }
  } catch {
    // Ignore base64 parsing errors and validate length below.
  }

  const utf8 = Buffer.from(trimmed, 'utf8');
  if (utf8.length === AES_256_KEY_LENGTH) {
    return utf8;
  }

  throw new Error(
    'DB_ENCRYPTION_KEY must be a 32-byte key in raw text, base64, or 64-char hex format',
  );
};

const getEncryptionKey = (): Buffer => {
  const rawKey = process.env.DB_ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error('Missing required environment variable: DB_ENCRYPTION_KEY');
  }

  return normalizeKey(rawKey);
};

export const encryptKeyMaterial = (value: Buffer): Buffer => {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([ENCRYPTION_PREFIX, iv, authTag, encrypted]);
};

export const decryptKeyMaterial = (value: Buffer): Buffer => {
  if (!value.subarray(0, ENCRYPTION_PREFIX.length).equals(ENCRYPTION_PREFIX)) {
    return value;
  }

  const payload = value.subarray(ENCRYPTION_PREFIX.length);
  const iv = payload.subarray(0, IV_LENGTH);
  const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};

export const keyMaterialTransformer: ValueTransformer = {
  to(value?: Buffer | null): Buffer | null {
    if (value == null) {
      return null;
    }

    return encryptKeyMaterial(value);
  },
  from(value?: Buffer | null): Buffer | null {
    if (value == null) {
      return null;
    }

    return decryptKeyMaterial(value);
  },
};
