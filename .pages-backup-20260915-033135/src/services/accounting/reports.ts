/* -------------------------------------------------------------------------
 * reports.ts — read-only dashboard/report queries against the views the
 * migration defines. No balance is ever read from a stored column;
 * everything here comes from v_account_balances / v_*_summary. PROVISIONAL.
 * ---------------------------------------------------------------------- */

import { table } from './_rpc';
import { reportError } from '../../utils/errors';
import type {
  AccountBalanceRow,
  ClinicFinancialSummaryRow,
  DailyFinancialSummaryRow,
  PaymentMethodSummaryRow,
  ServiceRevenueSummaryRow,
} from '../../types/accounting.types';

export async function accountBalances(): Promise<AccountBalanceRow[]> {
  const { data, error } = await table('v_account_balances').select('*');
  if (error) throw new Error(reportError(error, 'أرصدة الحسابات'));
  return (data as AccountBalanceRow[] | null) ?? [];
}

export async function dailySummary(
  dateFrom: string,
  dateTo: string,
  clinicId?: string | null,
): Promise<DailyFinancialSummaryRow[]> {
  let q = table('v_daily_financial_summary')
    .select('*')
    .gte('day', dateFrom)
    .lte('day', dateTo);
  if (clinicId) q = q.eq('clinic_id', clinicId);
  const { data, error } = await q.order('day', { ascending: false });
  if (error) throw new Error(reportError(error, 'الملخص اليومي'));
  return (data as DailyFinancialSummaryRow[] | null) ?? [];
}

export async function clinicSummary(): Promise<ClinicFinancialSummaryRow[]> {
  const { data, error } = await table('v_clinic_financial_summary').select('*');
  if (error) throw new Error(reportError(error, 'ملخص العيادات'));
  return (data as ClinicFinancialSummaryRow[] | null) ?? [];
}

export async function paymentMethodSummary(): Promise<PaymentMethodSummaryRow[]> {
  const { data, error } = await table('v_payment_method_summary').select('*');
  if (error) throw new Error(reportError(error, 'ملخص طرق الدفع'));
  return (data as PaymentMethodSummaryRow[] | null) ?? [];
}

export async function serviceRevenueSummary(): Promise<ServiceRevenueSummaryRow[]> {
  const { data, error } = await table('v_service_revenue_summary').select('*');
  if (error) throw new Error(reportError(error, 'ملخص إيرادات الخدمات'));
  return (data as ServiceRevenueSummaryRow[] | null) ?? [];
}

/** Convenience: today's revenue/expenses/refunds/net, across all clinics
 *  or scoped to one — built from dailySummary(), never a separate query
 *  path that could drift from it. */
export async function todaySummary(clinicId?: string | null) {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await dailySummary(today, today, clinicId);
  return rows.reduce(
    (acc, r) => ({
      revenue: acc.revenue + (r.revenue ?? 0),
      expenses: acc.expenses + (r.expenses ?? 0),
      refunds: acc.refunds + (r.refunds ?? 0),
      net: acc.net + (r.net ?? 0),
    }),
    { revenue: 0, expenses: 0, refunds: 0, net: 0 },
  );
}
