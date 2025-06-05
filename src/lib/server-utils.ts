// src/lib/server-utils.ts
import crypto from 'crypto';

// IMPORTANT: Store this key securely, e.g., in environment variables.
// For demonstration, it's hardcoded here if env var is not set, which is NOT secure for production.
// Ensure API_KEY_ENCRYPTION_KEY is set in your environment.
const ENCRYPTION_KEY_ENV = process.env.API_KEY_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY_ENV || ENCRYPTION_KEY_ENV.length !== 32) {
  console.warn(
    'API_KEY_ENCRYPTION_KEY environment variable is not set or not 32 bytes long. ' +
    'Using a default insecure key for API key encryption. THIS IS NOT FOR PRODUCTION.'
  );
}
const ENCRYPTION_KEY = ENCRYPTION_KEY_ENV || 'default_insecure_secret_key_32b.'; // Must be 32 bytes for aes-256-cbc

const IV_LENGTH = 16; // For AES, this is always 16

export function encryptApiKey(text: string): string {
  if (!text) return '';
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Could not encrypt API key.');
  }
}

export function decryptApiKey(text: string): string {
  if (!text) return '';
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) throw new Error('Invalid encrypted key format (missing colon).');
    const ivString = textParts[0];
    const encryptedTextString = textParts[1];

    if (!ivString || !encryptedTextString) throw new Error('Invalid encrypted key format (empty parts).');
    if (ivString.length !== IV_LENGTH * 2) throw new Error('Invalid IV length in encrypted key.');


    const iv = Buffer.from(ivString, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedTextString, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    // In a real app, you might want to throw a more specific error or handle it differently
    // For example, if a key cannot be decrypted, it might indicate data corruption or a change in ENCRYPTION_KEY
    throw new Error('Could not decrypt API key. Key may be corrupted or encryption key changed.');
  }
}
