/**
 * Environment access with fail-fast validation.
 *
 * Only VITE_-prefixed variables reach the browser, and everything prefixed
 * VITE_ IS inlined into the built bundle. Nothing secret may live here:
 * the AI provider key stays in Supabase Edge Function secrets, and the
 * service_role key must never appear in this project at all.
 */

function required(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(
      `متغيّر البيئة ${name} غير مضبوط — انسخ .env.example إلى .env`,
    );
  }
  return value.trim();
}

export const env = {
  supabaseUrl: required('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  supabasePublishableKey: required(
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  ),
  isDev: import.meta.env.DEV,
};
