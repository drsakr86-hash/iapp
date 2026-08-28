-- تبعيات iapp من مخطط public — مُصدَّر في 2026-08-28
-- شغّل هذا الملف قبل 000_schema.sql عند الاستعادة.

-- ── مُصحَّح يدوياً بعد التصدير ─────────────────────────────────────────────
-- أربعة أعطاب في مخرَج 096، كلها تمنع الاستعادة:
--   ١. جدول profiles خرج مرتين (التقطه قسم المفاتيح الأجنبية وقسم الأسماء معاً)
--   ٢. النوع iapp_role كان بعد الجدول الذي يستعمله
--   ٣. iapp_role بلا اسم مخطط
--   ٤. المتتالية auth_events_id_seq لم تُصدَّر إطلاقاً

create schema if not exists public;

create type public.iapp_role as enum ('admin', 'doctor', 'secretary', 'patient');

create sequence if not exists public.auth_events_id_seq;


create table if not exists public.auth_events (
  id bigint default nextval('public.auth_events_id_seq'::regclass) not null,
  occurred_at timestamp with time zone default now() not null,
  identifier text not null,
  event text not null,
  ip inet,
  user_agent text
);

create table if not exists public.patient_links (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  patient_id text not null,
  verified boolean default false not null,
  verified_at timestamp with time zone,
  verified_by uuid,
  method text default 'phone_otp'::text not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.profiles (
  id uuid not null,
  role public.iapp_role default 'patient'::public.iapp_role not null,
  full_name text,
  phone text,
  clinic_id text,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  last_login_at timestamp with time zone
);

alter table public.auth_events add constraint auth_events_event_check CHECK ((event = ANY (ARRAY['login_ok'::text, 'login_fail'::text, 'otp_sent'::text, 'locked'::text])));

alter table public.auth_events add constraint auth_events_pkey PRIMARY KEY (id);

alter table public.patient_links add constraint patient_links_method_check CHECK ((method = ANY (ARRAY['phone_otp'::text, 'staff_issued'::text, 'admin_manual'::text])));

alter table public.patient_links add constraint patient_links_patient_id_key UNIQUE (patient_id);

alter table public.patient_links add constraint patient_links_pkey PRIMARY KEY (id);

alter table public.patient_links add constraint patient_links_user_id_key UNIQUE (user_id);

alter table public.profiles add constraint profiles_pkey PRIMARY KEY (id);

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((select role='admin' from public.profiles
                   where id = auth.uid() and is_active), false)
$function$
;

CREATE OR REPLACE FUNCTION public.is_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((select role in ('admin','doctor','secretary')
                   from public.profiles where id = auth.uid() and is_active), false)
$function$
;

-- ═══════════════════════════════════════════════════════════════════
-- تصحيح مطلوب في 000_schema.sql قبل استعماله للاستعادة:
-- استبدل   REFERENCES profiles(   بـ   REFERENCES public.profiles(
-- المفاتيح المتأثرة:
--   doctors.doctors_profile_id_fkey
--   notifications.notifications_profile_id_fkey
--   staff.staff_profile_id_fkey
