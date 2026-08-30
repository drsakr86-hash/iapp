/* visits service — boundary. Ported target: v2/js/svc-clinical.js → visits
 *
 * STEP 2 SCOPE: boundary only. Migrated in Step 7.
 *   listByPatient · listByDate · create · update · countToday
 *
 * A visit is linked to its appointment through complete_appointment
 * (p_visit_id). Do not couple them any other way.
 */
export {};
