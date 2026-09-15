/* reports service — boundary. Ported target: v2/js/svc-imaging.js (image_reports)
 * plus the final_report surface in v2/js/svc-ai.js
 *
 * STEP 2 SCOPE: boundary only. Existing report UI is migrated in Step 12.
 * No new report functionality — that is Phase 12.
 *
 * A final_report is HUMAN-authored. The database enforces this:
 *   CHECK (source <> 'ai'), a required human authored_by, and a trigger that
 *   blocks any report without an accepted doctor_review. React must not try
 *   to work around any of it.
 */
export {};
