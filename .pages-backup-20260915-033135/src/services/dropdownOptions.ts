import { supabase, rows, one } from './supabase';
import { reportError } from '../utils/errors';

export interface DropdownOptionRow {
  id: string;
  field_key: string;
  value: string;
  label_ar: string;
  label_en: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface DropdownOptionInput {
  fieldKey: string;
  value: string;
  labelAr: string;
  labelEn?: string | null;
  sortOrder?: number;
}

let cache: DropdownOptionRow[] | null = null;

export async function listActive(): Promise<DropdownOptionRow[]> {
  if (cache) return cache;
  const { data, error } = await supabase
    .from('dropdown_options' as never)
    .select('id, field_key, value, label_ar, label_en, sort_order, is_active')
    .eq('is_active', true)
    .order('field_key', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('label_ar', { ascending: true });
  if (error) throw new Error(reportError(error, 'قوائم الاختيارات'));
  cache = rows<DropdownOptionRow>(data);
  return cache;
}

export async function listAll(fieldKey?: string): Promise<DropdownOptionRow[]> {
  let q = supabase
    .from('dropdown_options' as never)
    .select('id, field_key, value, label_ar, label_en, sort_order, is_active')
    .order('field_key', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('label_ar', { ascending: true });
  if (fieldKey) q = q.eq('field_key', fieldKey);
  const { data, error } = await q;
  if (error) throw new Error(reportError(error, 'قائمة الاختيارات'));
  return rows<DropdownOptionRow>(data);
}

export async function create(input: DropdownOptionInput): Promise<DropdownOptionRow> {
  if (!input.fieldKey.trim() || !input.value.trim() || !input.labelAr.trim())
    throw new Error('بيانات عنصر القائمة غير مكتملة');
  const { data, error } = await supabase
    .from('dropdown_options' as never)
    .insert({
      field_key: input.fieldKey.trim(),
      value: input.value.trim(),
      label_ar: input.labelAr.trim(),
      label_en: input.labelEn?.trim() || null,
      sort_order: input.sortOrder ?? 100,
      is_active: true,
    } as never)
    .select('id, field_key, value, label_ar, label_en, sort_order, is_active')
    .single();
  if (error) throw new Error(reportError(error, 'إضافة عنصر القائمة'));
  cache = null;
  return one<DropdownOptionRow>(data);
}

/** Safe "delete": deactivate, never hard-delete historical vocabulary. */
export async function setActive(id: string, active: boolean): Promise<DropdownOptionRow> {
  const { data, error } = await supabase
    .from('dropdown_options' as never)
    .update({ is_active: active } as never)
    .eq('id', id)
    .select('id, field_key, value, label_ar, label_en, sort_order, is_active')
    .single();
  if (error) throw new Error(reportError(error, active ? 'تفعيل عنصر القائمة' : 'حذف عنصر القائمة'));
  cache = null;
  return one<DropdownOptionRow>(data);
}

export function clearCache() {
  cache = null;
}
