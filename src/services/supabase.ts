/* -------------------------------------------------------------------------
 * The single Supabase client for the whole application.
 * -------------------------------------------------------------------------
 * Configuration mirrors v2/iapp-core.js exactly. Each option was chosen for
 * a reason in the legacy app; changing any of them here changes behaviour
 * the existing backend depends on:
 *
 *   db.schema: 'iapp'      — application tables live in the iapp schema, not
 *                            public. public.profiles is reached explicitly
 *                            via .schema('public').
 *   persistSession         — session survives reload; required for the
 *                            session-restoration requirement.
 *   autoRefreshToken       — long clinic sessions must not expire mid-visit.
 *   detectSessionInUrl:false — no magic-link/OAuth callback flow is in use;
 *                            leaving it on makes the client parse and strip
 *                            URL fragments the router owns.
 *
 * Nothing else in the app may call createClient. One client means one
 * session, one Realtime socket, and one place to swap in generated types.
 * ---------------------------------------------------------------------- */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';
import { env } from '../utils/env';

export const supabase: SupabaseClient<Database, 'iapp'> = createClient<Database, 'iapp'>(
  env.supabaseUrl,
  env.supabasePublishableKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    db: { schema: 'iapp' },
  },
);

/** public schema accessor — used only for profiles. */
export const publicSchema = () => supabase.schema('public');

/**
 * Realtime channels do not inherit the session token when the client was
 * created before login — RLS then drops every event silently while the
 * channel still reports SUBSCRIBED. The legacy app hit this and fixed it by
 * calling setAuth before subscribing (appointment-service.js). Any code that
 * opens a channel must call this first. Wired up in Step 8.
 */
export async function primeRealtimeAuth(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) supabase.realtime.setAuth(token);
}
