/* -------------------------------------------------------------------------
 * pure.ts — dependency-free accounting logic.
 * -------------------------------------------------------------------------
 * No Supabase import, no React import. This exists so the core rules —
 * balance sign convention, receipt format, amount/reason validation — can
 * be unit-tested without a database connection or a DOM, and so the
 * TypeScript-side logic is a single source of truth that must match the
 * SQL views/triggers in the migration exactly. If this file and
 * supabase/migrations/20260905000000_accounting_ledger.sql ever disagree
 * on the sign convention, one of them is wrong.
 * ---------------------------------------------------------------------- */

import type { FinancialTransactionType } from '../../types/accounting.types';

export interface BalanceLine {
  transaction_type: FinancialTransactionType;
  amount: number;
}

/** Mirrors v_account_balances' CASE expression exactly. */
export function calculateBalance(transactions: BalanceLine[]): number {
  let total = 0;
  for (const t of transactions) {
    switch (t.transaction_type) {
      case 'opening_balance':
        total += t.amount; // carries its own sign — the one exception
        break;
      case 'revenue':
      case 'transfer_in':
      case 'adjustment_increase':
        total += t.amount;
        break;
      case 'expense':
      case 'refund':
      case 'transfer_out':
      case 'adjustment_decrease':
        total -= t.amount;
        break;
    }
  }
  return Math.round(total * 100) / 100;
}

export function isDecreasingType(type: FinancialTransactionType): boolean {
  return type === 'expense' || type === 'refund' || type === 'transfer_out' || type === 'adjustment_decrease';
}

/** Mirrors enforce_transaction_account_rules()'s overdraft check. */
export function wouldOverdraw(
  currentBalance: number,
  amount: number,
  allowOverdraft: boolean,
): boolean {
  if (allowOverdraft) return false;
  return currentBalance < amount;
}

/** Mirrors chk_amount_sign: positive for everything except opening_balance. */
export function isValidAmount(type: FinancialTransactionType, amount: number): boolean {
  if (type === 'opening_balance') return Number.isFinite(amount);
  return Number.isFinite(amount) && amount > 0;
}

/** Mirrors next_receipt_no()'s format: {PREFIX}-{year}-{6-digit number}. */
export function formatReceiptNo(prefix: string, year: number, n: number): string {
  return `${prefix}-${year}-${String(n).padStart(6, '0')}`;
}

const RECEIPT_NO_PATTERN = /^[A-Za-z]+-\d{4}-\d{6}$/;
export function isValidReceiptNoFormat(receiptNo: string): boolean {
  return RECEIPT_NO_PATTERN.test(receiptNo);
}

/** Mirrors create_refund()'s cap check. */
export function refundExceedsOriginal(
  originalAmount: number,
  alreadyRefunded: number,
  newRefundAmount: number,
): boolean {
  return alreadyRefunded + newRefundAmount > originalAmount;
}

/** Mirrors chk_related_txn_required: refund and transfer_in must carry a
 *  reference; transfer_out, per the no-UPDATE design, does not. */
export function requiresRelatedTransaction(type: FinancialTransactionType): boolean {
  return type === 'refund' || type === 'transfer_in';
}
