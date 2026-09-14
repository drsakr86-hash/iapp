/* -------------------------------------------------------------------------
 * Clinics service — locations (Damanhour, Rahmania, Damanhour Eye Center).
 * -------------------------------------------------------------------------
 * No new table. iapp.clinics already has the columns a location needs:
 * name_ar/name_en, address, phone, whatsapp, is_active, deleted_at (soft
 * delete). There is no separate "mobile" column — only phone + whatsapp —
 * so a location with two distinct numbers (landline + mobile) cannot be
 * modelled with two structured fields today. See the Clinic Locations
 * admin screen and the delivery report for that gap; nothing here works
 * around it by writing into an unrelated column.
 *
 * DELETE SAFETY — a clinic tied to historical visits/reports must never be
 * hard-deleted, or every past report printed from that clinic silently
 * loses its address/contact block. `setActive()` below only ever flips
 * is_active; there is deliberately no `remove()` that touches deleted_at.
 * `list()` (active-only, for booking/scheduling pickers) stays exactly as
 * it was. `get()` bypasses the is_active filter so a report for a visit at
 * a since-deactivated clinic still resolves its real location.
 * ---------------------------------------------------------------------- */

import { supabase, rows, maybe, one } from './supabase';
import { reportError } from '../utils/errors';
import type { TablesInsert, TablesUpdate } from '../types/database.types';

export interface ClinicRow {
  id: string;
  code: string;
  name_ar: string;
  name_en: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  icon: string | null;
  timezone: string;
  slot_minutes: number;
  is_active: boolean;
}

const COLS =
  'id, code, name_ar, name_en, address, phone, whatsapp, icon, timezone, slot_minutes, is_active';

export async function list(): Promise<ClinicRow[]> {
  const { data, error } = await supabase
    .from('clinics')
    .select(COLS)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name_ar', { ascending: true });

  if (error) {
    throw new Error(reportError(error, 'قائمة العيادات'));
  }

  return rows<ClinicRow>(data);
}

/** Every location, active or not — for the management screen only. */
export async function listAll(): Promise<ClinicRow[]> {
  const { data, error } = await supabase
    .from('clinics')
    .select(COLS)
    .is('deleted_at', null)
    .order('is_active', { ascending: false })
    .order('name_ar', { ascending: true });

  if (error) {
    throw new Error(reportError(error, 'قائمة العيادات'));
  }

  return rows<ClinicRow>(data);
}

/**
 * One clinic by id, active or not. Historical reports must resolve the
 * clinic a visit actually happened at even after that clinic is later
 * deactivated — `list()`'s `is_active` filter would silently hide it and
 * make the report lose its location.
 */
export async function get(id: string): Promise<ClinicRow | null> {
  const { data, error } = await supabase
    .from('clinics')
    .select(COLS)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    throw new Error(reportError(error, 'بيانات العيادة'));
  }
  return maybe<ClinicRow>(data);
}

export interface ClinicInput {
  nameAr: string;
  nameEn?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
}

async function uniqueCode(): Promise<string> {
  // Slug-independent, collision-proof without needing to know the DB's
  // exact code format — clinics are created rarely, so a short, readable
  // timestamp-based code is preferable to guessing a transliteration rule.
  return `clinic-${Date.now().toString(36)}`;
}

export async function create(input: ClinicInput): Promise<ClinicRow> {
  const nameAr = input.nameAr.trim();
  if (!nameAr) throw new Error('اسم العيادة بالعربية مطلوب');

  const payload: TablesInsert<{ schema: 'iapp' }, 'clinics'> = {
    code: await uniqueCode(),
    name_ar: nameAr,
    name_en: str(input.nameEn),
    address: str(input.address),
    phone: str(input.phone),
    whatsapp: str(input.whatsapp),
    is_active: true,
  };

  let { data, error } = await supabase.from('clinics').insert(payload).select(COLS).single();
  if (error && /code/.test(error.message) && /duplicate|unique/i.test(error.message)) {
    payload.code = await uniqueCode();
    ({ data, error } = await supabase.from('clinics').insert(payload).select(COLS).single());
  }
  if (error) throw new Error(reportError(error, 'إضافة العيادة'));
  return one<ClinicRow>(data);
}

export async function update(id: string, input: ClinicInput): Promise<ClinicRow> {
  const nameAr = input.nameAr.trim();
  if (!nameAr) throw new Error('اسم العيادة بالعربية مطلوب');

  const payload: TablesUpdate<{ schema: 'iapp' }, 'clinics'> = {
    name_ar: nameAr,
    name_en: str(input.nameEn),
    address: str(input.address),
    phone: str(input.phone),
    whatsapp: str(input.whatsapp),
  };

  const { data, error } = await supabase
    .from('clinics')
    .update(payload)
    .eq('id', id)
    .select(COLS)
    .single();
  if (error) throw new Error(reportError(error, 'تعديل العيادة'));
  return one<ClinicRow>(data);
}

/**
 * The only supported way to retire a location. Never removes the row, so
 * every historical visit/report that points at it keeps working.
 */
export async function setActive(id: string, isActive: boolean): Promise<ClinicRow> {
  const { data, error } = await supabase
    .from('clinics')
    .update({ is_active: isActive })
    .eq('id', id)
    .select(COLS)
    .single();
  if (error) throw new Error(reportError(error, isActive ? 'تفعيل العيادة' : 'إيقاف العيادة'));
  return one<ClinicRow>(data);
}

function str(v: unknown): string | null {
  const s = typeof v === 'string' ? v.trim() : '';
  return s || null;
}