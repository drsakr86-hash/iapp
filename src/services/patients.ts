/* patients service — boundary. Ported target: v2/js/svc-patients.js
 *
 * STEP 2 SCOPE: boundary + the one read the shell needs. The full surface
 * (list, get, nextCode, create, update, archive, unarchive, count) is
 * migrated in Step 6 together with the Doctor patients screen.
 *
 * Patient visibility is enforced by RLS and by iapp.v_patient_clinical —
 * clinical reads must go through the view, never straight at the tables.
 */
import { supabase } from './supabase';
import { reportError } from '../utils/errors';

export async function count(): Promise<number> {
  const { count: n, error } = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);
  if (error) throw new Error(reportError(error, 'عدد المرضى'));
  return n ?? 0;
}

/* Migrated in Step 6:
 *   list(opts) · get(id) · nextCode() · create(p) · update(id,p)
 *   archive(id) · unarchive(id)
 */
