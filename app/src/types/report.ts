/* -------------------------------------------------------------------------
 * report.ts — contracts for the printable Medical Report.
 * -------------------------------------------------------------------------
 * This is a PRESENTATION-layer shape only. Nothing here is written to the
 * database and no field is invented: every property is populated from a
 * row already returned by an existing service (visits, examinations,
 * diagnoses, follow-ups, prescriptions, imaging, patients, clinics,
 * doctors). See DoctorMedicalReport.tsx for the assembly.
 * ---------------------------------------------------------------------- */

import type {
  Diagnosis,
  Examination,
  FollowUp,
  Patient,
  Visit,
} from './clinical';
import type { ClinicRow } from '../services/clinics';
import type {
  PrescriptionItemRow,
  PrescriptionRow,
  RefractionRow,
} from '../services/prescriptions';
import type { ImagingOrder, Study } from '../services/imaging';

/** A glasses (Rx) prescription, its header plus the two per-eye rows. */
export interface GlassesReportItem {
  prescription: PrescriptionRow;
  od: RefractionRow | null;
  os: RefractionRow | null;
}

/** A medication prescription, its header plus resolved drug names. */
export interface DrugsReportItem {
  prescription: PrescriptionRow;
  items: Array<PrescriptionItemRow & { displayName: string }>;
}

export interface ReportDoctor {
  displayName: string;
  titleAr: string | null;
}

export interface ReportData {
  patient: Patient;
  visit: Visit;
  clinic: ClinicRow | null;
  doctor: ReportDoctor;

  /** The exam tied to this visit, if one was recorded. Most recent if >1. */
  examination: Examination | null;

  diagnoses: Diagnosis[];
  followUps: FollowUp[];
  glasses: GlassesReportItem[];
  drugs: DrugsReportItem[];
  studies: Array<Study & { thumbUrl?: string | null }>;
  imagingOrders: ImagingOrder[];

  generatedAt: string;
}

/** The individually printable documents — only shown when their data exists. */
export type ReportDocType =
  | 'complete'
  | 'examination'
  | 'glasses'
  | 'medication'
  | 'investigation_request'
  | 'imaging_report'
  | 'followup';
