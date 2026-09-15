/* -------------------------------------------------------------------------
 * ledger.ts — every financial-ledger WRITE goes through here, and every
 * one of these is a wrapper around a SECURITY DEFINER RPC from the
 * proposed migration — never a bare `.insert()` into
 * financial_transactions. PROVISIONAL until the migration is applied.
 * ---------------------------------------------------------------------- */

import { callRpc, table } from './_rpc';
import { reportError } from '../../utils/errors';
import type {
  CreateAdjustmentParams,
  CreateDailyClosingParams,
  CreateExpenseParams,
  CreateOpeningBalanceParams,
  CreateRefundParams,
  CreateRevenueParams,
  CreateTransferParams,
  CreateTransferResult,
  FinancialTransactionRow,
  RecordPatientPaymentParams,
  RecordPatientPaymentResult,
} from '../../types/accounting.types';

export async function recordPatientPayment(
  p: RecordPatientPaymentParams,
): Promise<RecordPatientPaymentResult> {
  if (!(p.p_amount > 0)) throw new Error('المبلغ يجب أن يكون أكبر من صفر');
  if (!p.p_account_id) throw new Error('اختر الحساب/الخزينة');
  const rows = await callRpc<RecordPatientPaymentResult[]>(
    'record_patient_payment',
    p as unknown as Record<string, unknown>,
    'تحصيل الدفعة',
  );
  return rows[0];
}

export async function createRevenue(p: CreateRevenueParams): Promise<string> {
  if (!(p.p_amount > 0)) throw new Error('المبلغ يجب أن يكون أكبر من صفر');
  return callRpc<string>('create_revenue', p as unknown as Record<string, unknown>, 'تسجيل إيراد');
}

export async function createExpense(p: CreateExpenseParams): Promise<string> {
  if (!(p.p_amount > 0)) throw new Error('المبلغ يجب أن يكون أكبر من صفر');
  return callRpc<string>('create_expense', p as unknown as Record<string, unknown>, 'تسجيل مصروف');
}

export async function createRefund(p: CreateRefundParams): Promise<string> {
  if (!(p.p_amount > 0)) throw new Error('مبلغ الاسترجاع يجب أن يكون أكبر من صفر');
  if (!p.p_reason.trim()) throw new Error('سبب الاسترجاع مطلوب');
  return callRpc<string>('create_refund', p as unknown as Record<string, unknown>, 'تسجيل استرجاع');
}

export async function createTransfer(p: CreateTransferParams): Promise<CreateTransferResult> {
  if (!(p.p_amount > 0)) throw new Error('مبلغ التحويل يجب أن يكون أكبر من صفر');
  if (p.p_from_account === p.p_to_account) throw new Error('لا يمكن التحويل لنفس الحساب');
  return callRpc<CreateTransferResult>(
    'create_transfer',
    p as unknown as Record<string, unknown>,
    'تحويل بين الحسابات',
  );
}

export async function createAdjustment(p: CreateAdjustmentParams): Promise<string> {
  if (!(p.p_amount > 0)) throw new Error('المبلغ يجب أن يكون أكبر من صفر');
  if (!p.p_reason.trim()) throw new Error('سبب التسوية مطلوب');
  return callRpc<string>('create_adjustment', p as unknown as Record<string, unknown>, 'تسوية رصيد');
}

export async function createOpeningBalance(p: CreateOpeningBalanceParams): Promise<string> {
  return callRpc<string>(
    'create_opening_balance',
    p as unknown as Record<string, unknown>,
    'رصيد افتتاحي',
  );
}

export async function createDailyClosing(p: CreateDailyClosingParams): Promise<string> {
  return callRpc<string>('create_daily_closing', p as unknown as Record<string, unknown>, 'إغلاق يومي');
}

/** Read-only ledger browsing — filterable, never mutates. */
export interface LedgerFilter {
  clinicId?: string | null;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  transactionType?: string;
}

export async function listTransactions(filter: LedgerFilter): Promise<FinancialTransactionRow[]> {
  let q = table('financial_transactions').select(
    'id, transaction_type, account_id, clinic_id, amount, currency, transaction_date, ' +
      'description, reason, patient_id, visit_id, service_id, expense_category_id, ' +
      'payment_method_id, receipt_no, related_transaction_id, legacy_payment_id, ' +
      'created_at, created_by',
  );
  if (filter.clinicId) q = q.eq('clinic_id', filter.clinicId);
  if (filter.accountId) q = q.eq('account_id', filter.accountId);
  if (filter.dateFrom) q = q.gte('transaction_date', filter.dateFrom);
  if (filter.dateTo) q = q.lte('transaction_date', filter.dateTo);
  if (filter.transactionType) q = q.eq('transaction_type', filter.transactionType);
  const { data, error } = await q.order('transaction_date', { ascending: false }).limit(500);
  if (error) throw new Error(reportError(error, 'دفتر الحركات المالية'));
  return (data as FinancialTransactionRow[] | null) ?? [];
}
