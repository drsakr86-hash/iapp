-- 20260910000000_attach_new_user_trigger.sql
--
-- public.handle_new_user() already exists in production (it inserts a
-- public.profiles row with role='patient' whenever a new auth.users row
-- is created) — but no trigger on auth.users actually calls it. Checked
-- with:
--
--   select tgname from pg_trigger
--   where tgrelid = 'auth.users'::regclass and tgname = 'on_auth_user_created';
--
-- If that returns no row, self-signup is broken: a new patient account
-- authenticates fine but has no profiles row, so loadProfile() in
-- src/services/auth.ts returns failure='no_profile' and LoginPage sends
-- them straight to /unauthorized. This migration only attaches the
-- trigger — it does not change handle_new_user() itself, and does not
-- touch any existing row.
--
-- REVIEW BEFORE APPLYING: run the pg_trigger check above against the
-- live database first. If the trigger already exists (e.g. this schema
-- dump simply didn't capture triggers on the Supabase-managed auth
-- schema), this migration is a harmless no-op thanks to "or replace" on
-- the trigger, but confirm rather than assume.

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
