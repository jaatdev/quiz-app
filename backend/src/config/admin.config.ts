/**
 * Admin Configuration
 * 
 * This file contains critical admin configuration that cannot be modified
 * through the UI or API. The PRIMARY_ADMIN_EMAIL is permanently protected.
 */

/**
 * Primary Admin Email - Cannot be revoked or downgraded
 * 
 * This email address is the main administrator of the system.
 * It has permanent admin access and cannot be:
 * - Removed from admin role
 * - Downgraded to user role
 * - Deleted from the system
 * - Have permissions revoked
 * 
 * If accidentally modified in the database, this config will automatically
 * restore the admin status on next login/API call.
 */
export const PRIMARY_ADMIN_EMAIL = 'kc90040@gmail.com';

/**
 * Check if an email is the primary admin
 */
export const isPrimaryAdmin = (email: string | undefined): boolean => {
  return email === PRIMARY_ADMIN_EMAIL;
};

/**
 * Secondary admins (can be revoked)
 * Add emails here for admins who can potentially be downgraded
 */
export const SECONDARY_ADMINS: string[] = [];

/**
 * Admin protection levels
 */
export const ADMIN_PROTECTION = {
  PRIMARY: 'PRIMARY', // Cannot be revoked
  SECONDARY: 'SECONDARY', // Can be revoked
  TEMPORARY: 'TEMPORARY' // Time-limited admin access
} as const;

/**
 * Get admin level for an email
 */
export const getAdminLevel = (email: string | undefined): typeof ADMIN_PROTECTION[keyof typeof ADMIN_PROTECTION] | null => {
  if (isPrimaryAdmin(email)) {
    return ADMIN_PROTECTION.PRIMARY;
  }
  if (SECONDARY_ADMINS.includes(email || '')) {
    return ADMIN_PROTECTION.SECONDARY;
  }
  return null;
};
