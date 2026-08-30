/**
 * Local-calendar date helpers.
 *
 * ⚠️ Ported verbatim from iapp-core.js todayLocal(). Do NOT replace with
 * toISOString().slice(0,10): that returns the UTC date, which in Egypt
 * (UTC+2/+3) is YESTERDAY before 02:00. This bug was already found and fixed
 * once in the legacy application; reintroducing it silently misfiles visits,
 * appointments and examinations recorded late at night.
 */
export function todayLocal(d: Date = new Date()): string {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

/** Local-calendar date N days from today. */
export function addDaysLocal(days: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return todayLocal(d);
}

/** "HH:MM" in local time. */
export function timeLocal(d: Date = new Date()): string {
  return (
    String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
  );
}
