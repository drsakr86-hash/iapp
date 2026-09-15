/* -------------------------------------------------------------------------
 * labels.ts — presentation-only Arabic labels for raw ledger values.
 * -------------------------------------------------------------------------
 * Purely a display translation. The stored enum values in
 * iapp.financial_transactions.transaction_type are never touched — this
 * only maps them to Arabic for the UI. Reused by every accounting screen
 * that lists ledger rows, so the mapping lives in exactly one place.
 * ---------------------------------------------------------------------- */

import type { FinancialTransactionType } from '../../types/accounting.types';

export const TRANSACTION_TYPE_AR: Record<FinancialTransactionType, string> = {
  opening_balance: 'رصيد افتتاحي',
  revenue: 'تحصيل',
  expense: 'مصروف',
  refund: 'مرتجع',
  transfer_out: 'تحويل صادر',
  transfer_in: 'تحويل وارد',
  adjustment_increase: 'تسوية زيادة',
  adjustment_decrease: 'تسوية نقص',
};

export function transactionTypeAr(type: string): string {
  return (TRANSACTION_TYPE_AR as Record<string, string>)[type] ?? type;
}
