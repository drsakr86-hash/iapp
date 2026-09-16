/* -------------------------------------------------------------------------
 * Service catalog — reuses iapp.services, discovered during the financial-
 * module audit already carrying exactly the columns this needs: name_ar,
 * name_en, category, default_price, currency, code, icon, is_active. This
 * table existed before this task and had zero frontend integration; no
 * new table was created.
 *
 * Soft delete only, same pattern as clinics.ts: a service tied to
 * historical payments must never disappear from those records, so
 * setActive() only ever flips is_active — there is no remove().
 * ---------------------------------------------------------------------- */

import { supabase, rows, maybe, one } from './supabase';
import { reportError } from '../utils/errors';
import type { TablesInsert, TablesUpdate } from '../types/database.types';

export interface ServiceRow {
  id: string;
  code: string | null;
  name_ar: string;
  name_en: string | null;
  category: string | null;
  default_price: number;
  currency: string;
  icon: string | null;
  is_active: boolean;
}

const COLS = 'id, code, name_ar, name_en, category, default_price, currency, icon, is_active';

export async function list(): Promise<ServiceRow[]> {
  const { data, error } = await supabase
    .from('services')
    .select(COLS)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('category', { ascending: true })
    .order('name_ar', { ascending: true });
  if (error) throw new Error(reportError(error, 'قائمة الخدمات'));
  return rows<ServiceRow>(data);
}

/** Every service, active or not — for the catalog management screen only. */
export async function listAll(): Promise<ServiceRow[]> {
  const { data, error } = await supabase
    .from('services')
    .select(COLS)
    .is('deleted_at', null)
    .order('is_active', { ascending: false })
    .order('category', { ascending: true })
    .order('name_ar', { ascending: true });
  if (error) throw new Error(reportError(error, 'قائمة الخدمات'));
  return rows<ServiceRow>(data);
}

export async function get(id: string): Promise<ServiceRow | null> {
  const { data, error } = await supabase
    .from('services')
    .select(COLS)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw new Error(reportError(error, 'بيانات الخدمة'));
  return maybe<ServiceRow>(data);
}

export interface ServiceInput {
  nameAr: string;
  nameEn?: string | null;
  category?: string | null;
  defaultPrice?: number | null;
  code?: string | null;
}

export async function create(input: ServiceInput): Promise<ServiceRow> {
  const nameAr = input.nameAr.trim();
  if (!nameAr) throw new Error('اسم الخدمة بالعربية مطلوب');

  const payload: TablesInsert<{ schema: 'iapp' }, 'services'> = {
    name_ar: nameAr,
    name_en: str(input.nameEn),
    category: str(input.category),
    default_price: input.defaultPrice ?? 0,
    code: str(input.code),
    is_active: true,
  };
  const { data, error } = await supabase.from('services').insert(payload).select(COLS).single();
  if (error) throw new Error(reportError(error, 'إضافة الخدمة'));
  return one<ServiceRow>(data);
}

export async function update(id: string, input: ServiceInput): Promise<ServiceRow> {
  const nameAr = input.nameAr.trim();
  if (!nameAr) throw new Error('اسم الخدمة بالعربية مطلوب');

  const payload: TablesUpdate<{ schema: 'iapp' }, 'services'> = {
    name_ar: nameAr,
    name_en: str(input.nameEn),
    category: str(input.category),
    default_price: input.defaultPrice ?? 0,
    code: str(input.code),
  };
  const { data, error } = await supabase
    .from('services')
    .update(payload)
    .eq('id', id)
    .select(COLS)
    .single();
  if (error) throw new Error(reportError(error, 'تعديل الخدمة'));
  return one<ServiceRow>(data);
}

export async function setActive(id: string, isActive: boolean): Promise<ServiceRow> {
  const { data, error } = await supabase
    .from('services')
    .update({ is_active: isActive })
    .eq('id', id)
    .select(COLS)
    .single();
  if (error) throw new Error(reportError(error, isActive ? 'تفعيل الخدمة' : 'إيقاف الخدمة'));
  return one<ServiceRow>(data);
}

function str(v: unknown): string | null {
  const s = typeof v === 'string' ? v.trim() : '';
  return s || null;
}
