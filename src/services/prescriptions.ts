/* prescriptions service — boundary.
 * Ported target: v2/js/svc-rx.js → prescriptions, followups, refs
 *
 * STEP 2 SCOPE: boundary only. Migrated in Step 9.
 *
 * NOTE: svc-rx.js also exports an `appointments` object that only forwards
 * to IAPP.appointments. That façade is deliberately NOT reproduced — React
 * screens call services/appointments.ts directly.
 */
export {};
