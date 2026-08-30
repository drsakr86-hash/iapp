/**
 * Service layer barrel.
 *
 * React components import from here, never from '@supabase/supabase-js'
 * directly. The rule the migration enforces:
 *
 *     Component → service → Supabase / RPC / Edge Function
 *
 * not
 *
 *     Component → dozens of Supabase queries + business rules
 *
 * Business rules stay in PostgreSQL. These modules are typed access, error
 * translation and nothing else.
 */
export * as auth from './auth';
export * as patients from './patients';
export * as appointments from './appointments';
export * as visits from './visits';
export * as examinations from './examinations';
export * as prescriptions from './prescriptions';
export * as imaging from './imaging';
export * as reports from './reports';
export * as notifications from './notifications';
export * as ai from './ai';
export { supabase } from './supabase';
