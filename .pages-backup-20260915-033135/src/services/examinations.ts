/* -------------------------------------------------------------------------
 * examinations service — port of v2/js/svc-clinical.js
 *   examinations · findings · diagnoses · surgeries
 * -------------------------------------------------------------------------
 * One examination form in the UI produces several linked rows: the exam, an
 * IOP measurement per eye, segment findings, a refraction, a diagnosis and a
 * follow-up. The service hides that: the screen calls one function.
 *
 * ⚠️ createFull is NOT atomic. PostgREST offers no transaction over REST, so
 * the exam is saved first and any later failure is reported explicitly while
 * the exam stays saved — rather than claiming full success or losing what was
 * written. Callers must surface `warnings`.
 * ---------------------------------------------------------------------- */

import { supabase } from './supabase';
import { svcError } from './_err';
import * as M from '../utils/models';
import type {
  Diagnosis,
  ExamFinding,
  Examination,
  FindingMap,
  FollowUp,
  IopMeasurement,
  Refraction,
  Surgery,
} from '../types/clinical';
import type { Eye } from '../types/domain';
import type { TablesInsert, TablesUpdate } from '../types/database.types';

const CLINICAL_ERRORS = {
  value_mmhg: 'ضغط العين يجب أن يكون بين 0 و80',
  chk_cyl_axis: 'لا يمكن إدخال أسطواني بلا محور',
  sphere: 'الكروي خارج المدى المسموح (±30)',
  cylinder: 'الأسطواني خارج المدى المسموح (±15)',
  axis: 'المحور يجب أن يكون بين 0 و180',
  chk_finding_field_section: 'حقل فحص لا ينتمي لقطاعه — راجع النموذج',
  uq_exam_findings_slot: 'هذا الحقل مسجَّل مرتين لنفس العين في نفس الفحص',
  chk_surgery_date: 'عملية أُجريت بلا تاريخ — أدخل التاريخ أو اجعلها مخطَّطة',
  patient_mismatch: 'عدم تطابق: السجل يخص مريضاً آخر',
};

/* ══════════════════════════════════════════════════════
 * Segment findings — one row per (exam, eye, field).
 * This is what turns "compare the cornea between the two visits" into a
 * query instead of parsing a paragraph the doctor typed in a hurry.
 * ══════════════════════════════════════════════════════ */

export const findings = {
  async byExam(examId: string): Promise<ExamFinding[]> {
    const r = await supabase
      .from('exam_findings')
      .select('*')
      .eq('examination_id', examId)
      .is('deleted_at', null);
    if (r.error) throw svcError(r.error, 'قراءة موجودات الفحص', CLINICAL_ERRORS);
    return (r.data ?? []) as unknown as ExamFinding[];
  },

  async byExams(ids: string[]): Promise<ExamFinding[]> {
    if (!ids.length) return [];
    const r = await supabase
      .from('exam_findings')
      .select('*')
      .in('examination_id', ids)
      .is('deleted_at', null);
    if (r.error) throw svcError(r.error, 'قراءة الموجودات', CLINICAL_ERRORS);
    return (r.data ?? []) as unknown as ExamFinding[];
  },

  /** map.OD.cornea — the shape the form and the comparison read directly. */
  toMap(rows: ExamFinding[]): FindingMap {
    const m: FindingMap = { OD: {}, OS: {}, OU: {} };
    for (const f of rows ?? []) {
      if (m[f.eye]) m[f.eye][f.field] = f.value;
    }
    return m;
  },

  /**
   * Replaces an exam's findings wholesale. The delete is soft, not hard: a
   * doctor correcting an earlier finding is a clinical event that deserves a
   * trace, not a line that vanishes silently.
   *
   * Returns a warning string on failure and does NOT throw — the exam itself
   * is already saved.
   */
  async replace(
    examId: string,
    patientId: string,
    list: Array<{ eye: Eye; field: string; value: unknown; is_normal?: boolean | null }> | undefined,
  ): Promise<string | null> {
    if (!list) return null;

    const rows: Array<TablesInsert<{ schema: 'iapp' }, 'exam_findings'>> = [];
    for (const f of list) {
      const val = M.str(f.value);
      if (val == null) continue;
      const chk = M.validateFinding(f);
      if (!chk.ok) return 'موجودات لم تُحفظ: ' + chk.errors[0];
      rows.push({
        examination_id: examId,
        patient_id: patientId,
        eye: f.eye,
        section: M.FIELD_SECTION[f.field],
        field: f.field,
        value: val,
        is_normal: f.is_normal == null ? null : !!f.is_normal,
      });
    }

    const d = await supabase
      .from('exam_findings')
      .update({ deleted_at: new Date().toISOString() })
      .eq('examination_id', examId)
      .is('deleted_at', null);
    if (d.error) return 'تعذّر تحديث الموجودات السابقة: ' + d.error.message;

    if (!rows.length) return null;

    const r = await supabase.from('exam_findings').insert(rows);
    if (r.error) return 'الموجودات لم تُحفظ: ' + r.error.message;
    return null;
  },

  /** One field's value across every visit — the basis for tracking C/D. */
  async timeline(pid: string, field: string, eye?: Eye, limit = 24) {
    let q = supabase
      .from('exam_findings')
      .select('value,eye,created_at,examination_id')
      .eq('patient_id', pid)
      .eq('field', field)
      .is('deleted_at', null);
    if (eye) q = q.eq('eye', eye);
    const r = await q.order('created_at', { ascending: false }).limit(limit);
    if (r.error) throw svcError(r.error, 'قراءة تطوّر الموجود', CLINICAL_ERRORS);
    return (r.data ?? []) as unknown as Array<{
      value: string;
      eye: Eye;
      created_at: string;
      examination_id: string;
    }>;
  },
};

/**
 * Refraction measured during the exam. No new table for it: `refractions`
 * already exists and is used by the glasses form, and a duplicated source is
 * worse than a missing column.
 */
async function saveExamRefraction(
  examId: string,
  data: Record<string, unknown>,
): Promise<string | null> {
  const rows: Array<TablesInsert<{ schema: 'iapp' }, 'refractions'>> = [];

  for (const [k, eye] of [
    ['od', 'OD'],
    ['os', 'OS'],
  ] as const) {
    const has = ['sph', 'cyl', 'axis', 'add'].some((x) => {
      const v = data[`ref_${k}_${x}`];
      return v != null && v !== '';
    });
    if (!has) continue;

    rows.push({
      patient_id: String(data.patient_id),
      examination_id: examId,
      visit_id: M.str(data.visit_id),
      eye,
      measured_on: M.str(data.exam_date) ?? undefined,
      refraction_type:
        (M.str(data.refraction_type) as TablesInsert<
          { schema: 'iapp' },
          'refractions'
        >['refraction_type']) ?? 'final',
      sphere: M.num(data[`ref_${k}_sph`]),
      cylinder: M.num(data[`ref_${k}_cyl`]),
      axis: M.int(data[`ref_${k}_axis`]),
      add_power: M.num(data[`ref_${k}_add`]),
    });
  }

  if (!rows.length) return null;
  for (const row of rows) {
    const chk = M.validateRefraction(row);
    if (!chk.ok) return 'الانكسار لم يُحفظ: ' + chk.errors[0];
  }
  const r = await supabase.from('refractions').insert(rows);
  if (r.error) return 'الانكسار لم يُحفظ: ' + r.error.message;
  return null;
}

/* ══════════════════════════════════════════════════════
 * Surgical history
 * ══════════════════════════════════════════════════════ */

export const surgeries = {
  async listByPatient(pid: string, limit = 40): Promise<Surgery[]> {
    const r = await supabase
      .from('surgeries')
      .select('*')
      .eq('patient_id', pid)
      .is('deleted_at', null)
      .order('performed_on', { ascending: false, nullsFirst: true })
      .limit(limit);
    if (r.error) throw svcError(r.error, 'قراءة التاريخ الجراحي', CLINICAL_ERRORS);
    return (r.data ?? []) as unknown as Surgery[];
  },

  async create(s: Record<string, unknown>): Promise<Surgery> {
    const chk = M.validateSurgery(s);
    if (!chk.ok) throw new Error(chk.errors[0]);
    const payload: TablesInsert<{ schema: 'iapp' }, 'surgeries'> = {
      patient_id: String(s.patient_id),
      visit_id: M.str(s.visit_id),
      examination_id: M.str(s.examination_id),
      clinic_id: M.str(s.clinic_id),
      doctor_id: M.str(s.doctor_id),
      eye: s.eye as TablesInsert<{ schema: 'iapp' }, 'surgeries'>['eye'],
      procedure_name: M.str(s.procedure_name) ?? '',
      procedure_code: M.str(s.procedure_code),
      performed_on: M.str(s.performed_on),
      is_planned: !!s.is_planned,
      is_external: !!s.is_external,
      surgeon_name: M.str(s.surgeon_name),
      anesthesia: M.str(s.anesthesia),
      outcome: M.str(s.outcome),
      complications: M.str(s.complications),
      notes: M.str(s.notes),
    };
    const r = await supabase
      .from('surgeries')
      .insert(payload)
      .select('*')
      .single();
    if (r.error) throw svcError(r.error, 'حفظ العملية', CLINICAL_ERRORS);
    return r.data as unknown as Surgery;
  },

  async update(id: string, s: Record<string, unknown>): Promise<Surgery> {
    const chk = M.validateSurgery(s);
    if (!chk.ok) throw new Error(chk.errors[0]);
    const payload: TablesUpdate<{ schema: 'iapp' }, 'surgeries'> = {
      eye: s.eye as TablesUpdate<{ schema: 'iapp' }, 'surgeries'>['eye'],
      procedure_name: M.str(s.procedure_name) ?? undefined,
      procedure_code: M.str(s.procedure_code),
      performed_on: M.str(s.performed_on),
      is_planned: !!s.is_planned,
      is_external: !!s.is_external,
      surgeon_name: M.str(s.surgeon_name),
      anesthesia: M.str(s.anesthesia),
      outcome: M.str(s.outcome),
      complications: M.str(s.complications),
      notes: M.str(s.notes),
    };
    const r = await supabase
      .from('surgeries')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();
    if (r.error) throw svcError(r.error, 'تعديل العملية', CLINICAL_ERRORS);
    return r.data as unknown as Surgery;
  },

  async remove(id: string): Promise<boolean> {
    const r = await supabase
      .from('surgeries')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (r.error) throw svcError(r.error, 'حذف العملية', CLINICAL_ERRORS);
    return true;
  },
};

/* ══════════════════════════════════════════════════════
 * Diagnoses
 * ══════════════════════════════════════════════════════ */

export const diagnoses = {
  async listByPatient(pid: string, limit = 30): Promise<Diagnosis[]> {
    const r = await supabase
      .from('diagnoses')
      .select('*')
      .eq('patient_id', pid)
      .is('deleted_at', null)
      .order('diagnosed_on', { ascending: false })
      .limit(limit);
    if (r.error) throw svcError(r.error, 'قراءة التشخيصات', CLINICAL_ERRORS);
    return (r.data ?? []) as unknown as Diagnosis[];
  },

  async create(d: Record<string, unknown>): Promise<Diagnosis> {
    if (!d.patient_id) throw new Error('المريض مطلوب');
    if (!M.str(d.diagnosis_text)) throw new Error('نص التشخيص مطلوب');
    const payload: TablesInsert<{ schema: 'iapp' }, 'diagnoses'> = {
      patient_id: String(d.patient_id),
      visit_id: M.str(d.visit_id),
      examination_id: M.str(d.examination_id),
      doctor_id: M.str(d.doctor_id),
      diagnosis_text: M.str(d.diagnosis_text) ?? '',
      icd10_code: M.str(d.icd10_code),
      eye: d.eye as TablesInsert<{ schema: 'iapp' }, 'diagnoses'>['eye'],
      status:
        (d.status as TablesInsert<{ schema: 'iapp' }, 'diagnoses'>['status']) ?? 'active',
      is_primary: !!d.is_primary,
      diagnosed_on: M.str(d.diagnosed_on) ?? M.today(),
    };
    const r = await supabase
      .from('diagnoses')
      .insert(payload)
      .select('*')
      .single();
    if (r.error) throw svcError(r.error, 'حفظ التشخيص', CLINICAL_ERRORS);
    return r.data as unknown as Diagnosis;
  },

  async setStatus(id: string, status: string): Promise<boolean> {
    const patch: TablesUpdate<{ schema: 'iapp' }, 'diagnoses'> = {
      status: status as TablesUpdate<{ schema: 'iapp' }, 'diagnoses'>['status'],
    };
    if (status === 'resolved') patch.resolved_on = M.today();
    const r = await supabase.from('diagnoses').update(patch).eq('id', id);
    if (r.error) throw svcError(r.error, 'تعديل حالة التشخيص', CLINICAL_ERRORS);
    return true;
  },

  async remove(id: string): Promise<boolean> {
    const r = await supabase
      .from('diagnoses')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (r.error) throw svcError(r.error, 'حذف التشخيص', CLINICAL_ERRORS);
    return true;
  },
};

/* ══════════════════════════════════════════════════════
 * Follow-ups
 * ══════════════════════════════════════════════════════
 * createFull() above already inserts one follow_ups row inline when an exam
 * carries a follow-up date, but nothing previously read them back — the
 * patient record's "last follow-up" and the visit summary had no way to
 * show or add one outside that exact moment. This adds exactly that: list
 * and create, against the same real follow_ups table and status enum.
 * ══════════════════════════════════════════════════════ */

export const followUps = {
  async listByPatient(pid: string, limit = 30): Promise<FollowUp[]> {
    const r = await supabase
      .from('follow_ups')
      .select('*')
      .eq('patient_id', pid)
      .is('deleted_at', null)
      .order('due_date', { ascending: false })
      .limit(limit);
    if (r.error) throw svcError(r.error, 'قراءة المتابعات', CLINICAL_ERRORS);
    return (r.data ?? []) as unknown as FollowUp[];
  },

  async create(input: {
    patientId: string;
    visitId?: string | null;
    examinationId?: string | null;
    doctorId?: string | null;
    clinicId?: string | null;
    dueDate: string;
    reason?: string | null;
    notes?: string | null;
  }): Promise<FollowUp> {
    if (!input.patientId) throw new Error('المريض مطلوب');
    if (!M.isDate(input.dueDate)) throw new Error('تاريخ المتابعة غير صحيح');
    const payload: TablesInsert<{ schema: 'iapp' }, 'follow_ups'> = {
      patient_id: input.patientId,
      visit_id: input.visitId ?? null,
      examination_id: input.examinationId ?? null,
      doctor_id: input.doctorId ?? null,
      clinic_id: input.clinicId ?? null,
      due_date: input.dueDate,
      reason: M.str(input.reason) || 'متابعة',
      notes: M.str(input.notes),
    };
    const r = await supabase.from('follow_ups').insert(payload).select('*').single();
    if (r.error) throw svcError(r.error, 'حفظ المتابعة', CLINICAL_ERRORS);
    return r.data as unknown as FollowUp;
  },
};

/* ══════════════════════════════════════════════════════
 * Examinations
 * ══════════════════════════════════════════════════════ */

export interface CreateFullResult {
  exam: Examination;
  warnings: string[];
}

export async function listByPatient(pid: string, limit = 30): Promise<Examination[]> {
  const r = await supabase
    .from('examinations')
    .select('*')
    .eq('patient_id', pid)
    .is('deleted_at', null)
    .order('exam_date', { ascending: false })
    .limit(limit);
  if (r.error) throw svcError(r.error, 'قراءة الفحوصات', CLINICAL_ERRORS);

  const exams = (r.data ?? []) as unknown as Examination[];
  if (!exams.length) return [];

  const ids = exams.map((e) => e.id);
  const iop = await supabase.from('iop_measurements').select('*').in('examination_id', ids);
  const I = (iop.error ? [] : (iop.data ?? [])) as unknown as IopMeasurement[];

  // IOP is joined per exam so the screen doesn't need a second query.
  for (const e of exams) {
    e._iop_od = I.find((x) => x.examination_id === e.id && x.eye === 'OD') ?? null;
    e._iop_os = I.find((x) => x.examination_id === e.id && x.eye === 'OS') ?? null;
  }
  return exams;
}

export async function createFull(data: Record<string, unknown>): Promise<CreateFullResult> {
  const chk = M.validateExam(data);
  if (!chk.ok) throw new Error(chk.errors[0]);

  const examPayload: TablesInsert<{ schema: 'iapp' }, 'examinations'> = {
    patient_id: String(data.patient_id),
    visit_id: M.str(data.visit_id),
    doctor_id: M.str(data.doctor_id),
    exam_date: M.str(data.exam_date) ?? M.today(),
    chief_complaint: M.str(data.chief_complaint),
    va_right: M.str(data.va_right),
    va_left: M.str(data.va_left),
    va_right_corrected: M.str(data.va_right_corrected),
    va_left_corrected: M.str(data.va_left_corrected),
    va_right_ph: M.str(data.va_right_ph),
    va_left_ph: M.str(data.va_left_ph),
    color_vision: M.str(data.color_vision),
    contrast_sensitivity: M.str(data.contrast_sensitivity),
    cover_test: M.str(data.cover_test),
    anterior_segment: M.str(data.anterior_segment),
    posterior_segment: M.str(data.posterior_segment),
    treatment_plan: M.str(data.treatment_plan),
    notes: M.str(data.notes),
  };

  const ex = await supabase
    .from('examinations')
    .insert(examPayload)
    .select('*')
    .single();
  if (ex.error) throw svcError(ex.error, 'حفظ الفحص', CLINICAL_ERRORS);

  const exam = ex.data as unknown as Examination;
  const warnings: string[] = [];

  const iops: Array<TablesInsert<{ schema: 'iapp' }, 'iop_measurements'>> = [];
  for (const [key, eye] of [
    ['iop_right', 'OD'],
    ['iop_left', 'OS'],
  ] as const) {
    const val = M.num(data[key]);
    if (val == null) continue;
    if (val < 0 || val > 80) {
      warnings.push('ضغط ' + (eye === 'OD' ? 'اليمنى' : 'اليسرى') + ' خارج المدى — لم يُحفظ');
      continue;
    }
    const row: TablesInsert<{ schema: 'iapp' }, 'iop_measurements'> = {
      patient_id: String(data.patient_id),
      examination_id: exam.id,
      visit_id: M.str(data.visit_id),
      eye,
      value_mmhg: val,
    };
    // Method and time are part of the measurement, not decoration: two
    // readings from two devices are not comparable.
    if (M.str(data.iop_method)) row.method = M.str(data.iop_method);
    if (M.str(data.iop_at)) row.measured_at = M.str(data.iop_at) ?? undefined;
    iops.push(row);
  }
  if (iops.length) {
    const ir = await supabase.from('iop_measurements').insert(iops);
    if (ir.error) warnings.push('ضغط العين لم يُحفظ: ' + ir.error.message);
  }

  const fw = await findings.replace(
    exam.id,
    String(data.patient_id),
    data.findings as Array<{ eye: Eye; field: string; value: unknown }> | undefined,
  );
  if (fw) warnings.push(fw);

  const rw = await saveExamRefraction(exam.id, data);
  if (rw) warnings.push(rw);

  if (M.str(data.diagnosis_text)) {
    const diagnosisPayload: TablesInsert<{ schema: 'iapp' }, 'diagnoses'> = {
      patient_id: String(data.patient_id),
      visit_id: M.str(data.visit_id),
      examination_id: exam.id,
      doctor_id: M.str(data.doctor_id),
      diagnosis_text: M.str(data.diagnosis_text) ?? '',
      eye: data.diagnosis_eye as TablesInsert<{ schema: 'iapp' }, 'diagnoses'>['eye'],
      is_primary: true,
      diagnosed_on: M.str(data.exam_date) ?? M.today(),
    };
    const dr = await supabase.from('diagnoses').insert(diagnosisPayload);
    if (dr.error) warnings.push('التشخيص لم يُحفظ: ' + dr.error.message);
  }

  if (M.isDate(data.follow_up_date)) {
    const followUpPayload: TablesInsert<{ schema: 'iapp' }, 'follow_ups'> = {
      patient_id: String(data.patient_id),
      visit_id: M.str(data.visit_id),
      examination_id: exam.id,
      clinic_id: M.str(data.clinic_id),
      due_date: String(data.follow_up_date),
      reason: M.str(data.follow_up_reason) || 'متابعة',
    };
    const fr = await supabase.from('follow_ups').insert(followUpPayload);
    if (fr.error) warnings.push('المتابعة لم تُحفظ: ' + fr.error.message);
  }

  return { exam, warnings };
}

export async function update(id: string, data: Record<string, unknown>): Promise<Examination> {
  const payload: TablesUpdate<{ schema: 'iapp' }, 'examinations'> = {
    exam_date: M.str(data.exam_date) ?? undefined,
    chief_complaint: M.str(data.chief_complaint),
    va_right: M.str(data.va_right),
    va_left: M.str(data.va_left),
    va_right_corrected: M.str(data.va_right_corrected),
    va_left_corrected: M.str(data.va_left_corrected),
    va_right_ph: M.str(data.va_right_ph),
    va_left_ph: M.str(data.va_left_ph),
    color_vision: M.str(data.color_vision),
    contrast_sensitivity: M.str(data.contrast_sensitivity),
    cover_test: M.str(data.cover_test),
    anterior_segment: M.str(data.anterior_segment),
    posterior_segment: M.str(data.posterior_segment),
    treatment_plan: M.str(data.treatment_plan),
    notes: M.str(data.notes),
  };
  const r = await supabase
    .from('examinations')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (r.error) throw svcError(r.error, 'تعديل الفحص', CLINICAL_ERRORS);

  const exam = r.data as unknown as Examination;
  // Findings are replaced wholesale: the form submits the exam's final state.
  if (data.findings) {
    const w = await findings.replace(
      id,
      exam.patient_id,
      data.findings as Array<{ eye: Eye; field: string; value: unknown }>,
    );
    if (w) throw new Error(w);
  }
  return exam;
}

/** The full exam: findings already grouped by eye, ready for the form. */
export async function getFull(id: string): Promise<Examination> {
  const r = await supabase.from('examinations').select('*').eq('id', id).single();
  if (r.error) throw svcError(r.error, 'قراءة الفحص', CLINICAL_ERRORS);

  const e = r.data as unknown as Examination;
  e._findings = await findings.byExam(id);
  e._map = findings.toMap(e._findings);

  const iop = await supabase
    .from('iop_measurements')
    .select('*')
    .eq('examination_id', id)
    .is('deleted_at', null);
  const I = (iop.error ? [] : (iop.data ?? [])) as unknown as IopMeasurement[];
  e._iop_od = I.find((x) => x.eye === 'OD') ?? null;
  e._iop_os = I.find((x) => x.eye === 'OS') ?? null;

  const rf = await supabase
    .from('refractions')
    .select('*')
    .eq('examination_id', id)
    .is('deleted_at', null);
  const R = (rf.error ? [] : (rf.data ?? [])) as unknown as Refraction[];
  e._ref_od = R.find((x) => x.eye === 'OD') ?? null;
  e._ref_os = R.find((x) => x.eye === 'OS') ?? null;

  return e;
}

/**
 * Longitudinal comparison. Reads from v_exam_full, which is
 * security_invoker — it runs with the caller's rights and opens no back door
 * around RLS.
 */
export async function history(pid: string, limit = 12): Promise<Examination[]> {
  const r = await supabase
    .from('v_exam_full')
    .select('*')
    .eq('patient_id', pid)
    .order('exam_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (r.error) throw svcError(r.error, 'قراءة سجل الفحوصات', CLINICAL_ERRORS);

  const rows = (r.data ?? []) as unknown as Examination[];
  if (!rows.length) return [];

  const ids = rows.map((x) => x.id);
  const F = await findings.byExams(ids);
  for (const x of rows) {
    x._map = findings.toMap(F.filter((f) => f.examination_id === x.id));
  }
  return rows;
}

/** Two consecutive exams ready to compare: the current one and its predecessor. */
export async function comparePair(pid: string, currentId?: string) {
  const h = await history(pid, 12);
  if (!h.length) return { cur: null, prev: null, all: h };
  let i = 0;
  if (currentId) {
    const k = h.findIndex((x) => x.id === currentId);
    if (k >= 0) i = k;
  }
  return { cur: h[i] ?? null, prev: h[i + 1] ?? null, all: h };
}

/** IOP history for glaucoma tracking. */
export async function iopHistory(pid: string, limit = 24): Promise<IopMeasurement[]> {
  const r = await supabase
    .from('iop_measurements')
    .select('*')
    .eq('patient_id', pid)
    .is('deleted_at', null)
    .order('measured_at', { ascending: false })
    .limit(limit);
  if (r.error) throw svcError(r.error, 'قراءة ضغط العين', CLINICAL_ERRORS);
  return (r.data ?? []) as unknown as IopMeasurement[];
}
