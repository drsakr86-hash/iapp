/* Entry for tests/accounting.mjs.
 *
 * Exposes the pure, dependency-free accounting logic (balance calculation,
 * overdraft check, amount/receipt validation, refund cap) so it can be
 * asserted against directly. No Supabase, no React, no DOM dependency in
 * the module under test — this harness exists only to reuse the existing
 * bundle-then-assert pattern (tests/medical.mjs) rather than introducing a
 * second test runner.
 */
import * as pure from '../src/services/accounting/pure';

(globalThis as unknown as Record<string, unknown>).__iappAccounting = { pure };
