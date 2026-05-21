const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error(
    "Erro Crítico de Segurança: VITE_ENCRYPTION_KEY não está definida nas variáveis de ambiente (.env)."
  );
}

const ALGORITHM = 'AES-GCM';

// DERIVA A CHAVE CRIPTOGRÁFICA A PARTIR DA VITE_ENCRYPTION_KEY USANDO PBKDF2 + AES-GCM
async function getKey() {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(ENCRYPTION_KEY),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// CRIPTOGRAFA UM TEXTO EM PLAIN TEXT E RETORNA EM BASE64 (IV PREFIXADO)
export async function encrypt(text: string): Promise<string> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey();

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    enc.encode(text)
  );

  const encryptedArray = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + encryptedArray.length);
  combined.set(iv);
  combined.set(encryptedArray, iv.length);

  return btoa(String.fromCharCode(...combined));
}

// DESCRIPTOGRAFA UM TEXTO BASE64 GERADO PELA FUNÇÃO encrypt()
export async function decrypt(encryptedText: string): Promise<string> {
  try {
    const combined = new Uint8Array(
      atob(encryptedText)
        .split('')
        .map((c) => c.charCodeAt(0))
    );
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const key = await getKey();

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error('Erro na descriptografia:', e);
    throw new Error('Falha ao descriptografar dados');
  }
}
