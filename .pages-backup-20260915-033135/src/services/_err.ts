/**
 * Shared Supabase error → Arabic translation for the clinical services.
 * Ported from the per-service err() helpers in v2/js/svc-*.js. Each service
 * layers its own constraint names on top via `extra`.
 */
import { dbError } from '../utils/models';

export function svcError(e: unknown, ctx?: string, extra?: Record<string, string>): Error {
  const m = (e as { message?: string })?.message ?? String(e ?? '');

  if (extra) {
    for (const key of Object.keys(extra)) {
      if (new RegExp(key, 'i').test(m)) return new Error(extra[key]);
    }
  }
  if (/permission denied/i.test(m)) return new Error('لا تملك صلاحية ' + (ctx || 'هذه العملية'));
  if (/violates row-level security/i.test(m)) return new Error('لا تملك صلاحية ' + (ctx || ''));
  if (/JWT|not authenticated/i.test(m)) return new Error('انتهت الجلسة — سجّل الدخول مجدداً');

  const translated = dbError(e);
  return new Error(translated || m);
}

/** Log the technical detail without showing it. */
export function logTechnical(ctx: string, e: unknown): void {
  if (import.meta.env.DEV) console.error('[iapp]', ctx, e);
}
