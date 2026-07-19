export async function getEncryptionKey(): Promise<CryptoKey> {
  const storedKey = localStorage.getItem('lumo-device-key');
  if (storedKey) {
    const keyData = base64ToBuffer(storedKey);
    return await window.crypto.subtle.importKey(
      'raw',
      keyData.buffer as ArrayBuffer,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Generate new AES-256 key
  const newKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const exported = await window.crypto.subtle.exportKey('raw', newKey);
  localStorage.setItem('lumo-device-key', bufferToBase64(exported));
  
  return newKey;
}

export async function encryptData(text: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  const encodedText = new TextEncoder().encode(text);
  
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encodedText
  );
  
  // Combine IV and Ciphertext into a single ArrayBuffer
  const combined = new Uint8Array(iv.byteLength + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.byteLength);
  
  return bufferToBase64(combined.buffer as ArrayBuffer);
}

export async function decryptData(encryptedBase64: string): Promise<string> {
  const key = await getEncryptionKey();
  const combined = base64ToBuffer(encryptedBase64);
  
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer
  );
  
  return new TextDecoder().decode(decryptedBuffer);
}

// Helpers for safe base64 ↔ ArrayBuffer conversion
function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array<ArrayBuffer> {
  const binaryStr = window.atob(base64);
  const bytes = new Uint8Array(binaryStr.length) as Uint8Array<ArrayBuffer>;
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}
