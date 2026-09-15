/* notifications service — boundary.
 *
 * ⚠️ SCOPE QUESTION, unresolved. The iapp.notifications table exists in the
 * live database, but NO legacy application reads or writes it — verified
 * across all frontend files in the Step 1 audit. What the current apps call
 * "notifications" is in-app surfacing of appointment status changes over
 * Realtime.
 *
 * Phase 11.5 reconnects EXISTING functionality only. Building on the
 * notifications table would be new functionality, i.e. Phase 12.
 * Confirm intent before this file gains an implementation.
 */
export {};
