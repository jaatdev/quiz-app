/**
 * Frontend Admin Config
 * Exposes a safe, client-side primary admin email (public) for UI gating.
 * Note: Server-side protection is still enforced independently.
 */

export const PRIMARY_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_PRIMARY_ADMIN_EMAIL || 'kc90040@gmail.com';
