/* AI service — boundary. Ported target: v2/js/svc-ai.js
 *
 * STEP 2 SCOPE: boundary + the Edge Function name. Migrated in Step 11.
 *
 * ARCHITECTURE — approved in Phase 11, not to be redesigned:
 *
 *   analyze()  → supabase.functions.invoke('ai-analyze')   ← secret lives in
 *                                                            Supabase, never here
 *     → ai_analysis + ai_findings + ai_impression          ← machine output
 *       → doctor_review  (accept | reject | edit)          ← human decision
 *         → RPC ai_to_final_report                         ← human-authored
 *           → final_report  CHECK (source <> 'ai')
 *
 * The frontend must NEVER contain an API key, provider name or endpoint.
 * AI output is decision support; the doctor approves, edits or rejects it.
 * ai_finding_catalog is the single source of truth for finding options —
 * never hard-code a finding list in React.
 */
export const AI_EDGE_FUNCTION = 'ai-analyze';

/* Migrated in Step 11:
 *   catalog · supported · analyze · regenerate · quotaUsed · latest
 *   latestFor · history · findings · impression · review · bundle
 *   decide (accept/reject/edit) · redo
 */
