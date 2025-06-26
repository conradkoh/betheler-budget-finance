/**
 * Password protection utilities for client-side password verification
 * Uses SHA-256 hashing with salt to prevent rainbow table attacks
 */

/**
 * Generates a SHA-256 hash of the provided password with salt
 * @param password - The password to hash
 * @param salt - The salt to use for hashing
 * @returns Promise<string> - The hex-encoded hash
 * @throws Error if password or salt is empty/undefined
 */
export async function generatePasswordHash(password: string, salt: string): Promise<string> {
  // Validate inputs
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required and must be a non-empty string');
  }

  if (!salt || typeof salt !== 'string') {
    throw new Error(
      'Salt is required and must be a non-empty string. Please provide a unique salt for security.'
    );
  }

  const encoder = new TextEncoder();

  // Combine salt and password
  const saltedPassword = `${salt}:${password}`;
  const data = encoder.encode(saltedPassword);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Verifies a password against a hash using the provided salt
 * @param password - The password to verify
 * @param hash - The hash to verify against
 * @param salt - The salt used for hashing
 * @returns Promise<boolean> - True if the password matches the hash
 * @throws Error if any parameter is empty/undefined
 */
export async function verifyPassword(
  password: string,
  hash: string,
  salt: string
): Promise<boolean> {
  try {
    // Validate inputs
    if (!password || typeof password !== 'string') {
      throw new Error('Password is required and must be a non-empty string');
    }

    if (!hash || typeof hash !== 'string') {
      throw new Error('Hash is required and must be a non-empty string');
    }

    if (!salt || typeof salt !== 'string') {
      throw new Error(
        'Salt is required and must be a non-empty string. Please provide the same salt used for hashing.'
      );
    }

    const passwordHash = await generatePasswordHash(password, salt);
    return passwordHash === hash;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Console wrapper for generatePasswordHash - requires both password and salt
 * @param password - The password to hash
 * @param salt - The salt to use for hashing
 * @returns Promise<string> - The hex-encoded hash
 */
function generatePasswordHashForConsole(...args: string[]): Promise<string> {
  if (args.length < 2) {
    throw new Error(
      'Both password and salt are required. Usage: window.generatePasswordHash("your-password", "your-unique-salt")'
    );
  }

  const [password, salt] = args;
  return generatePasswordHash(password, salt);
}

// Expose the function to the global window object for developer console use
if (typeof window !== 'undefined') {
  window.generatePasswordHash = generatePasswordHashForConsole;
}

declare global {
  interface Window {
    generatePasswordHash: typeof generatePasswordHashForConsole;
  }
}
