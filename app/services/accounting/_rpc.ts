/* -------------------------------------------------------------------------
 * accounting/_rpc.ts — one isolated cast point for calling the proposed
 * accounting RPCs.
 * -------------------------------------------------------------------------
 * supabase.rpc() is typed against the generated `Database`, which knows
 * nothing about record_patient_payment/create_revenue/etc. — they don't
 * exist yet (migration not applied). This mirrors the existing rows/one/
 * maybe pattern in services/supabase.ts: one narrow, marked cast instead
 * of scattering `as unknown` across every accounting service file.
 *
 * Once the migration is applied and `supabase gen types` has been re-run,
 * these RPC names become real, typed members of `Database['iapp']['Functions']`
 * and this indirection can be deleted — call sites would switch to
 * `supabase.rpc('record_patient_payment', {...})` directly, fully typed.
 * ---------------------------------------------------------------------- */

import { supabase } from '../supabase';
import { reportError } from '../../utils/errors';

type RpcCaller = (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;

export async function callRpc<T>(
  name: string,
  params: Record<string, unknown>,
  context?: string,
): Promise<T> {
  const rpc = supabase.rpc.bind(supabase) as unknown as RpcCaller;
  const { data, error } = await rpc(name, params);
  if (error) throw new Error(reportError(error, context ?? name));
  return data as T;
}

/**
 * Same idea for `.from()` — the accounting tables aren't in the generated
 * `Database` union either. `table('accounts')` gives back a loosely-typed
 * query builder; callers still get real shapes via the provisional
 * interfaces in types/accounting.types.ts on the read side, just not
 * compiler-checked against a live schema until the migration is applied.
 */
// oxlint-disable-next-line no-explicit-any
export function table(name: string): any {
  return (supabase.from as unknown as (n: string) => unknown)(name);
}
