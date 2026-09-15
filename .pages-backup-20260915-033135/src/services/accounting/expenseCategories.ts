/* -------------------------------------------------------------------------
 * Expense categories — configurable list. See migration §2. PROVISIONAL.
 * ---------------------------------------------------------------------- */

import { table } from './_rpc';
import { reportError } from '../../utils/errors';
import type { ExpenseCategoryRow } from '../../types/accounting.types';

const COLS = 'id, code, name_ar, name_en, is_active, sort_order';

export async function list(): Promise<ExpenseCategoryRow[]> {
  const { data, error } = await table('expense_categories')
    .select(COLS)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(reportError(error, 'فئات المصروفات'));
  return (data as ExpenseCategoryRow[] | null) ?? [];
}

export async function listAll(): Promise<ExpenseCategoryRow[]> {
  const { data, error } = await table('expense_categories')
    .select(COLS)
    .order('is_active', { ascending: false })
    .order('sort_order', { ascending: true });
  if (error) throw new Error(reportError(error, 'فئات المصروفات'));
  return (data as ExpenseCategoryRow[] | null) ?? [];
}

export interface ExpenseCategoryInput {
  code: string;
  nameAr: string;
  nameEn?: string | null;
  sortOrder?: number;
}

export async function create(input: ExpenseCategoryInput): Promise<ExpenseCategoryRow> {
  if (!input.code.trim()) throw new Error('الكود مطلوب');
  if (!input.nameAr.trim()) throw new Error('الاسم بالعربية مطلوب');
  const { data, error } = await table('expense_categories')
    .insert({
      code: input.code.trim(),
      name_ar: input.nameAr.trim(),
      name_en: input.nameEn?.trim() || null,
      sort_order: input.sortOrder ?? 0,
      is_active: true,
    })
    .select(COLS)
    .single();
  if (error) throw new Error(reportError(error, 'إضافة فئة مصروف'));
  return data as ExpenseCategoryRow;
}

export async function setActive(id: string, isActive: boolean): Promise<ExpenseCategoryRow> {
  const { data, error } = await table('expense_categories')
    .update({ is_active: isActive })
    .eq('id', id)
    .select(COLS)
    .single();
  if (error) throw new Error(reportError(error, isActive ? 'تفعيل' : 'إيقاف'));
  return data as ExpenseCategoryRow;
}
