export const normalizeContactPhone = (value?: string) =>
  value === '+92 308 692 5545' ? '+92 325 432 0179' : value || '+92 325 432 0179'

export const normalizeContactWhatsapp = (value?: string) =>
  value === '923086925545' ? '923254320179' : value || '923254320179'

export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',

  // ── Site / Brand ──────────────────────────────────────────────────────────
  siteUrl: import.meta.env.VITE_SITE_URL || 'https://tryspeekly.com',
  siteName: import.meta.env.VITE_SITE_NAME || 'TrySpeekly',

  // ── Public contact details (single source of truth — set in .env) ──────────
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || 'hello@tryspeekly.com',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@tryspeekly.com',
  privacyEmail: import.meta.env.VITE_PRIVACY_EMAIL || 'privacy@tryspeekly.com',
  paymentsEmail: import.meta.env.VITE_PAYMENTS_EMAIL || 'payments@tryspeekly.com',
  contactPhone: normalizeContactPhone(import.meta.env.VITE_CONTACT_PHONE),
  contactWhatsapp: normalizeContactWhatsapp(import.meta.env.VITE_CONTACT_WHATSAPP),
  // Physical address — empty by default so it stays hidden until a real one is set.
  contactAddress: import.meta.env.VITE_CONTACT_ADDRESS || '',

  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;
