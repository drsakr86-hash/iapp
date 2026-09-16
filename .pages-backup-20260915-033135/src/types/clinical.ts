/* -------------------------------------------------------------------------
 * clinical.ts — row shapes consumed by the doctor application.
 * -------------------------------------------------------------------------
 * Every field name below was read off the legacy services verbatim
 * (v2/js/svc-*.js), not from sql/002_schema.sql, which is a Phase 9 export
 * and does not describe the live database.
 *
 * These are hand-written because database.types.ts is still the placeholder.
 * When the generated types land, these become redundant for row shapes and
 * should be replaced by Tables<'patients'> etc. Fields marked `_`-prefixed
 * are joined client-side by the service layer and exist in no table.
 * ---------------------------------------------------------------------- */

import type { Eye, Modality, AppointmentStatus } from './domain';
export interface Clinic {
  id: string;
  name_ar: string | null;
  name_en?: string | null;
  is_active: boolean | null;
}

export interface Doctor {
  id: string;
  full_name_ar: string | null;
  full_name?: string | null;
  specialty?: string | null;
}

/** Read from v_patient_clinical, never from `patients` directly. */
export interface Patient {
  id: string;
  patient_code: string | null;
  full_name: string;
  age_at_registration: number | null;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  alt_phone: string | null;
  email: string | null;
  national_id: string | null;
  address: string | null;
  city: string | null;
  occupation: string | null;
  blood_type: string | null;
  allergies: string | null;
  medical_history: string | null;
  primary_condition: string | null;
  triage_status: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  primary_clinic_id: string | null;
  is_active: boolean | null;
  created_at: string | null;
  /** Computed server-side by v_patient_clinical. */
  last_visit?: string | null;
}

export interface Visit {
  id: string;
  patient_id: string;
  clinic_id: string | null;
  doctor_id: string | null;
  appointment_id: string | null;
  visit_date: string;
  visit_type: string | null;
  chief_complaint: string | null;
  summary: string | null;
  notes: string | null;
  is_locked: boolean;
  locked_at: string | null;
  created_at: string | null;
}

export interface IopMeasurement {
  id: string;
  patient_id: string;
  examination_id: string | null;
  visit_id: string | null;
  eye: Eye;
  value_mmhg: number | null;
  method: string | null;
  measured_at: string | null;
}

export interface Refraction {
  id: string;
  patient_id: string;
  examination_id: string | null;
  prescription_id: string | null;
  visit_id: string | null;
  eye: Eye;
  measured_on: string | null;
  refraction_type: string | null;
  sphere: number | null;
  cylinder: number | null;
  axis: number | null;
  add_power: number | null;
  ipd_mm: number | null;
}

export interface ExamFinding {
  id?: string;
  examination_id: string;
  patient_id: string;
  eye: Eye;
  section: string;
  field: string;
  value: string;
  is_normal: boolean | null;
  created_at?: string | null;
}

/** map.OD.cornea — the shape the form and the comparison read directly. */
export type FindingMap = Record<Eye, Record<string, string>>;

export interface Examination {
  id: string;
  patient_id: string;
  visit_id: string | null;
  doctor_id: string | null;
  exam_date: string;
  chief_complaint: string | null;
  va_right: string | null;
  va_left: string | null;
  va_right_corrected: string | null;
  va_left_corrected: string | null;
  va_right_ph: string | null;
  va_left_ph: string | null;
  color_vision: string | null;
  contrast_sensitivity: string | null;
  cover_test: string | null;
  anterior_segment: string | null;
  posterior_segment: string | null;
  treatment_plan: string | null;
  notes: string | null;
  created_at: string | null;
  /* joined client-side */
  _iop_od?: IopMeasurement | null;
  _iop_os?: IopMeasurement | null;
  _ref_od?: Refraction | null;
  _ref_os?: Refraction | null;
  _findings?: ExamFinding[];
  _map?: FindingMap;
}

export interface Diagnosis {
  id: string;
  patient_id: string;
  visit_id: string | null;
  examination_id: string | null;
  doctor_id: string | null;
  diagnosis_text: string;
  icd10_code: string | null;
  eye: Eye | null;
  status: string | null;
  is_primary: boolean | null;
  diagnosed_on: string | null;
  resolved_on: string | null;
}

export interface Surgery {
  id: string;
  patient_id: string;
  visit_id: string | null;
  examination_id: string | null;
  clinic_id: string | null;
  doctor_id: string | null;
  eye: Eye;
  procedure_name: string;
  procedure_code: string | null;
  performed_on: string | null;
  is_planned: boolean | null;
  is_external: boolean | null;
  surgeon_name: string | null;
  anesthesia: string | null;
  outcome: string | null;
  complications: string | null;
  notes: string | null;
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medication_id: string | null;
  free_text: string | null;
  dose: string | null;
  frequency: string | null;
  duration: string | null;
  eye: Eye | null;
  sort_order: number | null;
  is_parsed: boolean | null;
}

export interface Prescription {
  id: string;
  patient_id: string;
  visit_id: string | null;
  examination_id: string | null;
  doctor_id: string | null;
  clinic_id: string | null;
  prescribed_on: string;
  eye: Eye | null;
  is_glasses: boolean | null;
  notes: string | null;
  /* joined client-side */
  _od?: Refraction | null;
  _os?: Refraction | null;
  _items?: PrescriptionItem[];
}

export interface Medication {
  id: string;
  name: string;
  form: string | null;
  strength: string | null;
}

export interface FollowUp {
  id: string;
  patient_id: string;
  visit_id: string | null;
  examination_id: string | null;
  doctor_id: string | null;
  clinic_id: string | null;
  due_date: string;
  reason: string | null;
  notes: string | null;
  status: string | null;
  notified_at: string | null;
  completed_at: string | null;
  /* joined client-side by followups.due() */
  _name?: string;
  _phone?: string;
  _code?: string;
}

/** Row from v_appointment_board. */
export interface AppointmentRow {
  id: string;
  patient_id: string | null;

  patient_name?: string | null;
  patient_code?: string | null;
  patient_phone?: string | null;

  guest_name: string | null;
  guest_phone: string | null;

  doctor_id: string | null;
  clinic_id: string;

  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;

  status: AppointmentStatus;
  appointment_type: string | null;

  room: string | null;
  notes: string | null;

  visit_id: string | null;
  created_at: string;

  called_at?: string | null;
  arrived_at?: string | null;
}

export interface MedicalImage {
  id: string;
  patient_id: string;
  visit_id: string | null;
  examination_id: string | null;
  modality: Modality;
  eye: Eye | null;
  study_date: string | null;
  captured_on: string | null;
  device: string | null;
  technician: string | null;
  clinical_indication: string | null;
  storage_provider: string | null;
  storage_path: string | null;
  thumbnail_path: string | null;
  legacy_url: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  doctor_report: string | null;
  reported_by: string | null;
  reported_at: string | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
  created_by: string | null;
}
