/* -------------------------------------------------------------------------
 * Payment methods — configurable list, replacing the old hard-coded enum
 * for the new ledger. See supabase/migrations/20260905000000_accounting_
 * ledger.sql §1. PROVISIONAL: this table does not exist until that
 * migration is applied.
 * ---------------------------------------------------------------------- */

import { table } from './_rpc';
import { reportError } from '../../utils/errors';
import type { PaymentMethodRow } from '../../types/accounting.types';

const COLS = 'id, code, name_ar, name_en, is_active, sort_order';

export async function list(): Promise<PaymentMethodRow[]> {
  const { data, error } = await table('payment_methods')
    .select(COLS)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(reportError(error, 'طرق الدفع'));
  return (data as PaymentMethodRow[] | null) ?? [];
}

export async function listAll(): Promise<PaymentMethodRow[]> {
  const { data, error } = await table('payment_methods')
    .select(COLS)
    .order('is_active', { ascending: false })
    .order('sort_order', { ascending: true });
  if (error) throw new Error(reportError(error, 'طرق الدفع'));
  return (data as PaymentMethodRow[] | null) ?? [];
}

export interface PaymentMethodInput {
  code: string;
  nameAr: string;
  nameEn?: string | null;
  sortOrder?: number;
}

export async function create(input: PaymentMethodInput): Promise<PaymentMethodRow> {
  if (!input.code.trim()) throw new Error('الكود مطلوب');
  if (!input.nameAr.trim()) throw new Error('الاسم بالعربية مطلوب');
  const { data, error } = await table('payment_methods')
    .insert({
      code: input.code.trim(),
      name_ar: input.nameAr.trim(),
      name_en: input.nameEn?.trim() || null,
      sort_order: input.sortOrder ?? 0,
      is_active: true,
    })
    .select(COLS)
    .single();
  if (error) throw new Error(reportError(error, 'إضافة طريقة الدفع'));
  return data as PaymentMethodRow;
}

export async function setActive(id: string, isActive: boolean): Promise<PaymentMethodRow> {
  const { data, error } = await table('payment_methods')
    .update({ is_active: isActive })
    .eq('id', id)
    .select(COLS)
    .single();
  if (error) throw new Error(reportError(error, isActive ? 'تفعيل' : 'إيقاف'));
  return data as PaymentMethodRow;
}
