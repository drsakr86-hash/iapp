/* -------------------------------------------------------------------------
 * imaging service — orders, studies, and private-bucket access.
 * -------------------------------------------------------------------------
 * Ported from v2/js/svc-imaging.js. Table and column names below were read
 * off that file, which is the code the live clinic runs; the Git schema
 * export (sql/002_schema.sql) predates Phase 10 and does not contain
 * imaging_orders, imaging_order_items, or the Phase 10 columns on
 * medical_images. Do not "correct" these names against the export.
 *
 * SECURITY INVARIANTS — do not relax:
 *   - the bucket is PRIVATE. Reads happen only through short-lived signed
 *     URLs. getPublicUrl() must never be called on it; the database also
 *     rejects a stored public URL (chk_img_no_public_url).
 *   - storage_path must keep the shape p/<patient>/<study>/<file>
 *     (chk_img_path_shape). The path encodes the patient, which is what
 *     lets a storage policy scope access per patient.
 *   - every read of an image is audited through the log_event RPC.
 *
 * TWO RECORDS, ONE OPERATION
 * An imaging study is a file in Storage plus a row in medical_images. They
 * can fail independently, so the order of operations matters:
 *
 *   upload file → insert row → on insert failure, delete the file
 *
 * The reverse order (row first) would leave a medical record pointing at a
 * file that does not exist. Of the two possible orphans, a stray file is the
 * recoverable one; a dangling record is a lie in a patient's chart.
 * ---------------------------------------------------------------------- */

import { supabase, one, rows } from './supabase';
import { reportError } from '../utils/errors';
import type { Eye, Modality, OrderStatus, StudyStatus, Urgency } from '../types/domain';
import { MODALITY_AR, URGENCY_AR } from '../types/domain';
import type { Json } from '../types/database.types';

export const IMAGING_BUCKET = 'medical-imaging';
export const SIGNED_URL_TTL_SECONDS = 300;

const bucket = () => supabase.storage.from(IMAGING_BUCKET);

const STUDY_COLS =
  'id, patient_id, visit_id, examination_id, modality, eye, study_date, captured_on, ' +
  'device, technician, clinical_indication, storage_provider, storage_path, ' +
  'thumbnail_path, legacy_url, file_name, mime_type, size_bytes, width, height, ' +
  'doctor_report, reported_by, reported_at, status, notes, created_at, created_by';

export interface Study {
  id: string;
  patient_id: string;
  visit_id: string | null;
  examination_id: string | null;
  modality: string;
  eye: Eye | null;
  study_date: string | null;
  storage_path: string | null;
  thumbnail_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  status: StudyStatus | null;
  notes: string | null;
  clinical_indication: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  seq: number;
  modality: Modality;
  eye: Eye;
  notes: string | null;
  image_id: string | null;
  done: boolean;
}

export interface ImagingOrder {
  id: string;
  order_no: string | null;
  patient_id: string;
  visit_id: string | null;
  doctor_id: string | null;
  clinic_id: string | null;
  ordered_on: string;
  urgency: Urgency;
  status: OrderStatus;
  clinical_indication: string | null;
  clinical_notes: string | null;
  items?: OrderItem[];
}

/* -------------------------------------------------------------------------
 * Audit. Failure to log must not fail the clinical operation, but it must
 * not be silent either — an unlogged read is a gap in the access trail.
 *
 * The real iapp.log_event signature (confirmed against the generated
 * database types) takes p_resource / p_record_id / p_patient_id — NOT
 * p_entity / p_entity_id, which this call used before the real types
 * existed. With the placeholder types that mismatch compiled silently and
 * the wrapping try/catch below swallowed the resulting RPC error at
 * runtime, so every image access has gone unlogged until this fix.
 * ---------------------------------------------------------------------- */
async function audit(
  action: string,
  study: { id: string; patient_id: string },
  meta?: Record<string, unknown> | null,
): Promise<void> {
  try {
    const { error } = await supabase.rpc('log_event', {
      p_action: action,
      p_resource: 'medical_images',
      p_record_id: study.id,
      p_patient_id: study.patient_id,
      p_meta: (meta ?? null) as Json,
    });
    if (error && import.meta.env.DEV) console.warn('[iapp] audit', action, error);
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[iapp] audit', action, e);
  }
}

/* =========================================================================
 * STUDIES — read
 * ====================================================================== */

export async function listByPatient(patientId: string): Promise<Study[]> {
  const { data, error } = await supabase
    .from('medical_images')
    .select(STUDY_COLS)
    .eq('patient_id', patientId)
    .is('deleted_at', null)
    .order('study_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(reportError(error, 'صور المريض'));
  return rows<Study>(data);
}

/**
 * A time-limited URL for one study. The bucket is private, so this is the
 * only way to display an image. The URL expires; it is never stored.
 */
export async function signedUrl(
  study: Study,
  opts: {
    thumb?: boolean;
    download?: string | boolean;
    ttl?: number;
    silent?: boolean;
  } = {},
): Promise<string> {
  const path = opts.thumb ? (study.thumbnail_path ?? study.storage_path) : study.storage_path;
  if (!path) throw new Error('لا يوجد ملف مخزَّن لهذه الدراسة');

  /* Rows migrated from Cloudinary hold an absolute URL rather than a bucket
     path. They are displayed as-is and are never written in this shape
     again. */
  if (/^https?:\/\//i.test(path)) return path;

  const options: { download?: string } = {};
  if (opts.download)
    options.download =
      opts.download === true ? (study.file_name ?? 'study') : String(opts.download);

  const { data, error } = await bucket().createSignedUrl(
    path,
    opts.ttl ?? SIGNED_URL_TTL_SECONDS,
    options,
  );
  if (error) throw new Error(reportError(error, 'فتح الصورة'));
  if (!opts.silent) await audit(opts.download ? 'export' : 'read', study, { path });
  return data.signedUrl;
}

/** Thumbnails for a whole list in one request rather than one per card. */
export async function thumbUrls(
  list: Study[],
  ttl = SIGNED_URL_TTL_SECONDS,
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const paths: string[] = [];
  const ids: string[] = [];

  for (const s of list) {
    const p = s.thumbnail_path ?? s.storage_path;
    if (!p) continue;
    if (/^https?:\/\//i.test(p)) {
      out[s.id] = p;
      continue;
    }
    paths.push(p);
    ids.push(s.id);
  }
  if (!paths.length) return out;

  try {
    const { data, error } = await bucket().createSignedUrls(paths, ttl);
    if (error) return out;
    (data ?? []).forEach((x, i) => {
      if (x?.signedUrl && !x.error) out[ids[i]] = x.signedUrl;
    });
  } catch {
    /* thumbnails are decoration; the list still renders with placeholders */
  }
  return out;
}

/* =========================================================================
 * STUDIES — upload
 * ====================================================================== */

export interface UploadInput {
  patientId: string;
  modality: Modality;
  eye: Eye;
  studyDate: string;
  file: File;
  visitId?: string | null;
  examinationId?: string | null;
  device?: string | null;
  technician?: string | null;
  clinicalIndication?: string | null;
  notes?: string | null;
  onProgress?: (message: string) => void;
}

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = /^(image\/(jpeg|png|webp|tiff)|application\/pdf)$/i;

export async function upload(input: UploadInput): Promise<Study> {
  const { file } = input;
  if (!input.patientId) throw new Error('اختر المريض');
  if (!input.modality || !(input.modality in MODALITY_AR))
    throw new Error('اختر نوع التصوير');
  if (!input.eye) throw new Error('حدّد العين');
  if (!input.studyDate) throw new Error('اختر تاريخ الدراسة');
  if (!file) throw new Error('اختر ملفاً');
  if (file.size > MAX_BYTES) throw new Error('حجم الملف أكبر من 25 ميجابايت');
  if (file.type && !ALLOWED.test(file.type))
    throw new Error('نوع الملف غير مدعوم — JPEG أو PNG أو WebP أو TIFF أو PDF');

  const id = crypto.randomUUID();
  const ext = extensionOf(file);
  const path = `p/${input.patientId}/${id}/original.${ext}`;
  const uploaded: string[] = [];

  try {
    input.onProgress?.('جارٍ رفع الملف…');
    const up = await bucket().upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      cacheControl: '3600',
      upsert: false,
    });
    if (up.error) throw up.error;
    uploaded.push(path);

    input.onProgress?.('جارٍ حفظ السجل…');
    const row = {
      id,
      patient_id: input.patientId,
      visit_id: input.visitId ?? null,
      examination_id: input.examinationId ?? null,
      modality: input.modality,
      eye: input.eye,
      study_date: input.studyDate,
      device: str(input.device) || null,
      technician: str(input.technician) || null,
      clinical_indication: str(input.clinicalIndication) || null,
      storage_provider: 'supabase',
      storage_path: path,
      thumbnail_path: null,
      file_name: str(file.name) || `study.${ext}`,
      mime_type: file.type || null,
      size_bytes: file.size || null,
      notes: str(input.notes) || null,
      status: 'pending_report' as StudyStatus,
    };

    const { data, error } = await supabase
      .from('medical_images')
      .insert(row)
      .select(STUDY_COLS)
      .single();
    if (error) throw error;

    await audit('create', one<Study>(data), { path });
    return one<Study>(data);
  } catch (e) {
    /* Roll the file back so a failed save leaves nothing behind. */
    if (uploaded.length) {
      try {
        await bucket().remove(uploaded);
      } catch {
        /* the row was never created, so at worst an unreferenced object
           remains; it is not reachable from any patient record */
      }
    }
    throw new Error(reportError(e, 'رفع الصورة'));
  }
}

/* =========================================================================
 * ORDERS (طلب أشعة)
 * ====================================================================== */

export interface OrderInput {
  patientId: string;
  visitId?: string | null;
  doctorId?: string | null;
  clinicId?: string | null;
  orderedOn: string;
  urgency?: Urgency;
  clinicalIndication?: string | null;
  clinicalNotes?: string | null;
  items: Array<{ modality: Modality; eye: Eye; notes?: string | null }>;
}

const MAX_ITEMS = 12;

/**
 * Header then items, because the items need order_id.
 *
 * If the items fail the header is soft-deleted rather than left behind: an
 * order with no studies on it is a blank request form, and a doctor seeing
 * one in the list cannot tell whether it was meant to be empty.
 */
export async function createOrder(input: OrderInput): Promise<ImagingOrder> {
  if (!input.patientId) throw new Error('اختر المريض');
  if (!input.orderedOn) throw new Error('اختر تاريخ الطلب');
  if (input.urgency && !(input.urgency in URGENCY_AR))
    throw new Error('درجة الاستعجال غير معروفة');

  const items = (input.items ?? []).filter((it) => it && it.modality);
  if (!items.length) throw new Error('أضف دراسة واحدة على الأقل');
  if (items.length > MAX_ITEMS) throw new Error('الحد اثنتا عشرة دراسة في الطلب الواحد');

  items.forEach((it, i) => {
    if (!(it.modality in MODALITY_AR))
      throw new Error(`نوع التصوير في البند ${i + 1} غير معروف`);
    if (!it.eye) throw new Error(`حدّد العين في البند ${i + 1}`);
  });

  const head = {
    patient_id: input.patientId,
    visit_id: input.visitId ?? null,
    doctor_id: input.doctorId ?? null,
    clinic_id: input.clinicId ?? null,
    ordered_on: input.orderedOn,
    urgency: input.urgency ?? 'routine',
    clinical_indication: str(input.clinicalIndication) || null,
    clinical_notes: str(input.clinicalNotes) || null,
  };

  const h = await supabase.from('imaging_orders').insert(head).select('*').single();
  if (h.error) throw new Error(reportError(h.error, 'إنشاء الطلب'));

  const orderId = one<{ id: string }>(h.data).id;
  const itemRows = items.map((it, i) => ({
    order_id: orderId,
    seq: i + 1,
    modality: it.modality,
    eye: it.eye,
    notes: str(it.notes) || null,
  }));

  const r = await supabase.from('imaging_order_items').insert(itemRows).select('*');
  if (r.error) {
    try {
      await supabase
        .from('imaging_orders')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', orderId);
    } catch {
      /* the header stays; it carries no items and is filtered from lists */
    }
    throw new Error(reportError(r.error, 'حفظ بنود الطلب'));
  }

  return { ...one<ImagingOrder>(h.data), items: rows<OrderItem>(r.data) };
}

const ORDER_COLS =
  'id, order_no, patient_id, visit_id, doctor_id, clinic_id, ordered_on, ' +
  'urgency, status, clinical_indication, clinical_notes, created_at';

export async function ordersByPatient(patientId: string): Promise<ImagingOrder[]> {
  const { data, error } = await supabase
    .from('imaging_orders')
    .select(ORDER_COLS)
    .eq('patient_id', patientId)
    .is('deleted_at', null)
    .order('ordered_on', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(reportError(error, 'طلبات الأشعة'));

  const orders = rows<ImagingOrder>(data);
  if (!orders.length) return [];

  const { data: items, error: iErr } = await supabase
    .from('imaging_order_items')
    .select('id, order_id, seq, modality, eye, notes, image_id, done')
    .in(
      'order_id',
      orders.map((o) => o.id),
    )
    .order('seq', { ascending: true });

  if (iErr) throw new Error(reportError(iErr, 'بنود الطلب'));

  const byOrder = new Map<string, OrderItem[]>();
  for (const it of rows<OrderItem>(items)) {
    const arr = byOrder.get(it.order_id) ?? [];
    arr.push(it);
    byOrder.set(it.order_id, arr);
  }
  return orders.map((o) => ({ ...o, items: byOrder.get(o.id) ?? [] }));
}

export async function setOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<ImagingOrder> {
  const { data, error } = await supabase
    .from('imaging_orders')
    .update({ status })
    .eq('id', id)
    .select(ORDER_COLS)
    .single();
  if (error) throw new Error(reportError(error, 'حالة الطلب'));
  return one<ImagingOrder>(data);
}

/* -------------------------------------------------------------------- */

function extensionOf(file: File): string {
  const fromName = (file.name ?? '').split('.').pop() ?? '';
  if (fromName && /^[a-z0-9]{1,5}$/i.test(fromName)) return fromName.toLowerCase();
  if (/pdf/i.test(file.type)) return 'pdf';
  if (/png/i.test(file.type)) return 'png';
  if (/webp/i.test(file.type)) return 'webp';
  if (/tiff/i.test(file.type)) return 'tif';
  return 'jpg';
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}
