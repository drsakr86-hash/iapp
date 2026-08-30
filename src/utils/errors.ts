/**
 * Arabic error translation.
 *
 * Ported from iapp-core.js translateAuthError() and the per-service
 * translate() helpers. Raw PostgreSQL and PostgREST messages must never
 * reach a user — particularly a patient. Each service adds its own
 * constraint-name mappings on top of these shared cases.
 */

export const GENERIC_ERROR = 'حدث خطأ غير متوقع — حاول مرة أخرى';

export function translateAuthError(message: unknown): string {
  const m = String(message ?? '');
  if (/Invalid login credentials/i.test(m)) return 'البريد أو كلمة المرور غير صحيحة';
  if (/Email not confirmed/i.test(m)) return 'البريد غير مؤكَّد في Supabase Auth';
  if (/rate limit|too many/i.test(m)) return 'محاولات كثيرة — انتظر قليلاً';
  if (/network|fetch|Failed to fetch/i.test(m)) return 'تعذّر الاتصال بالخادم';
  return 'تعذّر تسجيل الدخول';
}

/** Shared database/transport cases. Services layer their own on top. */
export function translateDbError(error: unknown, context?: string): string {
  const m = String((error as { message?: string })?.message ?? error ?? '');
  const where = context ? ` (${context})` : '';

  if (/row-level security|permission denied|not authorized|Unauthorized/i.test(m))
    return 'لا تملك صلاحية لهذا الإجراء' + where;
  if (/JWT expired|token is expired/i.test(m)) return 'انتهت الجلسة — سجّل الدخول من جديد';
  if (/network|fetch|Failed to fetch/i.test(m)) return 'تعذّر الاتصال بالخادم' + where;
  if (/duplicate key|already exists/i.test(m)) return 'هذا السجل موجود بالفعل' + where;
  if (/violates foreign key/i.test(m)) return 'بيانات مرتبطة غير صحيحة' + where;

  return GENERIC_ERROR + where;
}

/**
 * Log the technical detail, return the Arabic message.
 * Never render the raw message; never swallow it silently either.
 */
export function reportError(error: unknown, context?: string): string {
  if (import.meta.env.DEV) console.error('[iapp]', context ?? '', error);
  return translateDbError(error, context);
}
