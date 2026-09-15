/* -------------------------------------------------------------------------
 * Accounts / cashboxes. See migration §3. PROVISIONAL.
 * ---------------------------------------------------------------------- */

import { table } from './_rpc';
import { reportError } from '../../utils/errors';
import type { AccountRow, AccountKind } from '../../types/accounting.types';
export type { AccountRow, AccountKind };

const COLS =
  'id, clinic_id, code, name_ar, name_en, kind, currency, allow_overdraft, is_active, notes';

export async function list(): Promise<AccountRow[]> {
  const { data, error } = await table('accounts')
    .select(COLS)
    .eq('is_active', true)
    .order('name_ar', { ascending: true });
  if (error) throw new Error(reportError(error, 'الحسابات'));
  return (data as AccountRow[] | null) ?? [];
}

export async function listAll(): Promise<AccountRow[]> {
  const { data, error } = await table('accounts')
    .select(COLS)
    .order('is_active', { ascending: false })
    .order('name_ar', { ascending: true });
  if (error) throw new Error(reportError(error, 'الحسابات'));
  return (data as AccountRow[] | null) ?? [];
}

export interface AccountInput {
  clinicId?: string | null;
  code: string;
  nameAr: string;
  nameEn?: string | null;
  kind: AccountKind;
  allowOverdraft?: boolean;
  notes?: string | null;
}

export async function create(input: AccountInput): Promise<AccountRow> {
  if (!input.code.trim()) throw new Error('كود الحساب مطلوب');
  if (!input.nameAr.trim()) throw new Error('اسم الحساب مطلوب');
  const { data, error } = await table('accounts')
    .insert({
      clinic_id: input.clinicId ?? null,
      code: input.code.trim(),
      name_ar: input.nameAr.trim(),
      name_en: input.nameEn?.trim() || null,
      kind: input.kind,
      allow_overdraft: input.allowOverdraft ?? false,
      notes: input.notes?.trim() || null,
      is_active: true,
    })
    .select(COLS)
    .single();
  if (error) throw new Error(reportError(error, 'إضافة الحساب'));
  return data as AccountRow;
}

export async function update(id: string, input: AccountInput): Promise<AccountRow> {
  if (!input.nameAr.trim()) throw new Error('اسم الحساب مطلوب');
  const { data, error } = await table('accounts')
    .update({
      clinic_id: input.clinicId ?? null,
      name_ar: input.nameAr.trim(),
      name_en: input.nameEn?.trim() || null,
      kind: input.kind,
      allow_overdraft: input.allowOverdraft ?? false,
      notes: input.notes?.trim() || null,
    })
    .eq('id', id)
    .select(COLS)
    .single();
  if (error) throw new Error(reportError(error, 'تعديل الحساب'));
  return data as AccountRow;
}

export async function setActive(id: string, isActive: boolean): Promise<AccountRow> {
  const { data, error } = await table('accounts')
    .update({ is_active: isActive })
    .eq('id', id)
    .select(COLS)
    .single();
  if (error) throw new Error(reportError(error, isActive ? 'تفعيل الحساب' : 'إيقاف الحساب'));
  return data as AccountRow;
}
