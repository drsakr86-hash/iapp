/* examinations service — boundary.
 * Ported target: v2/js/svc-clinical.js → examinations, findings, diagnoses, surgeries
 *
 * STEP 2 SCOPE: boundary only. Migrated in Step 8 (EMR).
 *   examinations: listByPatient · createFull · update · getFull · history
 *                 comparePair · iopHistory
 *   findings:     byExam · byExams · toMap · replace · timeline
 *   diagnoses:    listByPatient · create · setStatus · remove
 *   surgeries:    listByPatient · create · update · remove
 *
 * Clinical invariants to preserve on migration:
 *   - CYL accepts ± values
 *   - lens power always displays with its sign
 *   - visual acuity is TEXT, never numeric
 *   - clinical reads go through v_patient_clinical / v_exam_full
 */
export {};
