-- مخطط iapp — مُصدَّر في 2026-08-28
-- 549 كائناً. لا تحرّره يدوياً: أعد التصدير بعد أي تغيير في القاعدة.

set check_function_bodies = off;

create schema if not exists iapp;
create extension if not exists btree_gist;
create extension if not exists pg_trgm;

create type iapp.appointment_source as enum ('staff', 'patient_portal', 'guest', 'walk_in');

create type iapp.appointment_status as enum ('REQUESTED', 'PENDING', 'CONFIRMED', 'ARRIVED', 'WAITING', 'IN_CLINIC', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

create type iapp.appointment_status_v1 as enum ('requested', 'confirmed', 'arrived', 'waiting', 'in_room', 'completed', 'cancelled', 'no_show');

create type iapp.diagnosis_status as enum ('active', 'resolved', 'chronic', 'ruled_out');

create type iapp.eye_side as enum ('OD', 'OS', 'OU');

create type iapp.follow_up_status as enum ('pending', 'notified', 'completed', 'missed', 'cancelled');

create type iapp.gender as enum ('male', 'female', 'other', 'unknown');

create type iapp.image_modality as enum ('fundus', 'oct', 'ffa', 'optos', 'topography', 'biometry', 'anterior_segment', 'xray', 'other', 'unknown');

create type iapp.medication_form as enum ('drop', 'ointment', 'tablet', 'capsule', 'injection', 'gel', 'other');

create type iapp.notification_channel as enum ('in_app', 'sms', 'whatsapp', 'email');

create type iapp.notification_status as enum ('pending', 'sent', 'failed', 'read');

create type iapp.payment_method as enum ('cash', 'card', 'transfer', 'insurance', 'other');

create type iapp.payment_status as enum ('unpaid', 'partial', 'paid', 'refunded', 'waived');

create type iapp.refraction_type as enum ('unaided', 'aided', 'cycloplegic', 'final', 'auto');

create type iapp.report_source as enum ('ai', 'doctor', 'external');

create type iapp.visit_type as enum ('routine', 'follow_up', 'retina', 'refraction', 'consultation', 'surgery', 'emergency', 'other');

create sequence if not exists iapp.appointment_status_history_id_seq;

create sequence if not exists iapp.audit_logs_id_seq;

create sequence if not exists iapp.migration_issues_id_seq;

create table if not exists iapp.appointment_status_history (
  id bigint default nextval('iapp.appointment_status_history_id_seq'::regclass) not null,
  appointment_id uuid not null,
  from_status iapp.appointment_status,
  to_status iapp.appointment_status not null,
  actor_id uuid,
  actor_role text,
  reason text,
  occurred_at timestamp with time zone default now() not null
);

create table if not exists iapp.appointment_transitions (
  from_status iapp.appointment_status not null,
  to_status iapp.appointment_status not null,
  allowed_roles text[] not null,
  sets_timestamp text,
  requires_reason boolean default false not null,
  description text
);

create table if not exists iapp.appointments (
  id uuid default gen_random_uuid() not null,
  patient_id uuid,
  guest_name text,
  guest_phone text,
  doctor_id uuid,
  clinic_id uuid not null,
  scheduled_date date not null,
  scheduled_time time without time zone not null,
  duration_minutes smallint default 10 not null,
  slot tsrange generated always as (tsrange((scheduled_date + scheduled_time), ((scheduled_date + scheduled_time) + make_interval(mins => (duration_minutes)::integer)), '[)'::text)) stored,
  status iapp.appointment_status default 'REQUESTED'::iapp.appointment_status not null,
  appointment_type text,
  room text,
  notes text,
  source iapp.appointment_source default 'staff'::iapp.appointment_source not null,
  requested_at timestamp with time zone,
  confirmed_at timestamp with time zone,
  confirmed_by uuid,
  arrived_at timestamp with time zone,
  waiting_at timestamp with time zone,
  in_clinic_at timestamp with time zone,
  completed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  cancelled_by uuid,
  cancel_reason text,
  no_show_at timestamp with time zone,
  rescheduled_from uuid,
  reschedule_count smallint default 0 not null,
  visit_id uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  legacy_id text
);

create table if not exists iapp.audit_logs (
  id bigint default nextval('iapp.audit_logs_id_seq'::regclass) not null,
  occurred_at timestamp with time zone default now() not null,
  actor_id uuid,
  actor_role text,
  patient_id uuid,
  resource text not null,
  record_id uuid,
  action text not null,
  outcome text not null,
  reason text,
  before_data jsonb,
  after_data jsonb,
  row_count integer,
  ip inet,
  user_agent text,
  request_id uuid
) partition by RANGE (occurred_at);

create table if not exists iapp.clinic_schedules (
  id uuid default gen_random_uuid() not null,
  clinic_id uuid not null,
  day_of_week smallint not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  slot_minutes smallint,
  doctor_id uuid,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid
);

create table if not exists iapp.clinics (
  id uuid default gen_random_uuid() not null,
  code text not null,
  name_ar text not null,
  name_en text,
  address text,
  phone text,
  whatsapp text,
  icon text,
  timezone text default 'Africa/Cairo'::text not null,
  slot_minutes smallint default 30 not null,
  notes text,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone
);

create table if not exists iapp.diagnoses (
  id uuid default gen_random_uuid() not null,
  patient_id uuid not null,
  visit_id uuid,
  examination_id uuid,
  doctor_id uuid,
  diagnosis_text text not null,
  icd10_code text,
  eye iapp.eye_side,
  status iapp.diagnosis_status default 'active'::iapp.diagnosis_status not null,
  is_primary boolean default false not null,
  diagnosed_on date default CURRENT_DATE not null,
  resolved_on date,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  legacy_id text
);

create table if not exists iapp.doctors (
  id uuid default gen_random_uuid() not null,
  profile_id uuid,
  full_name_ar text not null,
  full_name_en text,
  short_name text,
  title_ar text,
  initial text,
  license_no text,
  specialty text default 'ophthalmology'::text,
  phone text,
  email text,
  is_primary boolean default false not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  legacy_id text
);

create table if not exists iapp.examinations (
  id uuid default gen_random_uuid() not null,
  patient_id uuid not null,
  visit_id uuid,
  doctor_id uuid,
  exam_date date not null,
  chief_complaint text,
  va_right text,
  va_left text,
  va_right_corrected text,
  va_left_corrected text,
  color_vision text,
  contrast_sensitivity text,
  cover_test text,
  anterior_segment_right text,
  anterior_segment_left text,
  anterior_segment text,
  posterior_segment_right text,
  posterior_segment_left text,
  posterior_segment text,
  treatment_plan text,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  legacy_id text
);

create table if not exists iapp.follow_ups (
  id uuid default gen_random_uuid() not null,
  patient_id uuid not null,
  visit_id uuid,
  examination_id uuid,
  doctor_id uuid,
  clinic_id uuid,
  due_date date not null,
  reason text,
  status iapp.follow_up_status default 'pending'::iapp.follow_up_status not null,
  notified_at timestamp with time zone,
  completed_at timestamp with time zone,
  resulting_appointment_id uuid,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  legacy_id text
);

create table if not exists iapp.image_reports (
  id uuid default gen_random_uuid() not null,
  image_id uuid not null,
  patient_id uuid not null,
  source iapp.report_source default 'ai'::iapp.report_source not null,
  model_name text,
  report_text text not null,
  findings jsonb,
  confidence numeric(4,3),
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  is_approved boolean default false not null,
  consent_recorded boolean default false not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone
);

create table if not exists iapp.iop_measurements (
  id uuid default gen_random_uuid() not null,
  patient_id uuid not null,
  examination_id uuid,
  visit_id uuid,
  measured_at timestamp with time zone default now() not null,
  eye iapp.eye_side not null,
  value_mmhg numeric(4,1) not null,
  method text default 'unknown'::text,
  is_post_dilation boolean default false not null,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  legacy_id text
);

create table if not exists iapp.medical_images (
  id uuid default gen_random_uuid() not null,
  patient_id uuid not null,
  visit_id uuid,
  examination_id uuid,
  modality iapp.image_modality default 'unknown'::iapp.image_modality not null,
  eye iapp.eye_side,
  captured_on date,
  storage_provider text default 'cloudinary'::text not null,
  storage_path text not null,
  legacy_url text,
  file_name text,
  mime_type text,
  size_bytes bigint,
  width integer,
  height integer,
  checksum text,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  legacy_id text
);

create table if not exists iapp.medications (
  id uuid default gen_random_uuid() not null,
  name text not null,
  name_ar text,
  generic_name text,
  form iapp.medication_form default 'other'::iapp.medication_form not null,
  strength text,
  is_custom boolean default false not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid
);

create table if not exists iapp.migration_issues (
  id bigint default nextval('iapp.migration_issues_id_seq'::regclass) not null,
  run_id uuid,
  severity text not null,
  source_key text,
  source_id text,
  field text,
  issue text not null,
  raw_value jsonb
);

create table if not exists iapp.migration_runs (
  id uuid default gen_random_uuid() not null,
  started_at timestamp with time zone default now() not null,
  finished_at timestamp with time zone,
  mode text not null,
  source_hash text,
  stats jsonb,
  errors jsonb,
  notes text
);

create table if not exists iapp.notifications (
  id uuid default gen_random_uuid() not null,
  patient_id uuid,
  profile_id uuid,
  channel iapp.notification_channel default 'in_app'::iapp.notification_channel not null,
  status iapp.notification_status default 'pending'::iapp.notification_status not null,
  title text,
  body text not null,
  payload jsonb,
  related_resource text,
  related_id uuid,
  scheduled_for timestamp with time zone,
  sent_at timestamp with time zone,
  read_at timestamp with time zone,
  error text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid
);

create table if not exists iapp.patients (
  id uuid default gen_random_uuid() not null,
  patient_code text not null,
  full_name text not null,
  date_of_birth date,
  age_at_registration smallint,
  gender iapp.gender default 'unknown'::iapp.gender not null,
  phone text,
  phone_normalized text,
  alt_phone text,
  email text,
  national_id text,
  address text,
  city text,
  occupation text,
  blood_type text,
  allergies text,
  medical_history text,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  primary_clinic_id uuid,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  legacy_id text,
  primary_condition text,
  triage_status text,
  last_visit date
);

create table if not exists iapp.payments (
  id uuid default gen_random_uuid() not null,
  patient_id uuid not null,
  visit_id uuid,
  service_id uuid,
  clinic_id uuid,
  amount numeric(12,2) not null,
  discount numeric(12,2) default 0 not null,
  amount_paid numeric(12,2) default 0 not null,
  currency character(3) default 'EGP'::bpchar not null,
  status iapp.payment_status default 'unpaid'::iapp.payment_status not null,
  method iapp.payment_method,
  paid_at timestamp with time zone,
  receipt_no text,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  legacy_id text
);

create table if not exists iapp.prescription_items (
  id uuid default gen_random_uuid() not null,
  prescription_id uuid not null,
  medication_id uuid,
  free_text text,
  dose text,
  frequency text,
  duration text,
  eye iapp.eye_side,
  instructions text,
  sort_order smallint default 0 not null,
  is_parsed boolean default false not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone
);

create table if not exists iapp.prescriptions (
  id uuid default gen_random_uuid() not null,
  patient_id uuid not null,
  visit_id uuid,
  examination_id uuid,
  doctor_id uuid,
  clinic_id uuid,
  prescribed_on date default CURRENT_DATE not null,
  eye iapp.eye_side,
  is_glasses boolean default false not null,
  notes text,
  legacy_medicines_text text,
  printed_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  legacy_id text
);

create table if not exists iapp.refractions (
  id uuid default gen_random_uuid() not null,
  patient_id uuid not null,
  examination_id uuid,
  visit_id uuid,
  prescription_id uuid,
  measured_on date default CURRENT_DATE not null,
  refraction_type iapp.refraction_type default 'final'::iapp.refraction_type not null,
  eye iapp.eye_side not null,
  sphere numeric(5,2),
  cylinder numeric(5,2),
  axis smallint,
  add_power numeric(4,2),
  prism numeric(4,2),
  base text,
  ipd_mm numeric(4,1),
  va_result text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  legacy_id text
);

create table if not exists iapp.roles (
  id uuid default gen_random_uuid() not null,
  code text not null,
  name_en text not null,
  name_ar text not null,
  description text,
  rank smallint default 100 not null,
  is_system boolean default false not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid
);

create table if not exists iapp.services (
  id uuid default gen_random_uuid() not null,
  code text,
  name_ar text not null,
  name_en text,
  icon text,
  default_price numeric(12,2) default 0 not null,
  currency character(3) default 'EGP'::bpchar not null,
  category text,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  legacy_id text
);

create table if not exists iapp.staff (
  id uuid default gen_random_uuid() not null,
  profile_id uuid,
  clinic_id uuid,
  full_name_ar text not null,
  job_title text,
  phone text,
  email text,
  employee_no text,
  hired_on date,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  legacy_id text
);

create table if not exists iapp.visit_ratings (
  id uuid default gen_random_uuid() not null,
  patient_id uuid,
  visit_id uuid,
  rating smallint not null,
  comment text,
  rated_on date default CURRENT_DATE not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  legacy_id text
);

create table if not exists iapp.visits (
  id uuid default gen_random_uuid() not null,
  patient_id uuid not null,
  clinic_id uuid,
  doctor_id uuid,
  appointment_id uuid,
  visit_date date not null,
  visit_type iapp.visit_type default 'routine'::iapp.visit_type not null,
  chief_complaint text,
  summary text,
  notes text,
  is_locked boolean default false not null,
  locked_at timestamp with time zone,
  locked_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  legacy_id text
);

create table if not exists iapp.audit_logs_2026_08 partition of iapp.audit_logs FOR VALUES FROM ('2026-08-01 00:00:00+00') TO ('2026-09-01 00:00:00+00');

create table if not exists iapp.audit_logs_2026_09 partition of iapp.audit_logs FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');

create table if not exists iapp.audit_logs_2026_10 partition of iapp.audit_logs FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

create table if not exists iapp.audit_logs_default partition of iapp.audit_logs DEFAULT;

alter table iapp.appointment_status_history add constraint appointment_status_history_pkey PRIMARY KEY (id);

alter table iapp.appointment_transitions add constraint appointment_transitions_pkey PRIMARY KEY (from_status, to_status);

alter table iapp.appointments add constraint appointments_duration_minutes_check CHECK (((duration_minutes >= 5) AND (duration_minutes <= 240)));

alter table iapp.appointments add constraint appointments_legacy_id_key UNIQUE (legacy_id);

alter table iapp.appointments add constraint appointments_pkey PRIMARY KEY (id);

alter table iapp.appointments add constraint appointments_visit_id_key UNIQUE (visit_id);

alter table iapp.appointments add constraint chk_cancel_reason CHECK (((status <> 'CANCELLED'::iapp.appointment_status) OR ((cancel_reason IS NOT NULL) AND (length(btrim(cancel_reason)) > 2))));

alter table iapp.appointments add constraint chk_cancelled CHECK (((status = 'CANCELLED'::iapp.appointment_status) = (cancelled_at IS NOT NULL)));

alter table iapp.appointments add constraint chk_completed CHECK (((status = 'COMPLETED'::iapp.appointment_status) = (completed_at IS NOT NULL)));

alter table iapp.appointments add constraint chk_no_show CHECK (((status = 'NO_SHOW'::iapp.appointment_status) = (no_show_at IS NOT NULL)));

alter table iapp.appointments add constraint chk_subject CHECK (((patient_id IS NOT NULL) OR ((guest_name IS NOT NULL) AND (length(btrim(guest_name)) > 1))));

alter table iapp.appointments add constraint chk_time_order CHECK ((((arrived_at IS NULL) OR (confirmed_at IS NULL) OR (arrived_at >= confirmed_at)) AND ((waiting_at IS NULL) OR (arrived_at IS NULL) OR (waiting_at >= arrived_at)) AND ((in_clinic_at IS NULL) OR (waiting_at IS NULL) OR (in_clinic_at >= waiting_at)) AND ((completed_at IS NULL) OR (in_clinic_at IS NULL) OR (completed_at >= in_clinic_at))));

alter table iapp.appointments add constraint excl_clinic_unassigned_double_booking EXCLUDE USING gist (clinic_id WITH =, slot WITH &&) WHERE (((deleted_at IS NULL) AND (doctor_id IS NULL) AND (status <> ALL (ARRAY['CANCELLED'::iapp.appointment_status, 'NO_SHOW'::iapp.appointment_status, 'COMPLETED'::iapp.appointment_status]))));

alter table iapp.appointments add constraint excl_doctor_double_booking EXCLUDE USING gist (doctor_id WITH =, slot WITH &&) WHERE (((deleted_at IS NULL) AND (doctor_id IS NOT NULL) AND (status <> ALL (ARRAY['CANCELLED'::iapp.appointment_status, 'NO_SHOW'::iapp.appointment_status, 'COMPLETED'::iapp.appointment_status]))));

alter table iapp.appointments add constraint excl_patient_double_booking EXCLUDE USING gist (patient_id WITH =, slot WITH &&) WHERE (((deleted_at IS NULL) AND (patient_id IS NOT NULL) AND (status <> ALL (ARRAY['CANCELLED'::iapp.appointment_status, 'NO_SHOW'::iapp.appointment_status, 'COMPLETED'::iapp.appointment_status]))));

alter table iapp.appointments add constraint excl_room_double_booking EXCLUDE USING gist (clinic_id WITH =, room WITH =, slot WITH &&) WHERE (((deleted_at IS NULL) AND (room IS NOT NULL) AND (status <> ALL (ARRAY['CANCELLED'::iapp.appointment_status, 'NO_SHOW'::iapp.appointment_status, 'COMPLETED'::iapp.appointment_status]))));

alter table iapp.audit_logs add constraint audit_logs_action_check CHECK ((action = ANY (ARRAY['read'::text, 'create'::text, 'update'::text, 'delete'::text, 'login'::text, 'logout'::text, 'export'::text, 'print'::text, 'link'::text, 'ai_analyze'::text])));

alter table iapp.audit_logs add constraint audit_logs_outcome_check CHECK ((outcome = ANY (ARRAY['allow'::text, 'deny'::text, 'error'::text])));

alter table iapp.audit_logs add constraint audit_logs_pkey PRIMARY KEY (id, occurred_at);

alter table iapp.clinic_schedules add constraint chk_schedule_window CHECK ((end_time > start_time));

alter table iapp.clinic_schedules add constraint clinic_schedules_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)));

alter table iapp.clinic_schedules add constraint clinic_schedules_pkey PRIMARY KEY (id);

alter table iapp.clinic_schedules add constraint clinic_schedules_slot_minutes_check CHECK (((slot_minutes >= 5) AND (slot_minutes <= 120)));

alter table iapp.clinic_schedules add constraint uq_schedule UNIQUE NULLS NOT DISTINCT (clinic_id, day_of_week, start_time, doctor_id);

alter table iapp.clinics add constraint clinics_code_key UNIQUE (code);

alter table iapp.clinics add constraint clinics_pkey PRIMARY KEY (id);

alter table iapp.clinics add constraint clinics_slot_minutes_check CHECK (((slot_minutes >= 5) AND (slot_minutes <= 120)));

alter table iapp.diagnoses add constraint chk_dx_resolved CHECK (((resolved_on IS NULL) OR (resolved_on >= diagnosed_on)));

alter table iapp.diagnoses add constraint diagnoses_legacy_id_key UNIQUE (legacy_id);

alter table iapp.diagnoses add constraint diagnoses_pkey PRIMARY KEY (id);

alter table iapp.doctors add constraint doctors_legacy_id_key UNIQUE (legacy_id);

alter table iapp.doctors add constraint doctors_license_no_key UNIQUE (license_no);

alter table iapp.doctors add constraint doctors_pkey PRIMARY KEY (id);

alter table iapp.doctors add constraint doctors_profile_id_key UNIQUE (profile_id);

alter table iapp.examinations add constraint examinations_legacy_id_key UNIQUE (legacy_id);

alter table iapp.examinations add constraint examinations_pkey PRIMARY KEY (id);

alter table iapp.follow_ups add constraint follow_ups_pkey PRIMARY KEY (id);

alter table iapp.follow_ups add constraint uq_followup_source UNIQUE (legacy_id, due_date);

alter table iapp.image_reports add constraint chk_report_review CHECK ((is_approved = (reviewed_at IS NOT NULL)));

alter table iapp.image_reports add constraint image_reports_confidence_check CHECK (((confidence >= (0)::numeric) AND (confidence <= (1)::numeric)));

alter table iapp.image_reports add constraint image_reports_pkey PRIMARY KEY (id);

alter table iapp.iop_measurements add constraint iop_measurements_eye_check CHECK ((eye = ANY (ARRAY['OD'::iapp.eye_side, 'OS'::iapp.eye_side])));

alter table iapp.iop_measurements add constraint iop_measurements_pkey PRIMARY KEY (id);

alter table iapp.iop_measurements add constraint iop_measurements_value_mmhg_check CHECK (((value_mmhg >= (0)::numeric) AND (value_mmhg <= (80)::numeric)));

alter table iapp.iop_measurements add constraint uq_iop_legacy UNIQUE (legacy_id, eye);

alter table iapp.medical_images add constraint medical_images_legacy_id_key UNIQUE (legacy_id);

alter table iapp.medical_images add constraint medical_images_pkey PRIMARY KEY (id);

alter table iapp.medical_images add constraint medical_images_size_bytes_check CHECK ((size_bytes >= 0));

alter table iapp.medical_images add constraint medical_images_storage_provider_check CHECK ((storage_provider = ANY (ARRAY['cloudinary'::text, 'supabase'::text, 'external'::text])));

alter table iapp.medical_images add constraint uq_image_storage UNIQUE (storage_provider, storage_path);

alter table iapp.medications add constraint medications_pkey PRIMARY KEY (id);

alter table iapp.medications add constraint uq_medication_name UNIQUE NULLS NOT DISTINCT (name, strength, form);

alter table iapp.migration_issues add constraint migration_issues_pkey PRIMARY KEY (id);

alter table iapp.migration_issues add constraint migration_issues_severity_check CHECK ((severity = ANY (ARRAY['blocker'::text, 'warn'::text, 'info'::text])));

alter table iapp.migration_runs add constraint migration_runs_mode_check CHECK ((mode = ANY (ARRAY['dry_run'::text, 'apply'::text])));

alter table iapp.migration_runs add constraint migration_runs_pkey PRIMARY KEY (id);

alter table iapp.notifications add constraint chk_notif_target CHECK (((patient_id IS NOT NULL) OR (profile_id IS NOT NULL)));

alter table iapp.notifications add constraint notifications_pkey PRIMARY KEY (id);

alter table iapp.patients add constraint patients_age_at_registration_check CHECK (((age_at_registration >= 0) AND (age_at_registration <= 130)));

alter table iapp.patients add constraint patients_blood_type_check CHECK (((blood_type IS NULL) OR (blood_type = ANY (ARRAY['A+'::text, 'A-'::text, 'B+'::text, 'B-'::text, 'AB+'::text, 'AB-'::text, 'O+'::text, 'O-'::text]))));

alter table iapp.patients add constraint patients_date_of_birth_check CHECK ((date_of_birth <= CURRENT_DATE));

alter table iapp.patients add constraint patients_email_check CHECK (((email IS NULL) OR (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text)));

alter table iapp.patients add constraint patients_full_name_check CHECK ((length(btrim(full_name)) > 1));

alter table iapp.patients add constraint patients_legacy_id_key UNIQUE (legacy_id);

alter table iapp.patients add constraint patients_national_id_key UNIQUE (national_id);

alter table iapp.patients add constraint patients_patient_code_check CHECK ((patient_code ~ '^P-[0-9]{4,8}$'::text));

alter table iapp.patients add constraint patients_patient_code_key UNIQUE (patient_code);

alter table iapp.patients add constraint patients_pkey PRIMARY KEY (id);

alter table iapp.payments add constraint chk_pay_not_over CHECK ((amount_paid <= ((amount - discount) + 0.01)));

alter table iapp.payments add constraint chk_pay_status CHECK ((((status = 'paid'::iapp.payment_status) AND (amount_paid >= ((amount - discount) - 0.01))) OR ((status = 'unpaid'::iapp.payment_status) AND (amount_paid = (0)::numeric)) OR (status = ANY (ARRAY['partial'::iapp.payment_status, 'refunded'::iapp.payment_status, 'waived'::iapp.payment_status]))));

alter table iapp.payments add constraint payments_amount_check CHECK ((amount >= (0)::numeric));

alter table iapp.payments add constraint payments_amount_paid_check CHECK ((amount_paid >= (0)::numeric));

alter table iapp.payments add constraint payments_discount_check CHECK ((discount >= (0)::numeric));

alter table iapp.payments add constraint payments_legacy_id_key UNIQUE (legacy_id);

alter table iapp.payments add constraint payments_pkey PRIMARY KEY (id);

alter table iapp.payments add constraint payments_receipt_no_key UNIQUE (receipt_no);

alter table iapp.prescription_items add constraint chk_item_identity CHECK (((medication_id IS NOT NULL) OR (free_text IS NOT NULL)));

alter table iapp.prescription_items add constraint prescription_items_pkey PRIMARY KEY (id);

alter table iapp.prescriptions add constraint prescriptions_legacy_id_key UNIQUE (legacy_id);

alter table iapp.prescriptions add constraint prescriptions_pkey PRIMARY KEY (id);

alter table iapp.refractions add constraint chk_cyl_axis CHECK (((cylinder IS NULL) OR (cylinder = (0)::numeric) OR (axis IS NOT NULL)));

alter table iapp.refractions add constraint refractions_add_power_check CHECK (((add_power >= (0)::numeric) AND (add_power <= (6)::numeric)));

alter table iapp.refractions add constraint refractions_axis_check CHECK (((axis >= 0) AND (axis <= 180)));

alter table iapp.refractions add constraint refractions_cylinder_check CHECK (((cylinder >= ('-15'::integer)::numeric) AND (cylinder <= (15)::numeric)));

alter table iapp.refractions add constraint refractions_eye_check CHECK ((eye = ANY (ARRAY['OD'::iapp.eye_side, 'OS'::iapp.eye_side])));

alter table iapp.refractions add constraint refractions_ipd_mm_check CHECK (((ipd_mm >= (40)::numeric) AND (ipd_mm <= (85)::numeric)));

alter table iapp.refractions add constraint refractions_pkey PRIMARY KEY (id);

alter table iapp.refractions add constraint refractions_sphere_check CHECK (((sphere >= ('-30'::integer)::numeric) AND (sphere <= (30)::numeric)));

alter table iapp.refractions add constraint uq_refraction_legacy UNIQUE (legacy_id, eye);

alter table iapp.roles add constraint roles_code_check CHECK ((code ~ '^[a-z_]{3,32}$'::text));

alter table iapp.roles add constraint roles_code_key UNIQUE (code);

alter table iapp.roles add constraint roles_pkey PRIMARY KEY (id);

alter table iapp.services add constraint services_code_key UNIQUE (code);

alter table iapp.services add constraint services_default_price_check CHECK ((default_price >= (0)::numeric));

alter table iapp.services add constraint services_legacy_id_key UNIQUE (legacy_id);

alter table iapp.services add constraint services_pkey PRIMARY KEY (id);

alter table iapp.staff add constraint staff_employee_no_key UNIQUE (employee_no);

alter table iapp.staff add constraint staff_legacy_id_key UNIQUE (legacy_id);

alter table iapp.staff add constraint staff_pkey PRIMARY KEY (id);

alter table iapp.staff add constraint staff_profile_id_key UNIQUE (profile_id);

alter table iapp.visit_ratings add constraint uq_rating_per_visit UNIQUE (visit_id, patient_id);

alter table iapp.visit_ratings add constraint visit_ratings_legacy_id_key UNIQUE (legacy_id);

alter table iapp.visit_ratings add constraint visit_ratings_pkey PRIMARY KEY (id);

alter table iapp.visit_ratings add constraint visit_ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)));

alter table iapp.visits add constraint chk_visit_date_sane CHECK (((visit_date >= '2000-01-01'::date) AND (visit_date <= (CURRENT_DATE + 1)))) NOT VALID;

alter table iapp.visits add constraint chk_visit_lock CHECK ((is_locked = (locked_at IS NOT NULL)));

alter table iapp.visits add constraint visits_appointment_id_key UNIQUE (appointment_id);

alter table iapp.visits add constraint visits_legacy_id_key UNIQUE (legacy_id);

alter table iapp.visits add constraint visits_pkey PRIMARY KEY (id);

alter table iapp.appointment_status_history add constraint appointment_status_history_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.appointment_status_history add constraint appointment_status_history_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES iapp.appointments(id) ON DELETE CASCADE;

alter table iapp.appointments add constraint appointments_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.appointments add constraint appointments_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES iapp.clinics(id) ON DELETE RESTRICT;

alter table iapp.appointments add constraint appointments_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.appointments add constraint appointments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.appointments add constraint appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES iapp.doctors(id) ON DELETE RESTRICT;

alter table iapp.appointments add constraint appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES iapp.patients(id) ON DELETE RESTRICT;

alter table iapp.appointments add constraint appointments_rescheduled_from_fkey FOREIGN KEY (rescheduled_from) REFERENCES iapp.appointments(id) ON DELETE SET NULL;

alter table iapp.appointments add constraint appointments_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.appointments add constraint appointments_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES iapp.visits(id) ON DELETE SET NULL;

alter table iapp.audit_logs add constraint audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.clinic_schedules add constraint clinic_schedules_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES iapp.clinics(id) ON DELETE CASCADE;

alter table iapp.clinic_schedules add constraint clinic_schedules_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.clinic_schedules add constraint clinic_schedules_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.clinic_schedules add constraint fk_schedule_doctor FOREIGN KEY (doctor_id) REFERENCES iapp.doctors(id) ON DELETE SET NULL;

alter table iapp.clinics add constraint clinics_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.clinics add constraint clinics_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.diagnoses add constraint diagnoses_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.diagnoses add constraint diagnoses_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES iapp.doctors(id) ON DELETE SET NULL;

alter table iapp.diagnoses add constraint diagnoses_examination_id_fkey FOREIGN KEY (examination_id) REFERENCES iapp.examinations(id) ON DELETE SET NULL;

alter table iapp.diagnoses add constraint diagnoses_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES iapp.patients(id) ON DELETE RESTRICT;

alter table iapp.diagnoses add constraint diagnoses_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.diagnoses add constraint diagnoses_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES iapp.visits(id) ON DELETE SET NULL;

alter table iapp.doctors add constraint doctors_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.doctors add constraint doctors_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL;

alter table iapp.doctors add constraint doctors_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.examinations add constraint examinations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.examinations add constraint examinations_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES iapp.doctors(id) ON DELETE SET NULL;

alter table iapp.examinations add constraint examinations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES iapp.patients(id) ON DELETE RESTRICT;

alter table iapp.examinations add constraint examinations_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.examinations add constraint examinations_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES iapp.visits(id) ON DELETE SET NULL;

alter table iapp.follow_ups add constraint follow_ups_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES iapp.clinics(id) ON DELETE SET NULL;

alter table iapp.follow_ups add constraint follow_ups_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.follow_ups add constraint follow_ups_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES iapp.doctors(id) ON DELETE SET NULL;

alter table iapp.follow_ups add constraint follow_ups_examination_id_fkey FOREIGN KEY (examination_id) REFERENCES iapp.examinations(id) ON DELETE SET NULL;

alter table iapp.follow_ups add constraint follow_ups_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES iapp.patients(id) ON DELETE RESTRICT;

alter table iapp.follow_ups add constraint follow_ups_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.follow_ups add constraint follow_ups_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES iapp.visits(id) ON DELETE SET NULL;

alter table iapp.image_reports add constraint image_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.image_reports add constraint image_reports_image_id_fkey FOREIGN KEY (image_id) REFERENCES iapp.medical_images(id) ON DELETE CASCADE;

alter table iapp.image_reports add constraint image_reports_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES iapp.patients(id) ON DELETE RESTRICT;

alter table iapp.image_reports add constraint image_reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES iapp.doctors(id) ON DELETE SET NULL;

alter table iapp.image_reports add constraint image_reports_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.iop_measurements add constraint iop_measurements_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.iop_measurements add constraint iop_measurements_examination_id_fkey FOREIGN KEY (examination_id) REFERENCES iapp.examinations(id) ON DELETE SET NULL;

alter table iapp.iop_measurements add constraint iop_measurements_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES iapp.patients(id) ON DELETE RESTRICT;

alter table iapp.iop_measurements add constraint iop_measurements_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.iop_measurements add constraint iop_measurements_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES iapp.visits(id) ON DELETE SET NULL;

alter table iapp.medical_images add constraint medical_images_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.medical_images add constraint medical_images_examination_id_fkey FOREIGN KEY (examination_id) REFERENCES iapp.examinations(id) ON DELETE SET NULL;

alter table iapp.medical_images add constraint medical_images_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES iapp.patients(id) ON DELETE RESTRICT;

alter table iapp.medical_images add constraint medical_images_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.medical_images add constraint medical_images_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES iapp.visits(id) ON DELETE SET NULL;

alter table iapp.medications add constraint medications_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.medications add constraint medications_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.migration_issues add constraint migration_issues_run_id_fkey FOREIGN KEY (run_id) REFERENCES iapp.migration_runs(id) ON DELETE CASCADE;

alter table iapp.notifications add constraint notifications_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.notifications add constraint notifications_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES iapp.patients(id) ON DELETE CASCADE;

alter table iapp.notifications add constraint notifications_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table iapp.notifications add constraint notifications_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.patients add constraint patients_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.patients add constraint patients_primary_clinic_id_fkey FOREIGN KEY (primary_clinic_id) REFERENCES iapp.clinics(id) ON DELETE SET NULL;

alter table iapp.patients add constraint patients_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.payments add constraint payments_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES iapp.clinics(id) ON DELETE SET NULL;

alter table iapp.payments add constraint payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.payments add constraint payments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES iapp.patients(id) ON DELETE RESTRICT;

alter table iapp.payments add constraint payments_service_id_fkey FOREIGN KEY (service_id) REFERENCES iapp.services(id) ON DELETE SET NULL;

alter table iapp.payments add constraint payments_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.payments add constraint payments_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES iapp.visits(id) ON DELETE SET NULL;

alter table iapp.prescription_items add constraint prescription_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.prescription_items add constraint prescription_items_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES iapp.medications(id) ON DELETE SET NULL;

alter table iapp.prescription_items add constraint prescription_items_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES iapp.prescriptions(id) ON DELETE CASCADE;

alter table iapp.prescription_items add constraint prescription_items_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.prescriptions add constraint prescriptions_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES iapp.clinics(id) ON DELETE SET NULL;

alter table iapp.prescriptions add constraint prescriptions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.prescriptions add constraint prescriptions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES iapp.doctors(id) ON DELETE SET NULL;

alter table iapp.prescriptions add constraint prescriptions_examination_id_fkey FOREIGN KEY (examination_id) REFERENCES iapp.examinations(id) ON DELETE SET NULL;

alter table iapp.prescriptions add constraint prescriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES iapp.patients(id) ON DELETE RESTRICT;

alter table iapp.prescriptions add constraint prescriptions_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.prescriptions add constraint prescriptions_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES iapp.visits(id) ON DELETE SET NULL;

alter table iapp.refractions add constraint fk_refraction_prescription FOREIGN KEY (prescription_id) REFERENCES iapp.prescriptions(id) ON DELETE SET NULL;

alter table iapp.refractions add constraint refractions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.refractions add constraint refractions_examination_id_fkey FOREIGN KEY (examination_id) REFERENCES iapp.examinations(id) ON DELETE SET NULL;

alter table iapp.refractions add constraint refractions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES iapp.patients(id) ON DELETE RESTRICT;

alter table iapp.refractions add constraint refractions_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.refractions add constraint refractions_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES iapp.visits(id) ON DELETE SET NULL;

alter table iapp.roles add constraint roles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.roles add constraint roles_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.services add constraint services_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.services add constraint services_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.staff add constraint staff_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES iapp.clinics(id) ON DELETE SET NULL;

alter table iapp.staff add constraint staff_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.staff add constraint staff_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL;

alter table iapp.staff add constraint staff_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.visit_ratings add constraint visit_ratings_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.visit_ratings add constraint visit_ratings_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES iapp.patients(id) ON DELETE SET NULL;

alter table iapp.visit_ratings add constraint visit_ratings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.visit_ratings add constraint visit_ratings_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES iapp.visits(id) ON DELETE SET NULL;

alter table iapp.visits add constraint visits_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES iapp.clinics(id) ON DELETE SET NULL;

alter table iapp.visits add constraint visits_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.visits add constraint visits_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES iapp.doctors(id) ON DELETE SET NULL;

alter table iapp.visits add constraint visits_locked_by_fkey FOREIGN KEY (locked_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table iapp.visits add constraint visits_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES iapp.patients(id) ON DELETE RESTRICT;

alter table iapp.visits add constraint visits_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_apt_day_board ON iapp.appointments USING btree (clinic_id, scheduled_date, scheduled_time) WHERE (deleted_at IS NULL);

CREATE INDEX idx_apt_doctor_day ON iapp.appointments USING btree (doctor_id, scheduled_date, scheduled_time) WHERE (deleted_at IS NULL);

CREATE INDEX idx_apt_history ON iapp.appointment_status_history USING btree (appointment_id, occurred_at DESC);

CREATE INDEX idx_apt_inbox ON iapp.appointments USING btree (clinic_id, created_at DESC) WHERE ((deleted_at IS NULL) AND (status = ANY (ARRAY['REQUESTED'::iapp.appointment_status, 'PENDING'::iapp.appointment_status])));

CREATE INDEX idx_apt_live ON iapp.appointments USING btree (clinic_id, scheduled_date, status) WHERE ((deleted_at IS NULL) AND (status = ANY (ARRAY['ARRIVED'::iapp.appointment_status, 'WAITING'::iapp.appointment_status, 'IN_CLINIC'::iapp.appointment_status])));

CREATE INDEX idx_apt_patient ON iapp.appointments USING btree (patient_id, scheduled_date DESC) WHERE (deleted_at IS NULL);

CREATE INDEX idx_apt_slot_gist ON iapp.appointments USING gist (slot) WHERE (deleted_at IS NULL);

CREATE INDEX idx_audit_actor ON ONLY iapp.audit_logs USING btree (actor_id, occurred_at DESC);

CREATE INDEX idx_audit_deny ON ONLY iapp.audit_logs USING btree (occurred_at DESC) WHERE (outcome = 'deny'::text);

CREATE INDEX idx_audit_patient ON ONLY iapp.audit_logs USING btree (patient_id, occurred_at DESC);

CREATE INDEX idx_audit_resource ON ONLY iapp.audit_logs USING btree (resource, record_id, occurred_at DESC);

CREATE INDEX idx_audit_time ON ONLY iapp.audit_logs USING btree (occurred_at DESC);

CREATE INDEX idx_doctors_active ON iapp.doctors USING btree (is_active) WHERE (deleted_at IS NULL);

CREATE INDEX idx_doctors_profile ON iapp.doctors USING btree (profile_id);

CREATE INDEX idx_dx_active ON iapp.diagnoses USING btree (patient_id) WHERE ((deleted_at IS NULL) AND (status = 'active'::iapp.diagnosis_status));

CREATE INDEX idx_dx_patient ON iapp.diagnoses USING btree (patient_id, diagnosed_on DESC) WHERE (deleted_at IS NULL);

CREATE INDEX idx_dx_text_trgm ON iapp.diagnoses USING gin (diagnosis_text gin_trgm_ops) WHERE (deleted_at IS NULL);

CREATE INDEX idx_exams_patient_date ON iapp.examinations USING btree (patient_id, exam_date DESC) WHERE (deleted_at IS NULL);

CREATE INDEX idx_exams_visit ON iapp.examinations USING btree (visit_id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_fu_due_pending ON iapp.follow_ups USING btree (due_date) WHERE ((deleted_at IS NULL) AND (status = 'pending'::iapp.follow_up_status));

CREATE INDEX idx_fu_patient ON iapp.follow_ups USING btree (patient_id, due_date DESC) WHERE (deleted_at IS NULL);

CREATE INDEX idx_img_patient ON iapp.medical_images USING btree (patient_id, captured_on DESC) WHERE (deleted_at IS NULL);

CREATE INDEX idx_img_reports ON iapp.image_reports USING btree (image_id, created_at DESC) WHERE (deleted_at IS NULL);

CREATE INDEX idx_img_reports_pending ON iapp.image_reports USING btree (created_at DESC) WHERE ((deleted_at IS NULL) AND (NOT is_approved));

CREATE INDEX idx_img_visit ON iapp.medical_images USING btree (visit_id);

CREATE INDEX idx_iop_elevated ON iapp.iop_measurements USING btree (patient_id, measured_at DESC) WHERE ((deleted_at IS NULL) AND (value_mmhg >= (21)::numeric));

CREATE INDEX idx_iop_patient ON iapp.iop_measurements USING btree (patient_id, measured_at DESC) WHERE (deleted_at IS NULL);

CREATE INDEX idx_meds_name_trgm ON iapp.medications USING gin (name gin_trgm_ops) WHERE is_active;

CREATE INDEX idx_notif_patient ON iapp.notifications USING btree (patient_id, created_at DESC);

CREATE INDEX idx_notif_pending ON iapp.notifications USING btree (scheduled_for) WHERE (status = 'pending'::iapp.notification_status);

CREATE INDEX idx_notif_unread ON iapp.notifications USING btree (profile_id) WHERE (status <> 'read'::iapp.notification_status);

CREATE INDEX idx_patients_clinic ON iapp.patients USING btree (primary_clinic_id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_patients_code ON iapp.patients USING btree (patient_code) WHERE (deleted_at IS NULL);

CREATE INDEX idx_patients_created ON iapp.patients USING btree (created_at DESC);

CREATE INDEX idx_patients_legacy ON iapp.patients USING btree (legacy_id);

CREATE INDEX idx_patients_name_trgm ON iapp.patients USING gin (full_name gin_trgm_ops) WHERE (deleted_at IS NULL);

CREATE INDEX idx_patients_phone ON iapp.patients USING btree (phone_normalized) WHERE (deleted_at IS NULL);

CREATE INDEX idx_patients_phone_active ON iapp.patients USING btree (phone_normalized) WHERE ((deleted_at IS NULL) AND is_active);

CREATE INDEX idx_pay_outstanding ON iapp.payments USING btree (patient_id) WHERE ((deleted_at IS NULL) AND (status = ANY (ARRAY['unpaid'::iapp.payment_status, 'partial'::iapp.payment_status])));

CREATE INDEX idx_pay_paid_at ON iapp.payments USING btree (clinic_id, paid_at) WHERE ((deleted_at IS NULL) AND (status = 'paid'::iapp.payment_status));

CREATE INDEX idx_pay_patient ON iapp.payments USING btree (patient_id, created_at DESC) WHERE (deleted_at IS NULL);

CREATE INDEX idx_pay_visit ON iapp.payments USING btree (visit_id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_refr_exam ON iapp.refractions USING btree (examination_id);

CREATE INDEX idx_refr_patient ON iapp.refractions USING btree (patient_id, measured_on DESC) WHERE (deleted_at IS NULL);

CREATE INDEX idx_refr_prescription ON iapp.refractions USING btree (prescription_id);

CREATE INDEX idx_rx_items ON iapp.prescription_items USING btree (prescription_id, sort_order) WHERE (deleted_at IS NULL);

CREATE INDEX idx_rx_items_unparsed ON iapp.prescription_items USING btree (prescription_id) WHERE ((deleted_at IS NULL) AND (NOT is_parsed));

CREATE INDEX idx_rx_patient_date ON iapp.prescriptions USING btree (patient_id, prescribed_on DESC) WHERE (deleted_at IS NULL);

CREATE INDEX idx_rx_visit ON iapp.prescriptions USING btree (visit_id);

CREATE INDEX idx_sched_clinic_day ON iapp.clinic_schedules USING btree (clinic_id, day_of_week) WHERE is_active;

CREATE INDEX idx_staff_clinic ON iapp.staff USING btree (clinic_id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_visits_clinic_date ON iapp.visits USING btree (clinic_id, visit_date) WHERE (deleted_at IS NULL);

CREATE INDEX idx_visits_date ON iapp.visits USING btree (visit_date DESC) WHERE (deleted_at IS NULL);

CREATE INDEX idx_visits_doctor_date ON iapp.visits USING btree (doctor_id, visit_date DESC) WHERE (deleted_at IS NULL);

CREATE INDEX idx_visits_patient_date ON iapp.visits USING btree (patient_id, visit_date DESC) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX uq_doctor_primary ON iapp.doctors USING btree (is_primary) WHERE (is_primary AND (deleted_at IS NULL));

CREATE OR REPLACE FUNCTION iapp.acting_role()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iapp'
AS $function$
declare v text;
begin
  select role::text into v from public.profiles
   where id = auth.uid() and is_active;
  if v is null then
    -- Local/service context (psql, Edge Function service_role, tests).
    v := nullif(current_setting('iapp.test_role', true), '');
  end if;
  if v is null then
    raise exception 'no_identity: caller has no active profile' using errcode='42501';
  end if;
  return v;
end $function$
;

CREATE OR REPLACE FUNCTION iapp.available_slots(p_clinic_id uuid, p_date date, p_doctor_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(slot_time time without time zone, is_free boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'iapp', 'public'
AS $function$
  with sched as (
    select s.start_time, s.end_time, coalesce(s.slot_minutes, c.slot_minutes, 30) as mins
    from iapp.clinic_schedules s
    join iapp.clinics c on c.id = s.clinic_id
    where s.clinic_id = p_clinic_id and s.is_active
      and s.day_of_week = extract(dow from p_date)
      and (p_doctor_id is null or s.doctor_id is null or s.doctor_id = p_doctor_id)
  ),
  slots as (
    select (start_time + make_interval(mins => (n * mins)))::time as t, mins
    from sched,
         generate_series(0, greatest(
           floor(extract(epoch from (end_time - start_time)) / 60 / mins)::int - 1, 0)) n
  )
  select s.t,
         not exists (
           select 1 from iapp.appointments a
           where a.clinic_id = p_clinic_id and a.scheduled_date = p_date
             and a.deleted_at is null
             and a.status not in ('CANCELLED','NO_SHOW')
             and (p_doctor_id is null or a.doctor_id = p_doctor_id)
             and a.slot && tsrange(p_date + s.t,
                                   p_date + s.t + make_interval(mins => s.mins), '[)')
         )
  from slots s order by s.t
$function$
;

CREATE OR REPLACE FUNCTION iapp.block_audit_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin raise exception 'iapp.audit_logs is append-only'; end $function$
;

CREATE OR REPLACE FUNCTION iapp.book_appointment(p_clinic_id uuid, p_date date, p_time time without time zone, p_patient_id uuid DEFAULT NULL::uuid, p_doctor_id uuid DEFAULT NULL::uuid, p_type text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_room text DEFAULT NULL::text, p_duration smallint DEFAULT NULL::smallint, p_guest_name text DEFAULT NULL::text, p_guest_phone text DEFAULT NULL::text)
 RETURNS iapp.appointments
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iapp', 'public'
AS $function$
declare
  v_role    text := iapp.acting_role();
  v_status  iapp.appointment_status;
  v_source  iapp.appointment_source;
  v_patient uuid := p_patient_id;
  v_doctor  uuid := p_doctor_id;
  v_dur     smallint;
  v_row     iapp.appointments;
begin
  if p_date < current_date then
    raise exception 'past_date: cannot book an appointment in the past' using errcode='23514';
  end if;

  select coalesce(p_duration, c.slot_minutes, 10) into v_dur
    from iapp.clinics c where c.id = p_clinic_id;
  v_dur := coalesce(v_dur, 10);

  -- بلا طبيب محدد: خذ الطبيب الرئيسي، حتى ينطبق قيد منع الحجز المزدوج
  if v_doctor is null then
    select id into v_doctor from iapp.doctors
     where is_primary and deleted_at is null and is_active limit 1;
  end if;

  if v_role = 'patient' then
    v_patient := iapp.my_patient_id();
    if v_patient is null then
      raise exception 'no_patient_link: this account is not linked to a patient record'
        using errcode='42501';
    end if;
    v_status := 'REQUESTED';
    v_source := 'patient_portal';
    p_room   := null;
  elsif v_role in ('secretary','doctor','admin') then
    v_status := 'CONFIRMED';
    v_source := 'staff';
  else
    raise exception 'forbidden: role % may not book', v_role using errcode='42501';
  end if;

  if v_patient is null and coalesce(btrim(p_guest_name),'') = '' then
    raise exception 'no_subject: provide a patient or a guest name' using errcode='23514';
  end if;

  perform set_config('iapp.acting_role', v_role, true);

  insert into iapp.appointments(
    patient_id, guest_name, guest_phone, doctor_id, clinic_id,
    scheduled_date, scheduled_time, duration_minutes,
    status, source, appointment_type, notes, room, created_by)
  values (
    v_patient, nullif(btrim(p_guest_name),''), nullif(btrim(p_guest_phone),''),
    v_doctor, p_clinic_id, p_date, p_time, v_dur,
    v_status, v_source, p_type, p_notes, p_room, auth.uid())
  returning * into v_row;

  return v_row;

exception
  when exclusion_violation then
    raise exception 'slot_taken: that time is already booked' using errcode='23P01';
end $function$
;

CREATE OR REPLACE FUNCTION iapp.call_patient(p_id uuid)
 RETURNS iapp.appointments
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'iapp', 'public'
AS $function$
  select iapp.transition(p_id, 'IN_CLINIC') $function$
;

CREATE OR REPLACE FUNCTION iapp.cancel_appointment(p_id uuid, p_reason text)
 RETURNS iapp.appointments
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'iapp', 'public'
AS $function$
  select iapp.transition(p_id, 'CANCELLED', p_reason) $function$
;

CREATE OR REPLACE FUNCTION iapp.check_same_patient()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare v_patient uuid;
begin
  if new.visit_id is not null then
    select patient_id into v_patient from iapp.visits where id = new.visit_id;
    if v_patient is not null and v_patient <> new.patient_id then
      raise exception 'patient_mismatch: % belongs to patient %, visit belongs to %',
        tg_table_name, new.patient_id, v_patient;
    end if;
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION iapp.claim_patient_record(p_code text, p_phone text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iapp', 'public'
AS $function$
declare
  v_uid   uuid := auth.uid();
  v_pat   iapp.patients;
  v_tries int;
  v_taken uuid;
begin
  if v_uid is null then
    raise exception 'unauthenticated: سجّل الدخول أولاً' using errcode='42501';
  end if;

  -- حد المحاولات: يمنع تخمين الأكواد المتسلسلة
  select count(*) into v_tries from public.auth_events
   where identifier = 'claim:'||v_uid::text
     and occurred_at > now() - interval '1 hour';
  if v_tries >= 5 then
    raise exception 'rate_limited: محاولات كثيرة — انتظر ساعة' using errcode='42501';
  end if;

  insert into public.auth_events(identifier, event)
  values ('claim:'||v_uid::text, 'login_fail');

  -- مرتبط بالفعل؟
  if exists (select 1 from public.patient_links where user_id = v_uid and verified) then
    return jsonb_build_object('ok', true, 'already', true);
  end if;

  -- المطابقة: الكود والهاتف معًا، وإلا لا شيء
  select * into v_pat from iapp.patients
   where upper(btrim(patient_code)) = upper(btrim(p_code))
     and iapp.normalize_phone_txt(phone) = iapp.normalize_phone_txt(p_phone)
     and deleted_at is null and is_active
   limit 1;

  if not found then
    -- رسالة واحدة للحالتين: لا نكشف أي الحقلين كان خاطئًا
    raise exception 'no_match: الكود أو رقم الهاتف غير صحيح' using errcode='P0002';
  end if;

  -- الملف مرتبط بحساب آخر؟
  select user_id into v_taken from public.patient_links
   where patient_id = v_pat.id::text;
  if v_taken is not null and v_taken <> v_uid then
    raise exception 'already_linked: هذا الملف مرتبط بحساب آخر — تواصل مع العيادة'
      using errcode='42501';
  end if;

  insert into public.patient_links(user_id, patient_id, verified, verified_at, method)
  values (v_uid, v_pat.id::text, true, now(), 'staff_issued')
  on conflict (user_id) do update
    set patient_id = excluded.patient_id, verified = true, verified_at = now();

  update public.profiles
     set full_name = coalesce(full_name, v_pat.full_name),
         phone     = coalesce(phone, v_pat.phone),
         last_login_at = now()
   where id = v_uid;

  insert into public.auth_events(identifier, event)
  values ('claim:'||v_uid::text, 'login_ok');

  return jsonb_build_object('ok', true, 'patient_id', v_pat.id,
                            'name', v_pat.full_name, 'code', v_pat.patient_code);
end $function$
;

CREATE OR REPLACE FUNCTION iapp.complete_appointment(p_id uuid, p_visit_id uuid DEFAULT NULL::uuid)
 RETURNS iapp.appointments
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iapp', 'public'
AS $function$
declare v_row iapp.appointments;
begin
  v_row := iapp.transition(p_id, 'COMPLETED');
  if p_visit_id is not null then
    update iapp.appointments set visit_id = p_visit_id
     where id = p_id returning * into v_row;
  end if;
  return v_row;
end $function$
;

CREATE OR REPLACE FUNCTION iapp.confirm_appointment(p_id uuid)
 RETURNS iapp.appointments
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'iapp', 'public'
AS $function$
  select iapp.transition(p_id, 'CONFIRMED') $function$
;

CREATE OR REPLACE FUNCTION iapp.current_patient_uuid()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'iapp', 'public'
AS $function$
  select p.id
  from public.patient_links pl
  join iapp.patients p on p.legacy_id = pl.patient_id or p.id::text = pl.patient_id
  where pl.user_id = auth.uid() and pl.verified and p.deleted_at is null
$function$
;

CREATE OR REPLACE FUNCTION iapp.is_doctor()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((select role in ('doctor','admin') from public.profiles
                   where id = auth.uid() and is_active), false)
$function$
;

CREATE OR REPLACE FUNCTION iapp.is_secretary()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((select role = 'secretary' from public.profiles
                   where id = auth.uid() and is_active), false)
$function$
;

CREATE OR REPLACE FUNCTION iapp.log_appointment_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into iapp.appointment_status_history
      (appointment_id, from_status, to_status, actor_id, actor_role, reason)
    values (new.id,
            case when tg_op='UPDATE' then old.status end,
            new.status, auth.uid(),
            nullif(current_setting('iapp.acting_role', true), ''),
            new.cancel_reason);
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION iapp.mark_arrived(p_id uuid)
 RETURNS iapp.appointments
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'iapp', 'public'
AS $function$
  select iapp.transition(p_id, 'ARRIVED') $function$
;

CREATE OR REPLACE FUNCTION iapp.mark_no_show(p_id uuid)
 RETURNS iapp.appointments
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'iapp', 'public'
AS $function$
  select iapp.transition(p_id, 'NO_SHOW') $function$
;

CREATE OR REPLACE FUNCTION iapp.mark_waiting(p_id uuid)
 RETURNS iapp.appointments
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'iapp', 'public'
AS $function$
  select iapp.transition(p_id, 'WAITING') $function$
;

CREATE OR REPLACE FUNCTION iapp.my_clinic_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'iapp', 'public'
AS $function$
  -- الطبيب والمدير: كل العيادات
  select c.id from iapp.clinics c
   where public.is_admin() or iapp.is_doctor()
  union
  -- الموظف المُسند لعيادة: عيادته فقط
  select s.clinic_id from iapp.staff s
   where s.profile_id = auth.uid()
     and s.clinic_id is not null
     and s.deleted_at is null
  union
  -- موظف بلا إسناد: كل العيادات النشطة (وضع العيادة الواحدة)
  select c.id from iapp.clinics c
   where c.is_active and c.deleted_at is null
     and iapp.is_secretary()
     and not exists (
       select 1 from iapp.staff s2
        where s2.profile_id = auth.uid()
          and s2.clinic_id is not null
          and s2.deleted_at is null)
$function$
;

CREATE OR REPLACE FUNCTION iapp.my_link_status()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'iapp', 'public'
AS $function$
  select coalesce(
    (select jsonb_build_object('linked', true, 'patient_id', p.id,
                               'name', p.full_name, 'code', p.patient_code)
       from public.patient_links pl
       join iapp.patients p on p.id::text = pl.patient_id
      where pl.user_id = auth.uid() and pl.verified and p.deleted_at is null),
    jsonb_build_object('linked', false))
$function$
;

CREATE OR REPLACE FUNCTION iapp.my_patient_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iapp'
AS $function$
  select p.id from public.patient_links pl
  join iapp.patients p
    on p.id::text = pl.patient_id or p.legacy_id = pl.patient_id
  where pl.user_id = auth.uid() and pl.verified and p.deleted_at is null
$function$
;

CREATE OR REPLACE FUNCTION iapp.normalize_phone_txt(p text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case
    when p is null or btrim(p)='' then null
    else (
      with d as (select regexp_replace(p,'[^0-9]','','g') x)
      select case
        when x ~ '^20[0-9]{10}$' then '0'||substring(x from 3)
        when x ~ '^[0-9]{10}$'   then '0'||x
        else x end from d)
  end
$function$
;

CREATE OR REPLACE FUNCTION iapp.normalize_phone(p text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case
    when p is null or btrim(p) = '' then null
    else
      case
        when regexp_replace(p, '[^0-9]', '', 'g') ~ '^20[0-9]{10}$'
          then '0' || substring(regexp_replace(p, '[^0-9]', '', 'g') from 3)
        when regexp_replace(p, '[^0-9]', '', 'g') ~ '^[0-9]{10}$'
          then '0' || regexp_replace(p, '[^0-9]', '', 'g')
        else regexp_replace(p, '[^0-9]', '', 'g')
      end
  end
$function$
;

CREATE OR REPLACE FUNCTION iapp.notify_appointment_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    perform pg_notify('iapp_appointments', json_build_object(
      'id',         new.id,
      'clinic_id',  new.clinic_id,
      'patient_id', new.patient_id,
      'doctor_id',  new.doctor_id,
      'date',       new.scheduled_date,
      'from',       case when tg_op='UPDATE' then old.status end,
      'to',         new.status
    )::text);
  end if;
  return null;
end $function$
;

CREATE OR REPLACE FUNCTION iapp.reschedule_appointment(p_id uuid, p_new_date date, p_new_time time without time zone, p_reason text DEFAULT 'إعادة جدولة'::text, p_new_doctor_id uuid DEFAULT NULL::uuid, p_new_room text DEFAULT NULL::text)
 RETURNS iapp.appointments
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iapp', 'public'
AS $function$
declare
  v_role text := iapp.acting_role();
  v_old  iapp.appointments;
  v_new  iapp.appointments;
  v_mine uuid;
begin
  select * into v_old from iapp.appointments
   where id = p_id and deleted_at is null for update;
  if not found then
    raise exception 'not_found: appointment does not exist' using errcode='P0002';
  end if;

  if v_role = 'patient' then
    v_mine := iapp.my_patient_id();
    if v_mine is null or v_old.patient_id is distinct from v_mine then
      raise exception 'not_found: appointment does not exist' using errcode='P0002';
    end if;
    -- A patient may move a booking only while it is still un-actioned.
    if v_old.status not in ('REQUESTED','PENDING','CONFIRMED') then
      raise exception 'too_late: this appointment can no longer be rescheduled '
        'by the patient (status %)', v_old.status using errcode='42501';
    end if;
  elsif v_role not in ('secretary','doctor','admin') then
    raise exception 'forbidden: role % may not reschedule', v_role using errcode='42501';
  end if;

  if v_old.status in ('COMPLETED','IN_CLINIC') then
    raise exception 'too_late: cannot reschedule an appointment that is % ',
      v_old.status using errcode='23514';
  end if;
  if p_new_date < current_date then
    raise exception 'past_date: cannot reschedule into the past' using errcode='23514';
  end if;

  perform set_config('iapp.acting_role', v_role, true);

  -- Free the original slot FIRST, so moving 09:00 -> 09:15 on the same day
  -- does not collide with itself.
  update iapp.appointments
     set status='CANCELLED', cancelled_at=now(), cancelled_by=auth.uid(),
         cancel_reason=coalesce(p_reason,'إعادة جدولة')
   where id = p_id;

  begin
    insert into iapp.appointments(
      patient_id, guest_name, guest_phone, doctor_id, clinic_id,
      scheduled_date, scheduled_time, duration_minutes,
      status, source, appointment_type, notes, room,
      rescheduled_from, reschedule_count, created_by)
    values (
      v_old.patient_id, v_old.guest_name, v_old.guest_phone,
      coalesce(p_new_doctor_id, v_old.doctor_id), v_old.clinic_id,
      p_new_date, p_new_time, v_old.duration_minutes,
      (case when v_role='patient' then 'REQUESTED' else 'CONFIRMED' end)::iapp.appointment_status,
      v_old.source, v_old.appointment_type, v_old.notes,
      coalesce(p_new_room, v_old.room),
      v_old.id, v_old.reschedule_count + 1, auth.uid())
    returning * into v_new;
  exception when exclusion_violation then
    -- The whole function is one transaction: the cancel above rolls back too,
    -- so a failed reschedule leaves the original appointment untouched.
    raise exception 'slot_taken: the new time is already booked'
      using errcode='23P01';
  end;

  return v_new;
end $function$
;

CREATE OR REPLACE FUNCTION iapp.review_appointment(p_id uuid)
 RETURNS iapp.appointments
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'iapp', 'public'
AS $function$
  select iapp.transition(p_id, 'PENDING') $function$
;

CREATE OR REPLACE FUNCTION iapp.soft_delete(p_table text, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iapp'
AS $function$
begin
  execute format(
    'update iapp.%I set deleted_at = now(), updated_by = auth.uid()
     where id = $1 and deleted_at is null', p_table)
  using p_id;
end $function$
;

CREATE OR REPLACE FUNCTION iapp.sweep_no_shows(p_grace_minutes integer DEFAULT 60)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iapp', 'public'
AS $function$
declare n int := 0; r record;
begin
  perform set_config('iapp.acting_role','admin',true);
  for r in
    select id from iapp.appointments
     where deleted_at is null
       and status = 'CONFIRMED'
       and (scheduled_date + scheduled_time
            + make_interval(mins => duration_minutes + p_grace_minutes)) < now()
  loop
    update iapp.appointments
       set status='NO_SHOW' where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $function$
;

CREATE OR REPLACE FUNCTION iapp.sync_last_visit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iapp'
AS $function$
      begin
        update iapp.patients
             set last_visit = greatest(coalesce(last_visit, new.visit_date), new.visit_date)
                where id = new.patient_id;
                  return new;
                  end $function$
;

CREATE OR REPLACE FUNCTION iapp.sync_patient_phone()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.phone_normalized := iapp.normalize_phone(new.phone);
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION iapp.sync_payment_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare net numeric(12,2);
begin
  net := new.amount - new.discount;
  if new.status in ('refunded','waived') then
    return new;
  elsif new.amount_paid <= 0 then
    new.status := 'unpaid';
  elsif new.amount_paid >= net - 0.01 then
    new.status := 'paid';
    new.paid_at := coalesce(new.paid_at, now());
  else
    new.status := 'partial';
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION iapp.tg_reject_noop_transition()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  -- الحالة لم تتغيّر: مسموح تماماً لتعديل الملاحظات أو الغرفة أو الجدولة.
  if new.status is not distinct from old.status then

    -- غير المسموح: إعادة كتابة أثر الفعل نفسه. لا يحدث إلا بتنفيذه مرتين.
    if (new.confirmed_at is distinct from old.confirmed_at)
    or (new.arrived_at   is distinct from old.arrived_at)
    or (new.waiting_at   is distinct from old.waiting_at)
    or (new.in_clinic_at is distinct from old.in_clinic_at)
    or (new.completed_at is distinct from old.completed_at)
    or (new.cancelled_at is distinct from old.cancelled_at)
    or (new.no_show_at   is distinct from old.no_show_at)
    -- ↓ هذان السطران هما الإصلاح الفعلي في قاعدتك.
    or (new.confirmed_by is distinct from old.confirmed_by)
    or (new.cancelled_by is distinct from old.cancelled_by)
    then
      raise exception 'already_in_state: الموعد % في حالة % بالفعل', old.id, old.status
        using errcode = '55000';
    end if;
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION iapp.touch_row()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    new.created_by := coalesce(new.created_by, auth.uid());
  else
    new.created_at := old.created_at;      -- immutable
    new.created_by := old.created_by;      -- immutable
  end if;
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION iapp.transition(p_appointment_id uuid, p_to iapp.appointment_status, p_reason text DEFAULT NULL::text)
 RETURNS iapp.appointments
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iapp', 'public'
AS $function$
declare
  v_role text := iapp.acting_role();
  v_row  iapp.appointments;
  v_mine uuid;
begin
  -- Lock the row for the duration of the transaction. Two staff members
  -- pressing "call next patient" simultaneously serialise here rather than
  -- both succeeding.
  select * into v_row from iapp.appointments
   where id = p_appointment_id and deleted_at is null
   for update;

  if not found then
    raise exception 'not_found: appointment does not exist' using errcode='P0002';
  end if;

  -- A patient may only ever act on their own appointment.
  if v_role = 'patient' then
    v_mine := iapp.my_patient_id();
    if v_mine is null or v_row.patient_id is distinct from v_mine then
      -- Deliberately the same error as a missing row: do not confirm existence.
      raise exception 'not_found: appointment does not exist' using errcode='P0002';
    end if;
  end if;

  perform set_config('iapp.acting_role', v_role, true);

  update iapp.appointments
     set status = p_to,
         cancel_reason = case when p_to='CANCELLED'
                              then coalesce(p_reason, cancel_reason)
                              else cancel_reason end,
         cancelled_by  = case when p_to='CANCELLED' then auth.uid() else cancelled_by end,
         confirmed_by  = case when p_to='CONFIRMED' then auth.uid() else confirmed_by end
   where id = p_appointment_id
   returning * into v_row;

  return v_row;
end $function$
;

CREATE OR REPLACE FUNCTION iapp.validate_appointment_transition()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
  t record;
  v_role text;
begin
  if tg_op = 'INSERT' then
    if new.status not in ('REQUESTED','PENDING','CONFIRMED') then
      raise exception 'invalid_initial_status: an appointment cannot be created as %',
        new.status using errcode='23514';
    end if;
    new.requested_at := coalesce(new.requested_at, now());
    if new.status = 'CONFIRMED' then
      new.confirmed_at := coalesce(new.confirmed_at, now());
    end if;
    return new;
  end if;

  if new.status is not distinct from old.status then
    new.updated_at := now();
    return new;
  end if;

  select * into t from iapp.appointment_transitions
   where from_status = old.status and to_status = new.status;

  if not found then
    raise exception 'invalid_transition: % -> % is not a permitted transition',
      old.status, new.status using errcode='23514';
  end if;

  -- Role check. iapp.acting_role() is set by the transition functions;
  -- a direct SQL update by a superuser/service falls back to the profile.
  v_role := coalesce(
    nullif(current_setting('iapp.acting_role', true), ''),
    (select role::text from public.profiles where id = auth.uid()),
    'admin');

  if not (v_role = any(t.allowed_roles)) then
    raise exception 'forbidden_transition: role % may not move an appointment % -> %',
      v_role, old.status, new.status using errcode='42501';
  end if;

  if t.requires_reason and coalesce(btrim(new.cancel_reason),'') = '' then
    raise exception 'reason_required: % -> % requires a reason',
      old.status, new.status using errcode='23514';
  end if;

  -- Leaving a terminal state means it did not happen: clear its stamp,
  -- or the (status = timestamp-present) constraints are violated.
  -- The event itself is not lost - appointment_status_history keeps it.
  if old.status = 'NO_SHOW' and new.status <> 'NO_SHOW' then
    new.no_show_at := null;
  end if;
  if old.status = 'CANCELLED' and new.status <> 'CANCELLED' then
    new.cancelled_at   := null;
    new.cancelled_by   := null;
    new.cancel_reason  := null;
  end if;

  -- Stamp the lifecycle timestamp for this transition.
  if coalesce(t.sets_timestamp,'') <> '' then
    execute format('select ($1).%I is null', t.sets_timestamp) into strict v_role using new;
    if v_role::boolean then
      new := json_populate_record(new,
               json_build_object(t.sets_timestamp, now())::json);
    end if;
  end if;

  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end $function$
;

create or replace view iapp.v_active_patients with (security_invoker=true) as
 SELECT id,
    patient_code,
    full_name,
    date_of_birth,
    age_at_registration,
    gender,
    phone,
    phone_normalized,
    alt_phone,
    email,
    national_id,
    address,
    city,
    occupation,
    blood_type,
    allergies,
    medical_history,
    emergency_contact_name,
    emergency_contact_phone,
    notes,
    primary_clinic_id,
    is_active,
    created_at,
    updated_at,
    created_by,
    updated_by,
    deleted_at,
    legacy_id
   FROM iapp.patients
  WHERE deleted_at IS NULL;

create or replace view iapp.v_active_visits with (security_invoker=true) as
 SELECT id,
    patient_id,
    clinic_id,
    doctor_id,
    appointment_id,
    visit_date,
    visit_type,
    chief_complaint,
    summary,
    notes,
    is_locked,
    locked_at,
    locked_by,
    created_at,
    updated_at,
    created_by,
    updated_by,
    deleted_at,
    legacy_id
   FROM iapp.visits
  WHERE deleted_at IS NULL;

create or replace view iapp.v_appointment_board with (security_invoker=true) as
 SELECT a.id,
    a.status,
    a.scheduled_date,
    a.scheduled_time,
    a.duration_minutes,
    a.appointment_type,
    a.room,
    a.notes,
    a.source,
    a.requested_at,
    a.confirmed_at,
    a.arrived_at,
    a.waiting_at,
    a.in_clinic_at,
    a.completed_at,
    a.cancelled_at,
    a.cancel_reason,
    a.patient_id,
    COALESCE(p.full_name, a.guest_name) AS display_name,
    COALESCE(p.phone, a.guest_phone) AS display_phone,
    p.patient_code,
    a.doctor_id,
    d.full_name_ar AS doctor_name,
    d.short_name AS doctor_short,
    a.clinic_id,
    c.name_ar AS clinic_name,
    a.visit_id,
    a.rescheduled_from,
    a.reschedule_count,
        CASE
            WHEN a.arrived_at IS NOT NULL THEN round(EXTRACT(epoch FROM COALESCE(a.in_clinic_at, now()) - a.arrived_at) / 60::numeric)::integer
            ELSE NULL::integer
        END AS wait_minutes
   FROM iapp.appointments a
     LEFT JOIN iapp.patients p ON p.id = a.patient_id
     LEFT JOIN iapp.doctors d ON d.id = a.doctor_id
     LEFT JOIN iapp.clinics c ON c.id = a.clinic_id
  WHERE a.deleted_at IS NULL;

create or replace view iapp.v_my_diagnoses with (security_barrier=true, security_invoker=true) as
 SELECT id,
    patient_id,
    diagnosis_text,
    eye,
    status,
    diagnosed_on
   FROM iapp.diagnoses
  WHERE patient_id = iapp.current_patient_uuid() AND deleted_at IS NULL;

create or replace view iapp.v_my_examinations with (security_barrier=true, security_invoker=true) as
 SELECT id,
    patient_id,
    exam_date,
    doctor_id,
    visit_id,
    treatment_plan,
    va_right,
    va_left
   FROM iapp.examinations
  WHERE patient_id = iapp.current_patient_uuid() AND deleted_at IS NULL;

create or replace view iapp.v_my_patient with (security_barrier=true, security_invoker=true) as
 SELECT id,
    patient_code,
    full_name,
    date_of_birth,
    gender,
    phone,
    email,
    address,
    city,
    blood_type,
    allergies,
    emergency_contact_name,
    emergency_contact_phone,
    primary_clinic_id
   FROM iapp.patients
  WHERE id = iapp.current_patient_uuid() AND deleted_at IS NULL;

create or replace view iapp.v_my_prescriptions with (security_barrier=true, security_invoker=true) as
 SELECT id,
    patient_id,
    prescribed_on,
    eye,
    is_glasses,
    notes,
    legacy_medicines_text
   FROM iapp.prescriptions
  WHERE patient_id = iapp.current_patient_uuid() AND deleted_at IS NULL;

create or replace view iapp.v_my_visits with (security_barrier=true, security_invoker=true) as
 SELECT id,
    patient_id,
    visit_date,
    visit_type,
    doctor_id,
    clinic_id
   FROM iapp.visits
  WHERE patient_id = iapp.current_patient_uuid() AND deleted_at IS NULL;

create or replace view iapp.v_patient_clinical with (security_barrier=true) as
 SELECT id,
    patient_code,
    full_name,
    date_of_birth,
    age_at_registration,
    gender,
    phone,
    phone_normalized,
    alt_phone,
    email,
    national_id,
    address,
    city,
    occupation,
    blood_type,
    allergies,
    medical_history,
    emergency_contact_name,
    emergency_contact_phone,
    notes,
    primary_clinic_id,
    is_active,
    created_at,
    updated_at,
    created_by,
    updated_by,
    deleted_at,
    legacy_id,
    primary_condition,
    triage_status,
    last_visit
   FROM iapp.patients
  WHERE iapp.is_doctor() AND deleted_at IS NULL;

CREATE TRIGGER trg_00_reject_noop BEFORE UPDATE ON iapp.appointments FOR EACH ROW EXECUTE FUNCTION iapp.tg_reject_noop_transition();

CREATE TRIGGER trg_log_status AFTER INSERT OR UPDATE ON iapp.appointments FOR EACH ROW EXECUTE FUNCTION iapp.log_appointment_status();

CREATE TRIGGER trg_notify_appointment AFTER INSERT OR UPDATE ON iapp.appointments FOR EACH ROW EXECUTE FUNCTION iapp.notify_appointment_change();

CREATE TRIGGER trg_validate_transition BEFORE INSERT OR UPDATE ON iapp.appointments FOR EACH ROW EXECUTE FUNCTION iapp.validate_appointment_transition();

CREATE TRIGGER trg_audit_immutable BEFORE DELETE OR UPDATE ON iapp.audit_logs_2026_08 FOR EACH ROW EXECUTE FUNCTION iapp.block_audit_mutation();

CREATE TRIGGER trg_audit_immutable BEFORE DELETE OR UPDATE ON iapp.audit_logs_2026_09 FOR EACH ROW EXECUTE FUNCTION iapp.block_audit_mutation();

CREATE TRIGGER trg_audit_immutable BEFORE DELETE OR UPDATE ON iapp.audit_logs_2026_10 FOR EACH ROW EXECUTE FUNCTION iapp.block_audit_mutation();

CREATE TRIGGER trg_audit_immutable BEFORE DELETE OR UPDATE ON iapp.audit_logs_default FOR EACH ROW EXECUTE FUNCTION iapp.block_audit_mutation();

CREATE TRIGGER trg_audit_immutable BEFORE DELETE OR UPDATE ON iapp.audit_logs FOR EACH ROW EXECUTE FUNCTION iapp.block_audit_mutation();

CREATE TRIGGER trg_touch_clinic_schedules BEFORE INSERT OR UPDATE ON iapp.clinic_schedules FOR EACH ROW EXECUTE FUNCTION iapp.touch_row();

CREATE TRIGGER trg_touch_clinics BEFORE INSERT OR UPDATE ON iapp.clinics FOR EACH ROW EXECUTE FUNCTION iapp.touch_row();

CREATE TRIGGER trg_dx_same_patient BEFORE INSERT OR UPDATE ON iapp.diagnoses FOR EACH ROW EXECUTE FUNCTION iapp.check_same_patient();

CREATE TRIGGER trg_touch_diagnoses BEFORE INSERT OR UPDATE ON iapp.diagnoses FOR EACH ROW EXECUTE FUNCTION iapp.touch_row();

CREATE TRIGGER trg_touch_doctors BEFORE INSERT OR UPDATE ON iapp.doctors FOR EACH ROW EXECUTE FUNCTION iapp.touch_row();

CREATE TRIGGER trg_exam_same_patient BEFORE INSERT OR UPDATE ON iapp.examinations FOR EACH ROW EXECUTE FUNCTION iapp.check_same_patient();

CREATE TRIGGER trg_touch_examinations BEFORE INSERT OR UPDATE ON iapp.examinations FOR EACH ROW EXECUTE FUNCTION iapp.touch_row();

CREATE TRIGGER trg_fu_same_patient BEFORE INSERT OR UPDATE ON iapp.follow_ups FOR EACH ROW EXECUTE FUNCTION iapp.check_same_patient();

CREATE TRIGGER trg_touch_follow_ups BEFORE INSERT OR UPDATE ON iapp.follow_ups FOR EACH ROW EXECUTE FUNCTION iapp.touch_row();

CREATE TRIGGER trg_touch_image_reports BEFORE INSERT OR UPDATE ON iapp.image_reports FOR EACH ROW EXECUTE FUNCTION iapp.touch_row();

CREATE TRIGGER trg_touch_iop_measurements BEFORE INSERT OR UPDATE ON iapp.iop_measurements FOR EACH ROW EXECUTE FUNCTION iapp.touch_row();

CREATE TRIGGER trg_img_same_patient BEFORE INSERT OR UPDATE ON iapp.medical_images FOR EACH ROW EXECUTE FUNCTION iapp.check_same_patient();

CREATE TRIGGER trg_touch_medical_images BEFORE INSERT OR UPDATE ON iapp.medical_images FOR EACH ROW EXECUTE FUNCTION iapp.touch_row();

CREATE TRIGGER trg_touch_medications BEFORE INSERT OR UPDATE ON iapp.medications FOR EACH ROW EXECUTE FUNCTION iapp.touch_row();

CREATE TRIGGER trg_touch_notifications BEFORE INSERT OR UPDATE ON iapp.notifications FOR EACH ROW EXECUTE FUNCTION iapp.touch_row();

CREATE TRIGGER trg_patient_phone BEFORE INSERT OR UPDATE OF phone ON iapp.patients FOR EACH ROW EXECUTE FUNCTION iapp.sync_patient_phone();

CREATE TRIGGER trg_touch_patients BEFORE INSERT OR UPDATE ON iapp.patients FOR EACH ROW EXECUTE FUNCTION iapp.touch_row();

CREATE TRIGGER trg_pay_same_patient BEFORE INSERT OR UPDATE ON iapp.payments FOR EACH ROW EXECUTE FUNCTION iapp.check_same_patient();

CREATE TRIGGER trg_payment_status BEFORE INSERT OR UPDATE ON iapp.payments FOR EACH ROW EXECUTE FUNCTION iapp.sync_payment_status();

CREATE TRIGGER trg_touch_payments BEFORE INSERT OR UPDATE ON iapp.payments FOR EACH ROW EXECUTE FUNCTION iapp.touch_row();

CREATE TRIGGER trg_touch_prescription_items BEFORE INSERT OR UPDATE ON iapp.prescription_items FOR EACH ROW EXECUTE FUNCTION iapp.touch_row();

CREATE TRIGGER trg_rx_same_patient BEFORE INSERT OR UPDATE ON iapp.prescriptions FOR EACH ROW EXECUTE FUNCTION iapp.check_same_patient();

CREATE TRIGGER trg_touch_prescriptions BEFORE INSERT OR UPDATE ON iapp.prescriptions FOR EACH ROW EXECUTE FUNCTION iapp.touch_row();

CREATE TRIGGER trg_touch_refractions BEFORE INSERT OR UPDATE ON iapp.refractions FOR EACH ROW EXECUTE FUNCTION iapp.touch_row();

CREATE TRIGGER trg_touch_roles BEFORE INSERT OR UPDATE ON iapp.roles FOR EACH ROW EXECUTE FUNCTION iapp.touch_row();

CREATE TRIGGER trg_touch_services BEFORE INSERT OR UPDATE ON iapp.services FOR EACH ROW EXECUTE FUNCTION iapp.touch_row();

CREATE TRIGGER trg_touch_staff BEFORE INSERT OR UPDATE ON iapp.staff FOR EACH ROW EXECUTE FUNCTION iapp.touch_row();

CREATE TRIGGER trg_touch_visit_ratings BEFORE INSERT OR UPDATE ON iapp.visit_ratings FOR EACH ROW EXECUTE FUNCTION iapp.touch_row();

CREATE TRIGGER trg_sync_last_visit AFTER INSERT OR UPDATE OF visit_date ON iapp.visits FOR EACH ROW EXECUTE FUNCTION iapp.sync_last_visit();

CREATE TRIGGER trg_touch_visits BEFORE INSERT OR UPDATE ON iapp.visits FOR EACH ROW EXECUTE FUNCTION iapp.touch_row();

alter table iapp.appointment_status_history enable row level security;

alter table iapp.appointment_transitions enable row level security;

alter table iapp.appointments enable row level security;

alter table iapp.audit_logs enable row level security;

alter table iapp.audit_logs_2026_08 enable row level security;

alter table iapp.audit_logs_2026_09 enable row level security;

alter table iapp.audit_logs_2026_10 enable row level security;

alter table iapp.audit_logs_default enable row level security;

alter table iapp.clinic_schedules enable row level security;

alter table iapp.clinics enable row level security;

alter table iapp.diagnoses enable row level security;

alter table iapp.doctors enable row level security;

alter table iapp.examinations enable row level security;

alter table iapp.follow_ups enable row level security;

alter table iapp.image_reports enable row level security;

alter table iapp.iop_measurements enable row level security;

alter table iapp.medical_images enable row level security;

alter table iapp.medications enable row level security;

alter table iapp.migration_issues enable row level security;

alter table iapp.migration_runs enable row level security;

alter table iapp.notifications enable row level security;

alter table iapp.patients enable row level security;

alter table iapp.payments enable row level security;

alter table iapp.prescription_items enable row level security;

alter table iapp.prescriptions enable row level security;

alter table iapp.refractions enable row level security;

alter table iapp.roles enable row level security;

alter table iapp.services enable row level security;

alter table iapp.staff enable row level security;

alter table iapp.visit_ratings enable row level security;

alter table iapp.visits enable row level security;

create policy hist_read on iapp.appointment_status_history as PERMISSIVE for SELECT to authenticated
  using ((EXISTS ( SELECT 1
   FROM iapp.appointments a
  WHERE (a.id = appointment_status_history.appointment_id))));

create policy transitions_admin on iapp.appointment_transitions as PERMISSIVE for ALL to authenticated
  using (is_admin())
  with check (is_admin());

create policy transitions_read on iapp.appointment_transitions as PERMISSIVE for SELECT to authenticated
  using (true);

create policy apt_patient_read on iapp.appointments as PERMISSIVE for SELECT to authenticated
  using ((patient_id = iapp.my_patient_id()));

create policy apt_secretary_read on iapp.appointments as PERMISSIVE for SELECT to authenticated
  using ((iapp.is_secretary() AND (clinic_id IN ( SELECT iapp.my_clinic_ids() AS my_clinic_ids))));

create policy apt_staff_read on iapp.appointments as PERMISSIVE for SELECT to authenticated
  using ((iapp.is_doctor() OR is_admin()));

create policy audit_logs_2026_08_admin on iapp.audit_logs_2026_08 as PERMISSIVE for SELECT to authenticated
  using (is_admin());

create policy audit_logs_2026_09_admin on iapp.audit_logs_2026_09 as PERMISSIVE for SELECT to authenticated
  using (is_admin());

create policy audit_logs_2026_10_admin on iapp.audit_logs_2026_10 as PERMISSIVE for SELECT to authenticated
  using (is_admin());

create policy audit_logs_default_admin on iapp.audit_logs_default as PERMISSIVE for SELECT to authenticated
  using (is_admin());

create policy audit_admin_read on iapp.audit_logs as PERMISSIVE for SELECT to authenticated
  using (is_admin());

create policy audit_patient_read on iapp.audit_logs as PERMISSIVE for SELECT to authenticated
  using (((patient_id IS NOT NULL) AND (patient_id = iapp.current_patient_uuid())));

create policy auditlog_admin on iapp.audit_logs as PERMISSIVE for SELECT to authenticated
  using (is_admin());

create policy auditlog_own_patient on iapp.audit_logs as PERMISSIVE for SELECT to authenticated
  using (((patient_id IS NOT NULL) AND (patient_id = iapp.my_patient_id())));

create policy sched_read on iapp.clinic_schedules as PERMISSIVE for SELECT to authenticated
  using (is_active);

create policy sched_write on iapp.clinic_schedules as PERMISSIVE for ALL to authenticated
  using (iapp.is_doctor())
  with check (iapp.is_doctor());

create policy clinic_read on iapp.clinics as PERMISSIVE for SELECT to authenticated
  using ((is_active AND (deleted_at IS NULL)));

create policy clinic_write on iapp.clinics as PERMISSIVE for ALL to authenticated
  using (is_admin())
  with check (is_admin());

create policy diagnoses_clinical_all on iapp.diagnoses as PERMISSIVE for ALL to authenticated
  using (iapp.is_doctor())
  with check (iapp.is_doctor());

create policy diagnoses_patient_read on iapp.diagnoses as PERMISSIVE for SELECT to authenticated
  using (((patient_id = iapp.current_patient_uuid()) AND (deleted_at IS NULL)));

create policy doc_read on iapp.doctors as PERMISSIVE for SELECT to authenticated
  using ((deleted_at IS NULL));

create policy doc_write on iapp.doctors as PERMISSIVE for ALL to authenticated
  using (iapp.is_doctor())
  with check (iapp.is_doctor());

create policy examinations_clinical_all on iapp.examinations as PERMISSIVE for ALL to authenticated
  using (iapp.is_doctor())
  with check (iapp.is_doctor());

create policy examinations_patient_read on iapp.examinations as PERMISSIVE for SELECT to authenticated
  using (((patient_id = iapp.current_patient_uuid()) AND (deleted_at IS NULL)));

create policy follow_ups_clinical_all on iapp.follow_ups as PERMISSIVE for ALL to authenticated
  using (iapp.is_doctor())
  with check (iapp.is_doctor());

create policy follow_ups_patient_read on iapp.follow_ups as PERMISSIVE for SELECT to authenticated
  using (((patient_id = iapp.current_patient_uuid()) AND (deleted_at IS NULL)));

create policy imgrep_via_parent on iapp.image_reports as PERMISSIVE for ALL to authenticated
  using (iapp.is_doctor())
  with check (iapp.is_doctor());

create policy iop_measurements_clinical_all on iapp.iop_measurements as PERMISSIVE for ALL to authenticated
  using (iapp.is_doctor())
  with check (iapp.is_doctor());

create policy iop_measurements_patient_read on iapp.iop_measurements as PERMISSIVE for SELECT to authenticated
  using (((patient_id = iapp.current_patient_uuid()) AND (deleted_at IS NULL)));

create policy medical_images_clinical_all on iapp.medical_images as PERMISSIVE for ALL to authenticated
  using (iapp.is_doctor())
  with check (iapp.is_doctor());

create policy medical_images_patient_read on iapp.medical_images as PERMISSIVE for SELECT to authenticated
  using (((patient_id = iapp.current_patient_uuid()) AND (deleted_at IS NULL)));

create policy meds_read on iapp.medications as PERMISSIVE for SELECT to authenticated
  using ((is_active AND iapp.is_doctor()));

create policy meds_write on iapp.medications as PERMISSIVE for ALL to authenticated
  using (iapp.is_doctor())
  with check (iapp.is_doctor());

create policy migissue_admin on iapp.migration_issues as PERMISSIVE for ALL to authenticated
  using (is_admin())
  with check (is_admin());

create policy mig_admin on iapp.migration_runs as PERMISSIVE for ALL to authenticated
  using (is_admin())
  with check (is_admin());

create policy notif_mark_read on iapp.notifications as PERMISSIVE for UPDATE to authenticated
  using (((profile_id = auth.uid()) OR (patient_id = iapp.current_patient_uuid())))
  with check (((profile_id = auth.uid()) OR (patient_id = iapp.current_patient_uuid())));

create policy notif_own on iapp.notifications as PERMISSIVE for SELECT to authenticated
  using (((profile_id = auth.uid()) OR (patient_id = iapp.current_patient_uuid())));

create policy notif_staff_write on iapp.notifications as PERMISSIVE for ALL to authenticated
  using (is_staff())
  with check (is_staff());

create policy pat_clinical_all on iapp.patients as PERMISSIVE for ALL to authenticated
  using ((iapp.is_doctor() AND (deleted_at IS NULL)))
  with check (iapp.is_doctor());

create policy pat_secretary_read on iapp.patients as PERMISSIVE for SELECT to authenticated
  using ((iapp.is_secretary() AND (deleted_at IS NULL)));

create policy pat_secretary_update on iapp.patients as PERMISSIVE for UPDATE to authenticated
  using ((iapp.is_secretary() AND (deleted_at IS NULL)))
  with check (iapp.is_secretary());

create policy pat_secretary_write on iapp.patients as PERMISSIVE for INSERT to authenticated
  with check (iapp.is_secretary());

create policy pat_self_read on iapp.patients as PERMISSIVE for SELECT to authenticated
  using (((id = iapp.current_patient_uuid()) AND (deleted_at IS NULL)));

create policy pay_clinical_all on iapp.payments as PERMISSIVE for ALL to authenticated
  using (iapp.is_doctor())
  with check (iapp.is_doctor());

create policy pay_patient_read on iapp.payments as PERMISSIVE for SELECT to authenticated
  using (((patient_id = iapp.current_patient_uuid()) AND (deleted_at IS NULL)));

create policy pay_secretary on iapp.payments as PERMISSIVE for ALL to authenticated
  using ((iapp.is_secretary() AND (clinic_id IN ( SELECT iapp.my_clinic_ids() AS my_clinic_ids))))
  with check (iapp.is_secretary());

create policy rxitem_via_parent on iapp.prescription_items as PERMISSIVE for ALL to authenticated
  using ((EXISTS ( SELECT 1
   FROM iapp.prescriptions p
  WHERE ((p.id = prescription_items.prescription_id) AND (iapp.is_doctor() OR (p.patient_id = iapp.current_patient_uuid()))))))
  with check ((EXISTS ( SELECT 1
   FROM iapp.prescriptions p
  WHERE ((p.id = prescription_items.prescription_id) AND iapp.is_doctor()))));

create policy prescriptions_clinical_all on iapp.prescriptions as PERMISSIVE for ALL to authenticated
  using (iapp.is_doctor())
  with check (iapp.is_doctor());

create policy prescriptions_patient_read on iapp.prescriptions as PERMISSIVE for SELECT to authenticated
  using (((patient_id = iapp.current_patient_uuid()) AND (deleted_at IS NULL)));

create policy refractions_clinical_all on iapp.refractions as PERMISSIVE for ALL to authenticated
  using (iapp.is_doctor())
  with check (iapp.is_doctor());

create policy refractions_patient_read on iapp.refractions as PERMISSIVE for SELECT to authenticated
  using (((patient_id = iapp.current_patient_uuid()) AND (deleted_at IS NULL)));

create policy roles_admin on iapp.roles as PERMISSIVE for ALL to authenticated
  using (is_admin())
  with check (is_admin());

create policy roles_read on iapp.roles as PERMISSIVE for SELECT to authenticated
  using (is_active);

create policy svc_read_all on iapp.services as PERMISSIVE for SELECT to authenticated
  using ((is_active AND (deleted_at IS NULL)));

create policy svc_write_doctor on iapp.services as PERMISSIVE for ALL to authenticated
  using (iapp.is_doctor())
  with check (iapp.is_doctor());

create policy staff_admin on iapp.staff as PERMISSIVE for ALL to authenticated
  using (is_admin())
  with check (is_admin());

create policy staff_self on iapp.staff as PERMISSIVE for SELECT to authenticated
  using ((profile_id = auth.uid()));

create policy rating_doctor on iapp.visit_ratings as PERMISSIVE for ALL to authenticated
  using (iapp.is_doctor())
  with check (iapp.is_doctor());

create policy rating_patient_create on iapp.visit_ratings as PERMISSIVE for INSERT to authenticated
  with check ((patient_id = iapp.current_patient_uuid()));

create policy rating_patient_read on iapp.visit_ratings as PERMISSIVE for SELECT to authenticated
  using (((patient_id = iapp.current_patient_uuid()) OR iapp.is_doctor()));

create policy visits_clinical_all on iapp.visits as PERMISSIVE for ALL to authenticated
  using (iapp.is_doctor())
  with check (iapp.is_doctor());

create policy visits_patient_read on iapp.visits as PERMISSIVE for SELECT to authenticated
  using (((patient_id = iapp.current_patient_uuid()) AND (deleted_at IS NULL)));

grant SELECT on iapp.appointment_status_history to authenticated;

grant SELECT on iapp.appointment_transitions to authenticated;

grant SELECT on iapp.appointments to authenticated;

grant SELECT on iapp.audit_logs to authenticated;

grant SELECT on iapp.audit_logs_2026_08 to authenticated;

grant SELECT on iapp.audit_logs_2026_09 to authenticated;

grant SELECT on iapp.audit_logs_2026_10 to authenticated;

grant SELECT on iapp.audit_logs_default to authenticated;

grant DELETE, INSERT, SELECT, UPDATE on iapp.clinic_schedules to authenticated;

grant DELETE, INSERT, SELECT, UPDATE on iapp.clinics to authenticated;

grant DELETE, INSERT, SELECT, UPDATE on iapp.diagnoses to authenticated;

grant DELETE, INSERT, SELECT, UPDATE on iapp.doctors to authenticated;

grant DELETE, INSERT, SELECT, UPDATE on iapp.examinations to authenticated;

grant DELETE, INSERT, SELECT, UPDATE on iapp.follow_ups to authenticated;

grant DELETE, INSERT, SELECT, UPDATE on iapp.image_reports to authenticated;

grant DELETE, INSERT, SELECT, UPDATE on iapp.iop_measurements to authenticated;

grant DELETE, INSERT, SELECT, UPDATE on iapp.medical_images to authenticated;

grant DELETE, INSERT, SELECT, UPDATE on iapp.medications to authenticated;

grant DELETE, INSERT, SELECT, UPDATE on iapp.notifications to authenticated;

grant INSERT on iapp.patients to authenticated;

grant DELETE, INSERT, SELECT, UPDATE on iapp.payments to authenticated;

grant DELETE, INSERT, SELECT, UPDATE on iapp.prescription_items to authenticated;

grant DELETE, INSERT, SELECT, UPDATE on iapp.prescriptions to authenticated;

grant DELETE, INSERT, SELECT, UPDATE on iapp.refractions to authenticated;

grant SELECT on iapp.roles to authenticated;

grant DELETE, INSERT, SELECT, UPDATE on iapp.services to authenticated;

grant SELECT on iapp.staff to authenticated;

grant SELECT on iapp.v_active_patients to authenticated;

grant SELECT on iapp.v_appointment_board to authenticated;

grant SELECT on iapp.v_my_diagnoses to authenticated;

grant SELECT on iapp.v_my_examinations to authenticated;

grant SELECT on iapp.v_my_patient to authenticated;

grant SELECT on iapp.v_my_prescriptions to authenticated;

grant SELECT on iapp.v_my_visits to authenticated;

grant SELECT on iapp.v_patient_clinical to authenticated;

grant INSERT, SELECT on iapp.visit_ratings to authenticated;

grant DELETE, INSERT, SELECT, UPDATE on iapp.visits to authenticated;

grant execute on function iapp.available_slots(p_clinic_id uuid, p_date date, p_doctor_id uuid) to authenticated;

grant execute on function iapp.book_appointment(p_clinic_id uuid, p_date date, p_time time without time zone, p_patient_id uuid, p_doctor_id uuid, p_type text, p_notes text, p_room text, p_duration smallint, p_guest_name text, p_guest_phone text) to authenticated;

grant execute on function iapp.call_patient(p_id uuid) to authenticated;

grant execute on function iapp.cancel_appointment(p_id uuid, p_reason text) to authenticated;

grant execute on function iapp.claim_patient_record(p_code text, p_phone text) to authenticated;

grant execute on function iapp.complete_appointment(p_id uuid, p_visit_id uuid) to authenticated;

grant execute on function iapp.confirm_appointment(p_id uuid) to authenticated;

grant execute on function iapp.mark_arrived(p_id uuid) to authenticated;

grant execute on function iapp.mark_no_show(p_id uuid) to authenticated;

grant execute on function iapp.mark_waiting(p_id uuid) to authenticated;

grant execute on function iapp.my_clinic_ids() to authenticated;

grant execute on function iapp.my_link_status() to authenticated;

grant execute on function iapp.reschedule_appointment(p_id uuid, p_new_date date, p_new_time time without time zone, p_reason text, p_new_doctor_id uuid, p_new_room text) to authenticated;

grant execute on function iapp.review_appointment(p_id uuid) to authenticated;

alter publication supabase_realtime add table iapp.appointments;

alter table iapp.appointments replica identity full;
