/* -------------------------------------------------------------------------
 * payments service — reuses iapp.payments, found during the financial-
 * module audit. This table already existed (legacy_id is populated by the
 * v2 migration) but had zero frontend integration until now.
 * -------------------------------------------------------------------------
 * WHAT THIS TABLE ACTUALLY MODELS — read this before extending it
 *
 * iapp.payments is ONE ROW PER PATIENT CHARGE, with a mutable `status`
 * (unpaid → partial → paid → refunded/waived) and a running `amount_paid`.
 * That is a different model from the accounting brief's "every financial
 * event is an immutable, structured transaction; balances are derived,
 * never edited": there is no cashbox/account table, no expense table, no
 * transfer table, and `patient_id` is NOT NULL — non-patient revenue has
 * nowhere to go. A "refund" here can only be represented by mutating the
 * existing row's status/amount_paid, which does NOT preserve "original
 * 500 + refund 200 = net 300" as two separate, auditable rows the way the
 * brief requires.
 *
 * This file deliberately does NOT invent a workaround for that (e.g.
 * encoding a second amount into `notes` as free text) — a financial
 * record that fakes structure it doesn't have is worse than one that
 * admits the gap. `refund()` below is a clearly-labelled best-effort
 * status change only. See the delivery report for the proposed schema
 * (cashboxes, expenses, a real transaction ledger) that would close this
 * gap — it is a proposal, not applied.
 * ---------------------------------------------------------------------- */

import { supabase, rows, maybe, one } from './supabase';
import { reportError } from '../utils/errors';
import type { Enums, TablesInsert, TablesUpdate } from '../types/database.types';

export type PaymentMethod = Enums<{ schema: 'iapp' }, 'payment_method'>;
export type PaymentStatus = Enums<{ schema: 'iapp' }, 'payment_status'>;

export interface PaymentRow {
  id: string;
  patient_id: string;
  visit_id: string | null;
  clinic_id: string | null;
  service_id: string | null;
  amount: number;
  amount_paid: number;
  discount: number;
  currency: string;
  method: PaymentMethod | null;
  status: PaymentStatus;
  receipt_no: string | null;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
}

const COLS =
  'id, patient_id, visit_id, clinic_id, service_id, amount, amount_paid, discount, ' +
  'currency, method, status, receipt_no, notes, paid_at, created_at';

export async function listByPatient(patientId: string): Promise<PaymentRow[]> {
  const { data, error } = await supabase
    .from('payments')
    .select(COLS)
    .eq('patient_id', patientId)
    .is('deleted_at', null)
    .order('paid_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(reportError(error, 'مدفوعات المريض'));
  return rows<PaymentRow>(data);
}

export async function listByVisit(visitId: string): Promise<PaymentRow[]> {
  const { data, error } = await supabase
    .from('payments')
    .select(COLS)
    .eq('visit_id', visitId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error(reportError(error, 'مدفوعات الزيارة'));
  return rows<PaymentRow>(data);
}

export interface PaymentFilter {
  clinicId?: string | null;
  dateFrom?: string; // paid_at >=
  dateTo?: string; // paid_at <=
  method?: PaymentMethod;
  status?: PaymentStatus;
  serviceId?: string;
}

/** For the dashboard/reports — never mixes clinics: pass clinicId to scope
 *  to one, or omit for "All Clinics". */
export async function listByFilter(filter: PaymentFilter): Promise<PaymentRow[]> {
  let q = supabase.from('payments').select(COLS).is('deleted_at', null);
  if (filter.clinicId) q = q.eq('clinic_id', filter.clinicId);
  if (filter.dateFrom) q = q.gte('paid_at', filter.dateFrom);
  if (filter.dateTo) q = q.lte('paid_at', filter.dateTo);
  if (filter.method) q = q.eq('method', filter.method);
  if (filter.status) q = q.eq('status', filter.status);
  if (filter.serviceId) q = q.eq('service_id', filter.serviceId);
  const { data, error } = await q.order('paid_at', { ascending: false }).limit(500);
  if (error) throw new Error(reportError(error, 'قائمة المدفوعات'));
  return rows<PaymentRow>(data);
}

export async function get(id: string): Promise<PaymentRow | null> {
  const { data, error } = await supabase
    .from('payments')
    .select(COLS)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw new Error(reportError(error, 'بيانات الدفعة'));
  return maybe<PaymentRow>(data);
}

async function nextReceiptNo(): Promise<string> {
  // Same pattern as patients.nextPatientCode() — a readable, collision-
  // checked sequence rather than a UUID on the printed receipt. No
  // receipt-numbering RPC/sequence exists in the current schema.
  const { data } = await supabase
    .from('payments')
    .select('receipt_no')
    .not('receipt_no', 'is', null)
    .order('receipt_no', { ascending: false })
    .limit(1);
  const last = data?.[0]?.receipt_no ?? '';
  const m = /^R-(\d+)$/.exec(String(last));
  const n = m ? parseInt(m[1], 10) + 1 : 1;
  return 'R-' + String(n).padStart(5, '0');
}

export interface RecordPaymentInput {
  patientId: string;
  visitId?: string | null;
  clinicId?: string | null;
  serviceId?: string | null;
  amount: number;
  discount?: number;
  method?: PaymentMethod;
  notes?: string | null;
  paidAt?: string; // ISO date, defaults to now
}

/**
 * Records a patient payment. This is an explicit, staff-initiated action
 * only — nothing in the appointment/visit/examination/imaging/follow-up
 * flow calls this automatically anywhere in the codebase.
 */
export async function record(input: RecordPaymentInput): Promise<PaymentRow> {
  if (!input.patientId) throw new Error('المريض مطلوب');
  if (!(input.amount > 0)) throw new Error('المبلغ يجب أن يكون أكبر من صفر');

  const payload: TablesInsert<{ schema: 'iapp' }, 'payments'> = {
    patient_id: input.patientId,
    visit_id: input.visitId ?? null,
    clinic_id: input.clinicId ?? null,
    service_id: input.serviceId ?? null,
    amount: input.amount,
    amount_paid: input.amount,
    discount: input.discount ?? 0,
    method: input.method ?? null,
    status: 'paid',
    notes: input.notes?.trim() || null,
    paid_at: input.paidAt ?? new Date().toISOString(),
    receipt_no: await nextReceiptNo(),
  };

  const { data, error } = await supabase.from('payments').insert(payload).select(COLS).single();
  if (error) throw new Error(reportError(error, 'تسجيل الدفعة'));
  return one<PaymentRow>(data);
}

/**
 * Best-effort refund marker — see the file header. This mutates the
 * ORIGINAL row's status and appends the refund amount/reason to `notes`
 * because there is no separate refund-transaction table or
 * parent_payment_id column to reference. It does NOT give you an
 * auditable "original 500 / refund 200 / net 300" pair of rows. Treat
 * this as a stopgap, not the accounting-grade refund the brief asks for.
 */
export async function markRefunded(
  id: string,
  refundAmount: number,
  reason: string,
): Promise<PaymentRow> {
  if (!reason.trim()) throw new Error('سبب الاسترجاع مطلوب');
  const current = await get(id);
  if (!current) throw new Error('الدفعة غير موجودة');

  const note =
    `استرجاع ${refundAmount} ${current.currency} بتاريخ ${new Date().toISOString().slice(0, 10)} — السبب: ${reason.trim()}` +
    (current.notes ? `\n${current.notes}` : '');

  const payload: TablesUpdate<{ schema: 'iapp' }, 'payments'> = {
    status: 'refunded',
    notes: note,
  };
  const { data, error } = await supabase
    .from('payments')
    .update(payload)
    .eq('id', id)
    .select(COLS)
    .single();
  if (error) throw new Error(reportError(error, 'تسجيل الاسترجاع'));
  return one<PaymentRow>(data);
}

/** Voids a payment (data-entry error) — never a hard delete. */
export async function voidPayment(id: string, reason: string): Promise<PaymentRow> {
  if (!reason.trim()) throw new Error('سبب الإلغاء مطلوب');
  const current = await get(id);
  if (!current) throw new Error('الدفعة غير موجودة');
  const note =
    `ملغاة بتاريخ ${new Date().toISOString().slice(0, 10)} — السبب: ${reason.trim()}` +
    (current.notes ? `\n${current.notes}` : '');
  const payload: TablesUpdate<{ schema: 'iapp' }, 'payments'> = { status: 'waived', notes: note };
  const { data, error } = await supabase
    .from('payments')
    .update(payload)
    .eq('id', id)
    .select(COLS)
    .single();
  if (error) throw new Error(reportError(error, 'إلغاء الدفعة'));
  return one<PaymentRow>(data);
}
