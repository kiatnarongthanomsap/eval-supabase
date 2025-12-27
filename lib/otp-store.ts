// In-memory OTP store
// NOTE: In Next.js serverless environment, this Map may not be shared between different server instances
// In production with multiple instances, consider using Redis or a database
// For single instance deployments, this should work fine

interface OtpEntry {
  code: string;
  mobile: string;
}

// Use globalThis to ensure we use the same Map instance across module reloads in development
const globalForOtpStore = globalThis as unknown as { otpStore: Map<string, OtpEntry> | undefined };
const otpStore = globalForOtpStore.otpStore ?? new Map<string, OtpEntry>();
globalForOtpStore.otpStore = otpStore;

export function storeOtp(mobile: string, code: string): void {
  // Normalize mobile number (remove spaces, dashes, etc.)
  const normalizedMobile = mobile.trim().replace(/[\s-]/g, '');
  // Ensure code is stored as string (randomInt gives 1000-9999, so no padding needed)
  const normalizedCode = String(code).trim();
  otpStore.set(normalizedMobile, {
    code: normalizedCode,
    mobile: normalizedMobile,
  });
  // Check if OTP already exists for this mobile (overwrite it)
  const existing = otpStore.has(normalizedMobile);
  
  console.log(`[OTP Store] OTP ${existing ? 'updated' : 'stored'} for mobile "${normalizedMobile}", code: "${normalizedCode}"`);
  console.log(`[OTP Store] Store size: ${otpStore.size}, Store keys: [${Array.from(otpStore.keys()).join(', ')}]`);
}

export function verifyOtp(mobile: string, code: string): boolean {
  // Normalize mobile number (remove spaces, dashes, etc.)
  const normalizedMobile = mobile.trim().replace(/[\s-]/g, '');
  
  // Normalize code to string immediately
  const normalizedInputCode = String(code).trim();
  
  console.log(`[OTP Verify] Starting verification for mobile: "${normalizedMobile}", code: "${normalizedInputCode}" (type: ${typeof code})`);
  console.log(`[OTP Verify] Current store size: ${otpStore.size}`);
  if (otpStore.size > 0) {
    console.log(`[OTP Verify] Store keys: ${Array.from(otpStore.keys()).map(k => `"${k}"`).join(', ')}`);
  }
  
  const entry = otpStore.get(normalizedMobile);
  
  if (!entry) {
    console.log(`[OTP Verify] FAILED: No OTP found for mobile "${normalizedMobile}"`);
    // Check if there's a similar mobile number (for debugging)
    const allKeys = Array.from(otpStore.keys());
    const similarKeys = allKeys.filter(k => k.includes(normalizedMobile.slice(-4)) || normalizedMobile.includes(k.slice(-4)));
    if (similarKeys.length > 0) {
      console.log(`[OTP Verify] Found similar mobile numbers in store: ${similarKeys.map(k => `"${k}"`).join(', ')}`);
    }
    return false; // No OTP found for this mobile number
  }
  
  console.log(`[OTP Verify] OTP entry found for mobile "${normalizedMobile}"`);
  
  // Normalize OTP codes for comparison (both should be 4 digits, no padding needed as randomInt gives 1000-9999)
  const storedCode = String(entry.code).trim();
  const providedCode = normalizedInputCode;
  
  console.log(`[OTP Verify] Comparing codes - stored: "${storedCode}" (length: ${storedCode.length}), provided: "${providedCode}" (length: ${providedCode.length})`);
  console.log(`[OTP Verify] Code comparison: stored === provided ? ${storedCode === providedCode}`);
  
  if (storedCode !== providedCode) {
    console.log(`[OTP Verify] FAILED: Code mismatch`);
    console.log(`[OTP Verify]   Stored code: "${storedCode}" (char codes: ${Array.from(storedCode).map(c => c.charCodeAt(0)).join(',')})`);
    console.log(`[OTP Verify]   Provided code: "${providedCode}" (char codes: ${Array.from(providedCode).map(c => c.charCodeAt(0)).join(',')})`);
    return false; // Code doesn't match
  }
  
  // Valid OTP - remove it after verification (one-time use)
  otpStore.delete(normalizedMobile);
  console.log(`[OTP Verify] SUCCESS: OTP verified for mobile "${normalizedMobile}"`);
  return true;
}

export function removeOtp(mobile: string): void {
  // Normalize mobile number before removing
  const normalizedMobile = mobile.trim().replace(/[\s-]/g, '');
  const deleted = otpStore.delete(normalizedMobile);
  console.log(`[OTP Remove] Removed OTP for mobile "${normalizedMobile}", success: ${deleted}, remaining store size: ${otpStore.size}`);
}

// Debug function to get store info
export function getOtpStoreInfo(): { size: number; entries: Array<{ mobile: string; code: string }> } {
  return {
    size: otpStore.size,
    entries: Array.from(otpStore.entries()).map(([mobile, entry]) => ({
      mobile,
      code: entry.code,
    })),
  };
}

