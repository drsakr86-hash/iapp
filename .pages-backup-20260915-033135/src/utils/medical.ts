/* -------------------------------------------------------------------------
 * medical.ts — formatting for clinical values inside an RTL page.
 * -------------------------------------------------------------------------
 * THE PROBLEM THIS SOLVES
 *
 * The application is dir="rtl". The Unicode bidirectional algorithm treats
 * '+' and '-' as neutral characters, so inside an RTL paragraph a value like
 *
 *     -2.75
 *
 * is reordered for display as
 *
 *     2.75-
 *
 * The stored value never changed — only its presentation did. That is worse
 * than a cosmetic bug in a prescription: a myopic correction reads as if the
 * sign were an afterthought, and a lens can be ground wrong from it.
 *
 * The fix is NOT to make the page LTR. It is to isolate each clinical value
 * in its own LTR embedding, so the neutral characters resolve against LTR
 * while the Arabic label beside them stays RTL. `unicode-bidi: isolate`
 * (applied by the .med-value class) also stops the value from influencing
 * the direction of the text around it.
 *
 * Every function here returns a plain string. Direction is applied by the
 * component that renders it — see components/medical/Medical.tsx.
 * ---------------------------------------------------------------------- */

/** Parse loosely; return null rather than NaN so callers can branch. */
export function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function int(v: unknown): number | null {
  const n = num(v);
  return n === null ? null : Math.round(n);
}

/**
 * Dioptric power, always signed, always two decimals.
 *
 *   +1.25   -2.75   0.00
 *
 * A power without its sign is ambiguous, so plano is rendered '0.00' and a
 * positive power always keeps its '+'. This mirrors the legacy rule
 * "lens power always displays with its sign" recorded in svc-clinical.js.
 */
export function power(v: unknown): string {
  const n = num(v);
  if (n === null) return '—';
  const body = Math.abs(n).toFixed(2);
  if (n > 0) return '+' + body;
  if (n < 0) return '-' + body;
  return '0.00';
}

/**
 * Cylinder follows the same signed rule; it is separated only so the intent
 * is legible at the call site.
 */
export const cylinder = power;
export const sphere = power;

/**
 * Axis is an unsigned integer in [0, 180], conventionally written with the
 * degree sign and no decimals. It is NOT signed — printing '+90' would be
 * wrong notation.
 */
export function axis(v: unknown): string {
  const n = int(v);
  if (n === null) return '—';
  return String(n) + '°';
}

/** Addition for near vision: positive by definition, still shown signed. */
export function addPower(v: unknown): string {
  const n = num(v);
  if (n === null) return '—';
  return '+' + Math.abs(n).toFixed(2);
}

/** Interpupillary distance in millimetres, one decimal. */
export function pd(v: unknown): string {
  const n = num(v);
  if (n === null) return '—';
  return n.toFixed(1);
}

/** Prism dioptres, signed. */
export const prism = power;

/**
 * Validation bounds, taken from the ranges the legacy validator enforces.
 * Kept here so the form and the service agree on one definition.
 */
export const LIMITS = {
  sphere: { min: -30, max: 30 },
  cylinder: { min: -12, max: 12 },
  axis: { min: 0, max: 180 },
  add: { min: 0, max: 6 },
  pd: { min: 40, max: 80 },
} as const;

export interface FieldProblem {
  field: string;
  message: string;
}

/** Returns [] when the eye is acceptable. Arabic messages, ready to show. */
export function validateRefraction(r: {
  sphere?: unknown;
  cylinder?: unknown;
  axis?: unknown;
  add_power?: unknown;
  ipd_mm?: unknown;
}): FieldProblem[] {
  const out: FieldProblem[] = [];
  const sph = num(r.sphere);
  const cyl = num(r.cylinder);
  const ax = int(r.axis);
  const add = num(r.add_power);
  const ipd = num(r.ipd_mm);

  if (sph !== null && (sph < LIMITS.sphere.min || sph > LIMITS.sphere.max))
    out.push({ field: 'sphere', message: 'قوة الكرة خارج المدى المسموح (‎±30‎)' });

  if (cyl !== null && (cyl < LIMITS.cylinder.min || cyl > LIMITS.cylinder.max))
    out.push({ field: 'cylinder', message: 'قوة الأسطوانة خارج المدى المسموح (‎±12‎)' });

  if (ax !== null && (ax < LIMITS.axis.min || ax > LIMITS.axis.max))
    out.push({ field: 'axis', message: 'المحور يجب أن يكون بين 0 و180' });

  /* A cylinder without an axis is an incomplete prescription — the axis is
     what makes the cylinder mean anything. Caught here rather than at the
     database, which has no way to phrase it in Arabic. */
  if (cyl !== null && cyl !== 0 && ax === null)
    out.push({ field: 'axis', message: 'أدخل المحور مع الأسطوانة' });

  if (add !== null && (add < LIMITS.add.min || add > LIMITS.add.max))
    out.push({ field: 'add_power', message: 'الإضافة خارج المدى المسموح (0 إلى 6)' });

  if (ipd !== null && (ipd < LIMITS.pd.min || ipd > LIMITS.pd.max))
    out.push({ field: 'ipd_mm', message: 'المسافة بين الحدقتين خارج المدى (40 إلى 80 مم)' });

  return out;
}

/** True when the eye carries no measurement at all. */
export function isEmptyEye(r: { sphere?: unknown; cylinder?: unknown }): boolean {
  return num(r.sphere) === null && num(r.cylinder) === null;
}

/** ISO date for today, in local time — not UTC, which rolls over early. */
export function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
