/* -------------------------------------------------------------------------
 * prescriptions service — glasses and medication.
 * -------------------------------------------------------------------------
 * Ported from v2/js/svc-rx.js. Two tables per prescription:
 *
 *   iapp.prescriptions      header: patient, doctor, clinic, date, is_glasses
 *   iapp.refractions        one row PER EYE for a glasses prescription
 *   iapp.prescription_items one row per drug for a medication prescription
 *
 * WHY OD/OS CANNOT BE REVERSED BY A LAYOUT CHANGE
 *
 * Laterality is stored, not positional. Each refraction row carries an
 * explicit `eye` column holding the enum label 'OD' or 'OS'. Nothing about
 * which eye a measurement belongs to depends on array order, column order,
 * or page direction at any point in the flow:
 *
 *   form state   { od: {...}, os: {...} }      — named, not indexed
 *   → service    add('OD', input.od)           — tagged at the source
 *   → database   refractions.eye = 'OD'        — enum, per row
 *   → read       rows.find(r => r.eye === 'OD')— matched by label
 *   → display    <MedBlock> chart, OD row first
 *
 * A row is therefore never "the first one" — it is the OD one. If a chart
 * ever displays the eyes the wrong way round, the defect is in the
 * component's label lookup, and it must be fixed there. Swapping the values
 * on save to compensate would corrupt every future read and every printed
 * prescription. Do not do it.
 * ---------------------------------------------------------------------- */

import { supabase, one, rows } from './supabase';
import { reportError } from '../utils/errors';
import type { Eye, RefractionType } from '../types/domain';
import { num, int, today, validateRefraction, isEmptyEye } from '../utils/medical';
import type { TablesInsert } from '../types/database.types';

export interface RefractionRow {
  id: string;
  patient_id: string;
  prescription_id: string | null;
  examination_id: string | null;
  visit_id: string | null;
  measured_on: string;
  refraction_type: RefractionType;
  eye: Eye;
  sphere: number | null;
  cylinder: number | null;
  axis: number | null;
  add_power: number | null;
  prism: number | null;
  base: string | null;
  ipd_mm: number | null;
  va_result: string | null;
}

export interface PrescriptionRow {
  id: string;
  patient_id: string;
  visit_id: string | null;
  examination_id: string | null;
  doctor_id: string | null;
  clinic_id: string | null;
  prescribed_on: string;
  eye: Eye | null;
  is_glasses: boolean;
  notes: string | null;
  created_at: string;
}

export interface PrescriptionItemRow {
  id: string;
  prescription_id: string;
  medication_id: string | null;
  free_text: string | null;
  dose: string | null;
  frequency: string | null;
  duration: string | null;
  eye: Eye | null;
  instructions: string | null;
  sort_order: number;
  is_parsed: boolean;
}

/** One eye's measurements as the form holds them. */
export interface EyeInput {
  sphere?: unknown;
  cylinder?: unknown;
  axis?: unknown;
}

export interface GlassesInput {
  patientId: string;
  /** RIGHT eye. */
  od: EyeInput;
  /** LEFT eye. */
  os: EyeInput;
  addPower?: unknown;
  ipdMm?: unknown;
  prescribedOn?: string;
  visitId?: string | null;
  examinationId?: string | null;
  doctorId?: string | null;
  clinicId?: string | null;
  notes?: string | null;
}

/**
 * Create a glasses prescription: one header plus up to two refraction rows.
 *
 * The header carries eye = 'OU' because the prescription as a document
 * covers both eyes; the per-eye detail lives in refractions.
 */
export async function createGlasses(input: GlassesInput): Promise<PrescriptionRow> {
  if (!input.patientId) throw new Error('اختر المريض');

  const add = num(input.addPower);
  const hasOD = !isEmptyEye(input.od ?? {});
  const hasOS = !isEmptyEye(input.os ?? {});

  if (!hasOD && !hasOS && add === null)
    throw new Error('أدخل قياساً واحداً على الأقل');

  /* Validated per eye so the message can name the eye. Arabic label first,
     because that is what the doctor is looking at on screen. */
  if (hasOD) {
    const p = validateRefraction({ ...input.od, add_power: add, ipd_mm: input.ipdMm });
    if (p.length) throw new Error('العين اليمنى (OD): ' + p[0].message);
  }
  if (hasOS) {
    const p = validateRefraction({ ...input.os, add_power: add, ipd_mm: input.ipdMm });
    if (p.length) throw new Error('العين اليسرى (OS): ' + p[0].message);
  }

  const date = input.prescribedOn || today();

  const { data: head, error: headErr } = await supabase
    .from('prescriptions')
    .insert({
      patient_id: input.patientId,
      visit_id: input.visitId ?? null,
      examination_id: input.examinationId ?? null,
      doctor_id: input.doctorId ?? null,
      clinic_id: input.clinicId ?? null,
      prescribed_on: date,
      eye: 'OU',
      is_glasses: true,
      notes: str(input.notes) || null,
    })
    .select('*')
    .single();

  if (headErr) throw new Error(reportError(headErr, 'حفظ الوصفة'));
  const rx = one<PrescriptionRow>(head);

  /* Each row is tagged with its eye label explicitly. The push order below
     is presentation-irrelevant — the `eye` column is what carries meaning. */
  const refractionRows: Array<TablesInsert<{ schema: 'iapp' }, 'refractions'>> = [];
  const addRow = (eye: Eye, e: EyeInput) => {
    if (isEmptyEye(e) && add === null) return;
    refractionRows.push({
      patient_id: String(input.patientId),
      prescription_id: rx.id,
      visit_id: input.visitId ?? null,
      examination_id: input.examinationId ?? null,
      measured_on: date,
      refraction_type: 'final' as RefractionType,
      eye,
      sphere: num(e.sphere),
      cylinder: num(e.cylinder),
      axis: int(e.axis),
      add_power: add,
      ipd_mm: num(input.ipdMm),
    });
  };
  addRow('OD', input.od ?? {});
  addRow('OS', input.os ?? {});

  if (refractionRows.length) {
    const { error } = await supabase.from('refractions').insert(refractionRows);
    if (error) {
      /* A header with no measurements is an empty prescription. Remove it
         rather than leave a blank document in the patient's record. */
      try {
        await supabase
          .from('prescriptions')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', rx.id);
      } catch {
        /* nothing further to do; the header carries no refractions */
      }
      throw new Error(reportError(error, 'حفظ قياسات النظارة'));
    }
  }
  return rx;
}

export interface MedicationLine {
  name: string;
  dose?: string | null;
  frequency?: string | null;
  duration?: string | null;
  eye?: Eye | null;
  instructions?: string | null;
}

export interface DrugsInput {
  patientId: string;
  items: MedicationLine[];
  prescribedOn?: string;
  visitId?: string | null;
  doctorId?: string | null;
  clinicId?: string | null;
  eye?: Eye | null;
  notes?: string | null;
}

/**
 * Create a medication prescription.
 *
 * A drug not present in the catalogue is stored as free_text rather than
 * rejected: the doctor's wording is the clinically authoritative record, and
 * refusing to save it would push them back to paper. `is_parsed` marks which
 * of the two happened so later reporting can tell them apart.
 */
export async function createDrugs(input: DrugsInput): Promise<PrescriptionRow> {
  if (!input.patientId) throw new Error('اختر المريض');

  const items = (input.items ?? []).filter((l) => l && str(l.name).length > 1);
  if (!items.length) throw new Error('أدخل دواءً واحداً على الأقل');
  if (items.length > 20) throw new Error('الحد عشرون دواءً في الوصفة الواحدة');

  const date = input.prescribedOn || today();

  const { data: head, error: headErr } = await supabase
    .from('prescriptions')
    .insert({
      patient_id: input.patientId,
      visit_id: input.visitId ?? null,
      doctor_id: input.doctorId ?? null,
      clinic_id: input.clinicId ?? null,
      prescribed_on: date,
      is_glasses: false,
      eye: input.eye ?? null,
      notes: str(input.notes) || null,
    })
    .select('*')
    .single();

  if (headErr) throw new Error(reportError(headErr, 'حفظ الوصفة'));
  const rx = one<PrescriptionRow>(head);

  const catalogue = await medications();
  const byName = new Map(catalogue.map((m) => [m.name, m.id]));

  const itemRows = items.map((l, i) => {
    const name = str(l.name);
    const hit = byName.get(name) ?? null;
    return {
      prescription_id: rx.id,
      medication_id: hit,
      free_text: hit ? null : name,
      dose: str(l.dose) || null,
      frequency: str(l.frequency) || null,
      duration: str(l.duration) || null,
      eye: l.eye ?? null,
      instructions: str(l.instructions) || null,
      sort_order: i,
      is_parsed: Boolean(hit),
    };
  });

  const { error } = await supabase.from('prescription_items').insert(itemRows);
  if (error) {
    try {
      await supabase
        .from('prescriptions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', rx.id);
    } catch {
      /* header left without items; filtered from lists */
    }
    throw new Error(reportError(error, 'حفظ بنود الوصفة'));
  }
  return rx;
}

export interface MedicationOption {
  id: string;
  name: string;
  form: string | null;
  strength?: string | null;
  name_ar?: string | null;
  is_active?: boolean;
}

let catalogueCache: MedicationOption[] | null = null;

/** The drug catalogue. Cached per session; it changes rarely. */
export async function medications(): Promise<MedicationOption[]> {
  if (catalogueCache) return catalogueCache;
    const { data, error } = await supabase
    .from('medications')
    .select('id, name, name_ar, generic_name, strength, form, is_active')
    .eq('is_active', true)
    .order('name', { ascending: true });
  if (error) throw new Error(reportError(error, 'قائمة الأدوية'));
  catalogueCache = rows<MedicationOption>(data);
  return catalogueCache;
}


export interface MedicationInput {
  name: string;
  nameAr?: string | null;
  genericName?: string | null;
  strength?: string | null;
  form?: string;
}

export async function createMedication(input: MedicationInput): Promise<MedicationOption> {
  if (!input.name.trim()) throw new Error('اسم الدواء مطلوب');
  const { data, error } = await supabase
    .from('medications')
    .insert({
      name: input.name.trim(),
      name_ar: input.nameAr?.trim() || null,
      generic_name: input.genericName?.trim() || null,
      strength: input.strength?.trim() || null,
      form: input.form || 'other',
      is_active: true,
      is_custom: true,
    } as never)
    .select('id, name, name_ar, generic_name, strength, form, is_active')
    .single();
  if (error) throw new Error(reportError(error, 'إضافة الدواء'));
  catalogueCache = null;
  return one<MedicationOption>(data);
}

export async function setMedicationActive(id: string, isActive: boolean): Promise<MedicationOption> {
  const { data, error } = await supabase
    .from('medications')
    .update({ is_active: isActive } as never)
    .eq('id', id)
    .select('id, name, name_ar, generic_name, strength, form, is_active')
    .single();
  if (error) throw new Error(reportError(error, isActive ? 'تفعيل الدواء' : 'إيقاف الدواء'));
  catalogueCache = null;
  return one<MedicationOption>(data);
}

/* =========================================================================
 * Reads
 * ====================================================================== */

export async function listByPatient(patientId: string): Promise<PrescriptionRow[]> {
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('patient_id', patientId)
    .is('deleted_at', null)
    .order('prescribed_on', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(reportError(error, 'وصفات المريض'));
  return rows<PrescriptionRow>(data);
}

/**
 * The refraction rows for one prescription, returned as a map keyed by eye
 * label. Callers look up `byEye.OD` — never `rows[0]` — so a change in row
 * order can never swap the eyes.
 */
export async function refractionsFor(
  prescriptionId: string,
): Promise<{ OD: RefractionRow | null; OS: RefractionRow | null; all: RefractionRow[] }> {
  const { data, error } = await supabase
    .from('refractions')
    .select('*')
    .eq('prescription_id', prescriptionId)
    .is('deleted_at', null);
  if (error) throw new Error(reportError(error, 'قياسات النظارة'));

  const all = rows<RefractionRow>(data);
  return {
    OD: all.find((r) => r.eye === 'OD') ?? null,
    OS: all.find((r) => r.eye === 'OS') ?? null,
    all,
  };
}

export async function itemsFor(prescriptionId: string): Promise<PrescriptionItemRow[]> {
  const { data, error } = await supabase
    .from('prescription_items')
    .select('*')
    .eq('prescription_id', prescriptionId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(reportError(error, 'بنود الوصفة'));
  return rows<PrescriptionItemRow>(data);
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}
