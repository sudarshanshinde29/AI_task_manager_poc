import { SignJWT } from 'jose';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

/**
 * Get Google OAuth Access Token
 */
export async function getAccessToken(env: { GOOGLE_CLIENT_EMAIL: string; GOOGLE_PRIVATE_KEY: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // Generate the JWT using `jose`
  const jwt = await new SignJWT({ scope: 'https://www.googleapis.com/auth/calendar' })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(env.GOOGLE_CLIENT_EMAIL)
    .setSubject(env.GOOGLE_CLIENT_EMAIL)
    .setAudience(GOOGLE_TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600) // 1-hour expiration
    .sign(await importPrivateKey(env.GOOGLE_PRIVATE_KEY));

  // Exchange JWT for Access Token
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch access token: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
    token_type: string;
  };

  return data.access_token;
}

/**
 * Import PEM-formatted private key into a CryptoKey
 */
async function importPrivateKey(pemKey: string): Promise<CryptoKey> {
    // Clean up the PEM key by removing headers, footers, and line breaks
    const pemBody = pemKey
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\n/g, '')
      .trim();
  
    // Decode Base64 content into binary
    const binaryDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  
    // Import the key into Web Crypto API
    return crypto.subtle.importKey(
      'pkcs8',
      binaryDer.buffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );
  }
  