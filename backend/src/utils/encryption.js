import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

const getEncryptionKey = () => {
  const keyString = process.env.ENCRYPTION_KEY;

  if (!keyString) {
    throw new Error(
      "ENCRYPTION_KEY is missing from environment variables"
    );
  }

  const key = Buffer.from(keyString, "hex");

  if (key.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be exactly 32 bytes / 64 hexadecimal characters"
    );
  }

  return key;
};


/* ==========================================
   ENCRYPT
========================================== */

export const encrypt = (text) => {
  if (text === null || text === undefined) {
    throw new Error("Text is required for encryption");
  }

  const key = getEncryptionKey();

  // 12 bytes is recommended for GCM
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    key,
    iv
  );

  let encrypted = cipher.update(
    String(text),
    "utf8",
    "hex"
  );

  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  /*
    Format:

    IV : AUTH_TAG : ENCRYPTED_DATA
  */

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted,
  ].join(":");
};


/* ==========================================
   DECRYPT
========================================== */

export const decrypt = (encryptedText) => {
  if (!encryptedText) {
    throw new Error(
      "Encrypted text is required"
    );
  }

  const parts = encryptedText.split(":");

  if (parts.length !== 3) {
    throw new Error(
      "Invalid encrypted data format"
    );
  }

  const [
    ivHex,
    authTagHex,
    encryptedHex,
  ] = parts;

  const key = getEncryptionKey();

  const iv = Buffer.from(
    ivHex,
    "hex"
  );

  const authTag = Buffer.from(
    authTagHex,
    "hex"
  );

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    iv
  );

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(
    encryptedHex,
    "hex",
    "utf8"
  );

  decrypted += decipher.final("utf8");

  return decrypted;
};