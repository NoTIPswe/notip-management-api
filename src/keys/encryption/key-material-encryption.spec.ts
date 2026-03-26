import {
  decryptKeyMaterial,
  encryptKeyMaterial,
} from './key-material-encryption';

describe('key-material-encryption', () => {
  const originalKey = process.env.DB_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.DB_ENCRYPTION_KEY = '12345678901234567890123456789012';
  });

  afterAll(() => {
    if (originalKey === undefined) {
      delete process.env.DB_ENCRYPTION_KEY;
      return;
    }

    process.env.DB_ENCRYPTION_KEY = originalKey;
  });

  it('encrypts and decrypts key material', () => {
    const plaintext = Buffer.from('super-secret-key-material');

    const encrypted = encryptKeyMaterial(plaintext);

    expect(encrypted.equals(plaintext)).toBe(false);
    expect(decryptKeyMaterial(encrypted)).toEqual(plaintext);
  });

  it('returns legacy plaintext values unchanged', () => {
    const plaintext = Buffer.from('legacy-unencrypted-value');

    expect(decryptKeyMaterial(plaintext)).toEqual(plaintext);
  });
});
