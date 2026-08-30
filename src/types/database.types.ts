/* -------------------------------------------------------------------------
 * database.types.ts — PLACEHOLDER. NOT YET GENERATED.
 * -------------------------------------------------------------------------
 *
 * The live database types were approved for use in Step 2 but no generated
 * file was supplied, so nothing here describes the real schema. This file
 * deliberately contains NO table definitions: inventing them from
 * sql/002_schema.sql (a Phase 9 export, missing every Phase 10/11 object)
 * would produce types that compile and then fail at runtime — the exact
 * failure this project already hit in Phases 2-3.
 *
 * TO REPLACE THIS FILE (run against the live project, read-only):
 *
 *   npx supabase login
 *   npx supabase gen types typescript \
 *     --project-id vkkjatrawzpmdhfloens \
 *     --schema iapp,public \
 *     > src/types/database.types.ts
 *
 * `gen types` only reads catalog metadata. It creates no migration, alters
 * no table, and touches no data.
 *
 * Once the real file is in place, no other change is needed: every query in
 * src/services already flows through the single typed client in
 * services/supabase.ts, and the compiler will immediately start checking
 * table names, column names and return shapes across the whole app.
 * Expect real errors on that first compile — that is the point of doing it.
 * ---------------------------------------------------------------------- */

/**
 * Permissive stand-in. Queries compile but are NOT type-checked against the
 * real schema until the generated file replaces this one.
 */
export type Database = {
  iapp: {
    Tables: Record<string, GenericTable>;
    Views: Record<string, GenericTable>;
    Functions: Record<string, GenericFunction>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, Record<string, unknown>>;
  };
  public: {
    Tables: Record<string, GenericTable>;
    Views: Record<string, GenericTable>;
    Functions: Record<string, GenericFunction>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, Record<string, unknown>>;
  };
};

type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

type GenericFunction = {
  Args: Record<string, unknown>;
  Returns: unknown;
};

/** True once the generated file is in place. Surfaced in the dev banner. */
export const DATABASE_TYPES_GENERATED = false;
