


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "btree_gist" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA public;


CREATE SCHEMA IF NOT EXISTS "iapp";


ALTER SCHEMA "iapp" OWNER TO "postgres";


COMMENT ON SCHEMA "iapp" IS 'Ù…Ø®Ø·Ø· Ø§Ù„Ø¹ÙŠØ§Ø¯Ø© Ø§Ù„Ø³Ø±ÙŠØ±ÙŠ - I APP. Ù‚Ø§Ø¹Ø¯Ø© Ø¨ÙŠØ§Ù†Ø§Øª Ø¬Ø¯ÙŠØ¯Ø©ØŒ Ù„Ø§ Ø¹Ù„Ø§Ù‚Ø© Ù„Ù‡Ø§ Ø¨Ø£ÙŠ Ù†Ø¸Ø§Ù… Ø³Ø§Ø¨Ù‚.';



CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "iapp"."ai_review_action" AS ENUM (
    'accept',
    'edit',
    'reject',
    'regenerate'
);


ALTER TYPE "iapp"."ai_review_action" OWNER TO "postgres";


CREATE TYPE "iapp"."ai_run_status" AS ENUM (
    'queued',
    'running',
    'succeeded',
    'failed',
    'superseded'
);


ALTER TYPE "iapp"."ai_run_status" OWNER TO "postgres";


CREATE TYPE "iapp"."ai_severity" AS ENUM (
    'none',
    'mild',
    'moderate',
    'severe',
    'unknown'
);


ALTER TYPE "iapp"."ai_severity" OWNER TO "postgres";


CREATE TYPE "iapp"."ai_urgency" AS ENUM (
    'routine',
    'soon',
    'urgent'
);


ALTER TYPE "iapp"."ai_urgency" OWNER TO "postgres";


CREATE TYPE "iapp"."appointment_source" AS ENUM (
    'staff',
    'patient_portal',
    'guest',
    'walk_in'
);


ALTER TYPE "iapp"."appointment_source" OWNER TO "postgres";


CREATE TYPE "iapp"."appointment_status" AS ENUM (
    'REQUESTED',
    'PENDING',
    'CONFIRMED',
    'ARRIVED',
    'WAITING',
    'IN_CLINIC',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW'
);


ALTER TYPE "iapp"."appointment_status" OWNER TO "postgres";


CREATE TYPE "iapp"."appointment_status_v1" AS ENUM (
    'requested',
    'confirmed',
    'arrived',
    'waiting',
    'in_room',
    'completed',
    'cancelled',
    'no_show'
);


ALTER TYPE "iapp"."appointment_status_v1" OWNER TO "postgres";


CREATE TYPE "iapp"."diagnosis_status" AS ENUM (
    'active',
    'resolved',
    'chronic',
    'ruled_out'
);


ALTER TYPE "iapp"."diagnosis_status" OWNER TO "postgres";


CREATE TYPE "iapp"."eye_side" AS ENUM (
    'OD',
    'OS',
    'OU'
);


ALTER TYPE "iapp"."eye_side" OWNER TO "postgres";


CREATE TYPE "iapp"."follow_up_status" AS ENUM (
    'pending',
    'notified',
    'completed',
    'missed',
    'cancelled'
);


ALTER TYPE "iapp"."follow_up_status" OWNER TO "postgres";


CREATE TYPE "iapp"."gender" AS ENUM (
    'male',
    'female',
    'other',
    'unknown'
);


ALTER TYPE "iapp"."gender" OWNER TO "postgres";


CREATE TYPE "iapp"."image_modality" AS ENUM (
    'fundus',
    'oct',
    'ffa',
    'optos',
    'topography',
    'biometry',
    'anterior_segment',
    'xray',
    'other',
    'unknown',
    'octa',
    'pentacam',
    'visual_field',
    'uwf_fundus',
    'uwf_oct',
    'uwf_octa',
    'b_scan'
);


ALTER TYPE "iapp"."image_modality" OWNER TO "postgres";


CREATE TYPE "iapp"."imaging_order_status" AS ENUM (
    'requested',
    'scheduled',
    'completed',
    'cancelled'
);


ALTER TYPE "iapp"."imaging_order_status" OWNER TO "postgres";


CREATE TYPE "iapp"."imaging_status" AS ENUM (
    'uploaded',
    'pending_report',
    'reported',
    'archived'
);


ALTER TYPE "iapp"."imaging_status" OWNER TO "postgres";


CREATE TYPE "iapp"."medication_form" AS ENUM (
    'drop',
    'ointment',
    'tablet',
    'capsule',
    'injection',
    'gel',
    'other'
);


ALTER TYPE "iapp"."medication_form" OWNER TO "postgres";


CREATE TYPE "iapp"."notification_channel" AS ENUM (
    'in_app',
    'sms',
    'whatsapp',
    'email'
);


ALTER TYPE "iapp"."notification_channel" OWNER TO "postgres";


CREATE TYPE "iapp"."notification_status" AS ENUM (
    'pending',
    'sent',
    'failed',
    'read'
);


ALTER TYPE "iapp"."notification_status" OWNER TO "postgres";


CREATE TYPE "iapp"."order_urgency" AS ENUM (
    'routine',
    'urgent',
    'stat'
);


ALTER TYPE "iapp"."order_urgency" OWNER TO "postgres";


CREATE TYPE "iapp"."payment_method" AS ENUM (
    'cash',
    'card',
    'transfer',
    'insurance',
    'other'
);


ALTER TYPE "iapp"."payment_method" OWNER TO "postgres";


CREATE TYPE "iapp"."payment_status" AS ENUM (
    'unpaid',
    'partial',
    'paid',
    'refunded',
    'waived'
);


ALTER TYPE "iapp"."payment_status" OWNER TO "postgres";


CREATE TYPE "iapp"."refraction_type" AS ENUM (
    'unaided',
    'aided',
    'cycloplegic',
    'final',
    'auto'
);


ALTER TYPE "iapp"."refraction_type" OWNER TO "postgres";


CREATE TYPE "iapp"."report_source" AS ENUM (
    'ai',
    'doctor',
    'external'
);


ALTER TYPE "iapp"."report_source" OWNER TO "postgres";


CREATE TYPE "iapp"."report_state" AS ENUM (
    'draft',
    'final'
);


ALTER TYPE "iapp"."report_state" OWNER TO "postgres";


CREATE TYPE "iapp"."visit_type" AS ENUM (
    'routine',
    'follow_up',
    'retina',
    'refraction',
    'consultation',
    'surgery',
    'emergency',
    'other'
);


ALTER TYPE "iapp"."visit_type" OWNER TO "postgres";


CREATE TYPE "public"."iapp_role" AS ENUM (
    'admin',
    'doctor',
    'secretary',
    'patient'
);


ALTER TYPE "public"."iapp_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."acting_role"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'iapp'
    AS $$
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
end $$;


ALTER FUNCTION "iapp"."acting_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."ai_quota_used"("p_hours" integer DEFAULT 1) RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
  select count(*)::int from iapp.ai_analysis
   where created_by = auth.uid()
     and created_at > now() - make_interval(hours => greatest(p_hours,1))
$$;


ALTER FUNCTION "iapp"."ai_quota_used"("p_hours" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "iapp"."final_report" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "image_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "visit_id" "uuid",
    "report_text" "text" NOT NULL,
    "impression" "text",
    "findings" "jsonb",
    "status" "iapp"."report_state" DEFAULT 'draft'::"iapp"."report_state" NOT NULL,
    "source" "iapp"."report_source" DEFAULT 'doctor'::"iapp"."report_source" NOT NULL,
    "ai_assisted" boolean DEFAULT false NOT NULL,
    "ai_analysis_id" "uuid",
    "authored_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "finalized_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid" DEFAULT "auth"."uid"(),
    "deleted_at" timestamp with time zone,
    CONSTRAINT "chk_final_ai_link" CHECK ((("ai_analysis_id" IS NULL) OR ("ai_assisted" = true))),
    CONSTRAINT "chk_final_never_ai_authored" CHECK (("source" <> 'ai'::"iapp"."report_source")),
    CONSTRAINT "chk_final_stamp" CHECK ((("status" = 'final'::"iapp"."report_state") = ("finalized_at" IS NOT NULL))),
    CONSTRAINT "chk_final_text" CHECK ((("status" <> 'final'::"iapp"."report_state") OR ("length"("btrim"("report_text")) >= 10)))
);


ALTER TABLE "iapp"."final_report" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."ai_to_final_report"("p_analysis_id" "uuid", "p_text" "text" DEFAULT NULL::"text", "p_finalize" boolean DEFAULT false) RETURNS "iapp"."final_report"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'iapp', 'public'
    AS $$
declare a record; rv record; body text; out_row iapp.final_report;
begin
  select * into a from iapp.ai_analysis where id = p_analysis_id and deleted_at is null;
  if a is null then raise exception 'ai_analysis_missing' using errcode='23503'; end if;

  select * into rv from iapp.doctor_review
    where analysis_id = p_analysis_id and superseded_at is null;
  if rv is null then raise exception 'ai_not_reviewed' using errcode='23514'; end if;

  body := coalesce(nullif(btrim(p_text),''),
                   nullif(btrim(rv.edited_impression),''),
                   (select impression_text from iapp.ai_impression
                     where analysis_id = p_analysis_id));
  if body is null or length(btrim(body)) < 3 then
    raise exception 'final_report_empty' using errcode='23514';
  end if;

  insert into iapp.final_report
    (image_id, patient_id, visit_id, report_text, impression,
     findings, status, source, ai_assisted, ai_analysis_id)
  values
    (a.image_id, a.patient_id, a.visit_id, body, body,
     (select jsonb_agg(to_jsonb(f) - 'patient_id')
        from iapp.ai_findings f where f.analysis_id = p_analysis_id),
     case when p_finalize then 'final' else 'draft' end::iapp.report_state,
     'doctor', true, p_analysis_id)
  on conflict (image_id) where deleted_at is null do update
    set report_text = excluded.report_text,
        impression  = excluded.impression,
        findings    = excluded.findings,
        status      = excluded.status,
        ai_assisted = true,
        ai_analysis_id = excluded.ai_analysis_id,
        updated_by  = auth.uid()
  returning * into out_row;

  return out_row;
end $$;


ALTER FUNCTION "iapp"."ai_to_final_report"("p_analysis_id" "uuid", "p_text" "text", "p_finalize" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."audit_imaging_orders"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       declare
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         v_role text; v_action text; v_before jsonb; v_after jsonb;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           v_patient uuid; v_id uuid;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           begin
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             begin v_role := iapp.acting_role(); exception when others then v_role := null; end;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               if tg_op = 'INSERT' then
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   v_action := 'create'; v_patient := new.patient_id; v_id := new.id;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       v_after := jsonb_build_object('order_no',new.order_no,'urgency',new.urgency,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         'status',new.status,'ordered_on',new.ordered_on);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           elsif tg_op = 'UPDATE' then
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               v_action := case when new.deleted_at is not null and old.deleted_at is null
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    then 'delete' else 'update' end;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        v_patient := new.patient_id; v_id := new.id;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            v_before := jsonb_build_object('status',old.status,'urgency',old.urgency,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               'printed_count',old.printed_count);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   v_after  := jsonb_build_object('status',new.status,'urgency',new.urgency,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      'printed_count',new.printed_count);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        else
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            v_action := 'delete'; v_patient := old.patient_id; v_id := old.id;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                v_before := jsonb_build_object('order_no',old.order_no,'status',old.status);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  end if;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    insert into iapp.audit_logs
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        (actor_id, actor_role, patient_id, resource, record_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             action, outcome, before_data, after_data, row_count)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               values
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   (auth.uid(), v_role, v_patient, 'imaging_orders', v_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        v_action, 'allow', v_before, v_after, 1);

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          if tg_op = 'DELETE' then return old; end if;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            return new;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            end
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            $$;


ALTER FUNCTION "iapp"."audit_imaging_orders"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."audit_medical_images"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
declare
  v_role    text;
  v_action  text;
  v_before  jsonb;
  v_after   jsonb;
  v_patient uuid;
  v_id      uuid;
begin
  begin v_role := iapp.acting_role(); exception when others then v_role := null; end;

  if tg_op = 'INSERT' then
    v_action := 'create';
    v_after  := iapp.img_digest(new);
    v_patient := new.patient_id; v_id := new.id;
  elsif tg_op = 'UPDATE' then
    -- Ø§Ù„Ø­Ø°Ù Ø§Ù„Ù†Ø§Ø¹Ù… ÙŠÙØ³Ø¬ÙŽÙ‘Ù„ Ø­Ø°ÙØ§Ù‹ Ù„Ø§ ØªØ¹Ø¯ÙŠÙ„Ø§Ù‹
    v_action := case when new.deleted_at is not null and old.deleted_at is null
                     then 'delete' else 'update' end;
    v_before := iapp.img_digest(old);
    v_after  := iapp.img_digest(new);
    v_patient := new.patient_id; v_id := new.id;
  else
    v_action := 'delete';
    v_before := iapp.img_digest(old);
    v_patient := old.patient_id; v_id := old.id;
  end if;

  insert into iapp.audit_logs
    (actor_id, actor_role, patient_id, resource, record_id,
     action, outcome, before_data, after_data, row_count)
  values
    (auth.uid(), v_role, v_patient, 'medical_images', v_id,
     v_action, 'allow', v_before, v_after, 1);

  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;


ALTER FUNCTION "iapp"."audit_medical_images"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."available_slots"("p_clinic_id" "uuid", "p_date" "date", "p_doctor_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("slot_time" time without time zone, "is_free" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
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
$$;


ALTER FUNCTION "iapp"."available_slots"("p_clinic_id" "uuid", "p_date" "date", "p_doctor_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."block_audit_mutation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin raise exception 'iapp.audit_logs is append-only'; end $$;


ALTER FUNCTION "iapp"."block_audit_mutation"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."appointments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid",
    "guest_name" "text",
    "guest_phone" "text",
    "doctor_id" "uuid",
    "clinic_id" "uuid" NOT NULL,
    "scheduled_date" "date" NOT NULL,
    "scheduled_time" time without time zone NOT NULL,
    "duration_minutes" smallint DEFAULT 10 NOT NULL,
    "slot" "tsrange" GENERATED ALWAYS AS ("tsrange"(("scheduled_date" + "scheduled_time"), (("scheduled_date" + "scheduled_time") + "make_interval"("mins" => ("duration_minutes")::integer)), '[)'::"text")) STORED,
    "status" "iapp"."appointment_status" DEFAULT 'REQUESTED'::"iapp"."appointment_status" NOT NULL,
    "appointment_type" "text",
    "room" "text",
    "notes" "text",
    "source" "iapp"."appointment_source" DEFAULT 'staff'::"iapp"."appointment_source" NOT NULL,
    "requested_at" timestamp with time zone,
    "confirmed_at" timestamp with time zone,
    "confirmed_by" "uuid",
    "arrived_at" timestamp with time zone,
    "waiting_at" timestamp with time zone,
    "in_clinic_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "cancelled_by" "uuid",
    "cancel_reason" "text",
    "no_show_at" timestamp with time zone,
    "rescheduled_from" "uuid",
    "reschedule_count" smallint DEFAULT 0 NOT NULL,
    "visit_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    "legacy_id" "text",
    CONSTRAINT "appointments_duration_minutes_check" CHECK ((("duration_minutes" >= 5) AND ("duration_minutes" <= 240))),
    CONSTRAINT "chk_cancel_reason" CHECK ((("status" <> 'CANCELLED'::"iapp"."appointment_status") OR (("cancel_reason" IS NOT NULL) AND ("length"("btrim"("cancel_reason")) > 2)))),
    CONSTRAINT "chk_cancelled" CHECK ((("status" = 'CANCELLED'::"iapp"."appointment_status") = ("cancelled_at" IS NOT NULL))),
    CONSTRAINT "chk_completed" CHECK ((("status" = 'COMPLETED'::"iapp"."appointment_status") = ("completed_at" IS NOT NULL))),
    CONSTRAINT "chk_no_show" CHECK ((("status" = 'NO_SHOW'::"iapp"."appointment_status") = ("no_show_at" IS NOT NULL))),
    CONSTRAINT "chk_subject" CHECK ((("patient_id" IS NOT NULL) OR (("guest_name" IS NOT NULL) AND ("length"("btrim"("guest_name")) > 1)))),
    CONSTRAINT "chk_time_order" CHECK (((("arrived_at" IS NULL) OR ("confirmed_at" IS NULL) OR ("arrived_at" >= "confirmed_at")) AND (("waiting_at" IS NULL) OR ("arrived_at" IS NULL) OR ("waiting_at" >= "arrived_at")) AND (("in_clinic_at" IS NULL) OR ("waiting_at" IS NULL) OR ("in_clinic_at" >= "waiting_at")) AND (("completed_at" IS NULL) OR ("in_clinic_at" IS NULL) OR ("completed_at" >= "in_clinic_at"))))
);

ALTER TABLE ONLY "iapp"."appointments" REPLICA IDENTITY FULL;

ALTER TABLE ONLY "iapp"."appointments" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."appointments" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."book_appointment"("p_clinic_id" "uuid", "p_date" "date", "p_time" time without time zone, "p_patient_id" "uuid" DEFAULT NULL::"uuid", "p_doctor_id" "uuid" DEFAULT NULL::"uuid", "p_type" "text" DEFAULT NULL::"text", "p_notes" "text" DEFAULT NULL::"text", "p_room" "text" DEFAULT NULL::"text", "p_duration" smallint DEFAULT NULL::smallint, "p_guest_name" "text" DEFAULT NULL::"text", "p_guest_phone" "text" DEFAULT NULL::"text") RETURNS "iapp"."appointments"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
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

  -- Ø¨Ù„Ø§ Ø·Ø¨ÙŠØ¨ Ù…Ø­Ø¯Ø¯: Ø®Ø° Ø§Ù„Ø·Ø¨ÙŠØ¨ Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØŒ Ø­ØªÙ‰ ÙŠÙ†Ø·Ø¨Ù‚ Ù‚ÙŠØ¯ Ù…Ù†Ø¹ Ø§Ù„Ø­Ø¬Ø² Ø§Ù„Ù…Ø²Ø¯ÙˆØ¬
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
end $$;


ALTER FUNCTION "iapp"."book_appointment"("p_clinic_id" "uuid", "p_date" "date", "p_time" time without time zone, "p_patient_id" "uuid", "p_doctor_id" "uuid", "p_type" "text", "p_notes" "text", "p_room" "text", "p_duration" smallint, "p_guest_name" "text", "p_guest_phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."call_patient"("p_id" "uuid") RETURNS "iapp"."appointments"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
  select iapp.transition(p_id, 'IN_CLINIC') $$;


ALTER FUNCTION "iapp"."call_patient"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."cancel_appointment"("p_id" "uuid", "p_reason" "text") RETURNS "iapp"."appointments"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
  select iapp.transition(p_id, 'CANCELLED', p_reason) $$;


ALTER FUNCTION "iapp"."cancel_appointment"("p_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."check_same_patient"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
end $$;


ALTER FUNCTION "iapp"."check_same_patient"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."claim_patient_record"("p_code" "text", "p_phone" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
declare
  v_uid   uuid := auth.uid();
  v_pat   iapp.patients;
  v_tries int;
  v_taken uuid;
begin
  if v_uid is null then
    raise exception 'unauthenticated: Ø³Ø¬Ù‘Ù„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£ÙˆÙ„Ø§Ù‹' using errcode='42501';
  end if;

  -- Ø­Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø§Øª: ÙŠÙ…Ù†Ø¹ ØªØ®Ù…ÙŠÙ† Ø§Ù„Ø£ÙƒÙˆØ§Ø¯ Ø§Ù„Ù…ØªØ³Ù„Ø³Ù„Ø©
  select count(*) into v_tries from public.auth_events
   where identifier = 'claim:'||v_uid::text
     and occurred_at > now() - interval '1 hour';
  if v_tries >= 5 then
    raise exception 'rate_limited: Ù…Ø­Ø§ÙˆÙ„Ø§Øª ÙƒØ«ÙŠØ±Ø© â€” Ø§Ù†ØªØ¸Ø± Ø³Ø§Ø¹Ø©' using errcode='42501';
  end if;

  insert into public.auth_events(identifier, event)
  values ('claim:'||v_uid::text, 'login_fail');

  -- Ù…Ø±ØªØ¨Ø· Ø¨Ø§Ù„ÙØ¹Ù„ØŸ
  if exists (select 1 from public.patient_links where user_id = v_uid and verified) then
    return jsonb_build_object('ok', true, 'already', true);
  end if;

  -- Ø§Ù„Ù…Ø·Ø§Ø¨Ù‚Ø©: Ø§Ù„ÙƒÙˆØ¯ ÙˆØ§Ù„Ù‡Ø§ØªÙ Ù…Ø¹Ù‹Ø§ØŒ ÙˆØ¥Ù„Ø§ Ù„Ø§ Ø´ÙŠØ¡
  select * into v_pat from iapp.patients
   where upper(btrim(patient_code)) = upper(btrim(p_code))
     and iapp.normalize_phone_txt(phone) = iapp.normalize_phone_txt(p_phone)
     and deleted_at is null and is_active
   limit 1;

  if not found then
    -- Ø±Ø³Ø§Ù„Ø© ÙˆØ§Ø­Ø¯Ø© Ù„Ù„Ø­Ø§Ù„ØªÙŠÙ†: Ù„Ø§ Ù†ÙƒØ´Ù Ø£ÙŠ Ø§Ù„Ø­Ù‚Ù„ÙŠÙ† ÙƒØ§Ù† Ø®Ø§Ø·Ø¦Ù‹Ø§
    raise exception 'no_match: Ø§Ù„ÙƒÙˆØ¯ Ø£Ùˆ Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ ØºÙŠØ± ØµØ­ÙŠØ­' using errcode='P0002';
  end if;

  -- Ø§Ù„Ù…Ù„Ù Ù…Ø±ØªØ¨Ø· Ø¨Ø­Ø³Ø§Ø¨ Ø¢Ø®Ø±ØŸ
  select user_id into v_taken from public.patient_links
   where patient_id = v_pat.id::text;
  if v_taken is not null and v_taken <> v_uid then
    raise exception 'already_linked: Ù‡Ø°Ø§ Ø§Ù„Ù…Ù„Ù Ù…Ø±ØªØ¨Ø· Ø¨Ø­Ø³Ø§Ø¨ Ø¢Ø®Ø± â€” ØªÙˆØ§ØµÙ„ Ù…Ø¹ Ø§Ù„Ø¹ÙŠØ§Ø¯Ø©'
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
end $$;


ALTER FUNCTION "iapp"."claim_patient_record"("p_code" "text", "p_phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."complete_appointment"("p_id" "uuid", "p_visit_id" "uuid" DEFAULT NULL::"uuid") RETURNS "iapp"."appointments"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
declare v_row iapp.appointments;
begin
  v_row := iapp.transition(p_id, 'COMPLETED');
  if p_visit_id is not null then
    update iapp.appointments set visit_id = p_visit_id
     where id = p_id returning * into v_row;
  end if;
  return v_row;
end $$;


ALTER FUNCTION "iapp"."complete_appointment"("p_id" "uuid", "p_visit_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."confirm_appointment"("p_id" "uuid") RETURNS "iapp"."appointments"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
  select iapp.transition(p_id, 'CONFIRMED') $$;


ALTER FUNCTION "iapp"."confirm_appointment"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."current_patient_uuid"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
  select p.id
  from public.patient_links pl
  join iapp.patients p on p.legacy_id = pl.patient_id or p.id::text = pl.patient_id
  where pl.user_id = auth.uid() and pl.verified and p.deleted_at is null
$$;


ALTER FUNCTION "iapp"."current_patient_uuid"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."medical_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "visit_id" "uuid",
    "examination_id" "uuid",
    "modality" "iapp"."image_modality" DEFAULT 'unknown'::"iapp"."image_modality" NOT NULL,
    "eye" "iapp"."eye_side",
    "captured_on" "date",
    "storage_provider" "text" DEFAULT 'cloudinary'::"text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "legacy_url" "text",
    "file_name" "text",
    "mime_type" "text",
    "size_bytes" bigint,
    "width" integer,
    "height" integer,
    "checksum" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    "legacy_id" "text",
    "study_date" "date",
    "device" "text",
    "technician" "text",
    "clinical_indication" "text",
    "thumbnail_path" "text",
    "doctor_report" "text",
    "reported_by" "uuid",
    "reported_at" timestamp with time zone,
    "status" "iapp"."imaging_status" DEFAULT 'uploaded'::"iapp"."imaging_status" NOT NULL,
    CONSTRAINT "medical_images_size_bytes_check" CHECK (("size_bytes" >= 0)),
    CONSTRAINT "medical_images_storage_provider_check" CHECK (("storage_provider" = ANY (ARRAY['cloudinary'::"text", 'supabase'::"text", 'external'::"text"])))
);

ALTER TABLE ONLY "iapp"."medical_images" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."medical_images" OWNER TO "postgres";


COMMENT ON COLUMN "iapp"."medical_images"."storage_path" IS 'Ù…Ø³Ø§Ø± Ø§Ù„ÙƒØ§Ø¦Ù† Ø¯Ø§Ø®Ù„ Ø§Ù„Ø­Ø§ÙˆÙŠØ© Ø§Ù„Ø®Ø§ØµØ© medical-imaging. Ù„ÙŠØ³ Ø±Ø§Ø¨Ø·Ø§Ù‹ Ø¹Ø§Ù…Ø§Ù‹.';



COMMENT ON COLUMN "iapp"."medical_images"."legacy_url" IS 'Ø±ÙˆØ§Ø¨Ø· Cloudinary Ø§Ù„Ù‚Ø¯ÙŠÙ…Ø© â€” Ù„Ù„Ù‚Ø±Ø§Ø¡Ø© ÙÙ‚Ø· ÙˆÙ„Ø§ ÙŠÙÙƒØªØ¨ ÙÙŠÙ‡Ø§ Ø´ÙŠØ¡ Ø¬Ø¯ÙŠØ¯.';



COMMENT ON COLUMN "iapp"."medical_images"."thumbnail_path" IS 'Ù…Ø³Ø§Ø± Ø§Ù„Ù…ØµØºÙ‘Ø±Ø© Ø¯Ø§Ø®Ù„ Ù†ÙØ³ Ø§Ù„Ø­Ø§ÙˆÙŠØ© Ø§Ù„Ø®Ø§ØµØ©. ØªÙÙ‚Ø±Ø£ Ø¨Ø±ÙˆØ§Ø¨Ø· Ù…ÙˆÙ‚Ù‘Ø¹Ø© ÙÙ‚Ø·.';



CREATE OR REPLACE FUNCTION "iapp"."img_digest"("r" "iapp"."medical_images") RETURNS "jsonb"
    LANGUAGE "sql" IMMUTABLE
    AS $$
  select jsonb_build_object(
    'modality',     r.modality,
    'eye',          r.eye,
    'study_date',   r.study_date,
    'status',       r.status,
    'device',       r.device,
    'storage_path', r.storage_path,
    'has_report',   (coalesce(btrim(r.doctor_report),'') <> ''),
    'deleted_at',   r.deleted_at)
$$;


ALTER FUNCTION "iapp"."img_digest"("r" "iapp"."medical_images") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."is_doctor"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select coalesce((select role in ('doctor','admin') from public.profiles
                   where id = auth.uid() and is_active), false)
$$;


ALTER FUNCTION "iapp"."is_doctor"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."is_secretary"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select coalesce((select role = 'secretary' from public.profiles
                   where id = auth.uid() and is_active), false)
$$;


ALTER FUNCTION "iapp"."is_secretary"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."log_appointment_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
end $$;


ALTER FUNCTION "iapp"."log_appointment_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."log_event"("p_resource" "text", "p_action" "text", "p_record_id" "uuid" DEFAULT NULL::"uuid", "p_patient_id" "uuid" DEFAULT NULL::"uuid", "p_outcome" "text" DEFAULT 'allow'::"text", "p_reason" "text" DEFAULT NULL::"text", "p_meta" "jsonb" DEFAULT NULL::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
declare v_role text;
begin
  if auth.uid() is null then return; end if;

  if p_action not in ('read','create','update','delete','export','print','link') then
    raise exception 'unsupported_audit_action: %', p_action;
  end if;
  if p_outcome not in ('allow','deny','error') then
    raise exception 'unsupported_audit_outcome: %', p_outcome;
  end if;

  begin v_role := iapp.acting_role(); exception when others then v_role := null; end;

  insert into iapp.audit_logs
    (actor_id, actor_role, patient_id, resource, record_id,
     action, outcome, reason, after_data, row_count)
  values
    (auth.uid(), v_role, p_patient_id, p_resource, p_record_id,
     p_action, p_outcome, p_reason, p_meta, 1);
end
$$;


ALTER FUNCTION "iapp"."log_event"("p_resource" "text", "p_action" "text", "p_record_id" "uuid", "p_patient_id" "uuid", "p_outcome" "text", "p_reason" "text", "p_meta" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."mark_arrived"("p_id" "uuid") RETURNS "iapp"."appointments"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
  select iapp.transition(p_id, 'ARRIVED') $$;


ALTER FUNCTION "iapp"."mark_arrived"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."mark_no_show"("p_id" "uuid") RETURNS "iapp"."appointments"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
  select iapp.transition(p_id, 'NO_SHOW') $$;


ALTER FUNCTION "iapp"."mark_no_show"("p_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."imaging_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_no" "text",
    "patient_id" "uuid" NOT NULL,
    "visit_id" "uuid",
    "doctor_id" "uuid",
    "clinic_id" "uuid",
    "ordered_on" "date" DEFAULT CURRENT_DATE NOT NULL,
    "urgency" "iapp"."order_urgency" DEFAULT 'routine'::"iapp"."order_urgency" NOT NULL,
    "clinical_indication" "text",
    "clinical_notes" "text",
    "status" "iapp"."imaging_order_status" DEFAULT 'requested'::"iapp"."imaging_order_status" NOT NULL,
    "printed_count" integer DEFAULT 0 NOT NULL,
    "printed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone
);


ALTER TABLE "iapp"."imaging_orders" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."mark_order_printed"("p_id" "uuid") RETURNS "iapp"."imaging_orders"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                declare v_row iapp.imaging_orders; v_role text;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                begin
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  if not (iapp.is_doctor() or public.is_admin()) then
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      raise exception 'not_authorized: Ø·Ø¨Ø§Ø¹Ø© Ø§Ù„Ø·Ù„Ø¨ Ù„Ù„Ø·Ø¨ÙŠØ¨ Ø£Ùˆ Ø§Ù„Ù…Ø¯ÙŠØ±';
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        end if;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          update iapp.imaging_orders
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               set printed_at = now(), printed_count = printed_count + 1
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  where id = p_id and deleted_at is null
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     returning * into v_row;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       if v_row.id is null then raise exception 'order_not_found'; end if;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         begin v_role := iapp.acting_role(); exception when others then v_role := null; end;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           insert into iapp.audit_logs
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               (actor_id, actor_role, patient_id, resource, record_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    action, outcome, after_data, row_count)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      values
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          (auth.uid(), v_role, v_row.patient_id, 'imaging_orders', v_row.id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               'print', 'allow',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    jsonb_build_object('order_no', v_row.order_no, 'copy', v_row.printed_count), 1);

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      return v_row;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      end
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      $$;


ALTER FUNCTION "iapp"."mark_order_printed"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."mark_waiting"("p_id" "uuid") RETURNS "iapp"."appointments"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
  select iapp.transition(p_id, 'WAITING') $$;


ALTER FUNCTION "iapp"."mark_waiting"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."my_clinic_ids"() RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
  -- Ø§Ù„Ø·Ø¨ÙŠØ¨ ÙˆØ§Ù„Ù…Ø¯ÙŠØ±: ÙƒÙ„ Ø§Ù„Ø¹ÙŠØ§Ø¯Ø§Øª
  select c.id from iapp.clinics c
   where public.is_admin() or iapp.is_doctor()
  union
  -- Ø§Ù„Ù…ÙˆØ¸Ù Ø§Ù„Ù…ÙØ³Ù†Ø¯ Ù„Ø¹ÙŠØ§Ø¯Ø©: Ø¹ÙŠØ§Ø¯ØªÙ‡ ÙÙ‚Ø·
  select s.clinic_id from iapp.staff s
   where s.profile_id = auth.uid()
     and s.clinic_id is not null
     and s.deleted_at is null
  union
  -- Ù…ÙˆØ¸Ù Ø¨Ù„Ø§ Ø¥Ø³Ù†Ø§Ø¯: ÙƒÙ„ Ø§Ù„Ø¹ÙŠØ§Ø¯Ø§Øª Ø§Ù„Ù†Ø´Ø·Ø© (ÙˆØ¶Ø¹ Ø§Ù„Ø¹ÙŠØ§Ø¯Ø© Ø§Ù„ÙˆØ§Ø­Ø¯Ø©)
  select c.id from iapp.clinics c
   where c.is_active and c.deleted_at is null
     and iapp.is_secretary()
     and not exists (
       select 1 from iapp.staff s2
        where s2.profile_id = auth.uid()
          and s2.clinic_id is not null
          and s2.deleted_at is null)
$$;


ALTER FUNCTION "iapp"."my_clinic_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."my_link_status"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
  select coalesce(
    (select jsonb_build_object('linked', true, 'patient_id', p.id,
                               'name', p.full_name, 'code', p.patient_code)
       from public.patient_links pl
       join iapp.patients p on p.id::text = pl.patient_id
      where pl.user_id = auth.uid() and pl.verified and p.deleted_at is null),
    jsonb_build_object('linked', false))
$$;


ALTER FUNCTION "iapp"."my_link_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."my_patient_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'iapp'
    AS $$
  select p.id from public.patient_links pl
  join iapp.patients p
    on p.id::text = pl.patient_id or p.legacy_id = pl.patient_id
  where pl.user_id = auth.uid() and pl.verified and p.deleted_at is null
$$;


ALTER FUNCTION "iapp"."my_patient_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."normalize_phone"("p" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $_$
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
$_$;


ALTER FUNCTION "iapp"."normalize_phone"("p" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."normalize_phone_txt"("p" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $_$
  select case
    when p is null or btrim(p)='' then null
    else (
      with d as (select regexp_replace(p,'[^0-9]','','g') x)
      select case
        when x ~ '^20[0-9]{10}$' then '0'||substring(x from 3)
        when x ~ '^[0-9]{10}$'   then '0'||x
        else x end from d)
  end
$_$;


ALTER FUNCTION "iapp"."normalize_phone_txt"("p" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."notify_appointment_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
end $$;


ALTER FUNCTION "iapp"."notify_appointment_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."reschedule_appointment"("p_id" "uuid", "p_new_date" "date", "p_new_time" time without time zone, "p_reason" "text" DEFAULT 'Ø¥Ø¹Ø§Ø¯Ø© Ø¬Ø¯ÙˆÙ„Ø©'::"text", "p_new_doctor_id" "uuid" DEFAULT NULL::"uuid", "p_new_room" "text" DEFAULT NULL::"text") RETURNS "iapp"."appointments"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
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
         cancel_reason=coalesce(p_reason,'Ø¥Ø¹Ø§Ø¯Ø© Ø¬Ø¯ÙˆÙ„Ø©')
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
end $$;


ALTER FUNCTION "iapp"."reschedule_appointment"("p_id" "uuid", "p_new_date" "date", "p_new_time" time without time zone, "p_reason" "text", "p_new_doctor_id" "uuid", "p_new_room" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."review_appointment"("p_id" "uuid") RETURNS "iapp"."appointments"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
  select iapp.transition(p_id, 'PENDING') $$;


ALTER FUNCTION "iapp"."review_appointment"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."soft_delete"("p_table" "text", "p_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'iapp'
    AS $_$
begin
  execute format(
    'update iapp.%I set deleted_at = now(), updated_by = auth.uid()
     where id = $1 and deleted_at is null', p_table)
  using p_id;
end $_$;


ALTER FUNCTION "iapp"."soft_delete"("p_table" "text", "p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."storage_patient_of"("p_name" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
declare v uuid;
begin
  if p_name is null or p_name !~ '^p/[0-9a-fA-F-]{36}/' then
    return null;
  end if;
  begin
    v := split_part(p_name, '/', 2)::uuid;
  exception when others then
    return null;
  end;
  return v;
end
$$;


ALTER FUNCTION "iapp"."storage_patient_of"("p_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."sweep_no_shows"("p_grace_minutes" integer DEFAULT 60) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
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
end $$;


ALTER FUNCTION "iapp"."sweep_no_shows"("p_grace_minutes" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "iapp"."sweep_no_shows"("p_grace_minutes" integer) IS 'Marks past CONFIRMED appointments as NO_SHOW after a grace period. Only touches CONFIRMED - anything that reached ARRIVED is left alone, because a patient who was seen must never be recorded as absent.';



CREATE OR REPLACE FUNCTION "iapp"."sync_last_visit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'iapp'
    AS $$
      begin
        update iapp.patients
             set last_visit = greatest(coalesce(last_visit, new.visit_date), new.visit_date)
                where id = new.patient_id;
                  return new;
                  end $$;


ALTER FUNCTION "iapp"."sync_last_visit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."sync_patient_phone"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.phone_normalized := iapp.normalize_phone(new.phone);
  return new;
end $$;


ALTER FUNCTION "iapp"."sync_patient_phone"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."sync_payment_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
end $$;


ALTER FUNCTION "iapp"."sync_payment_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."tg_ai_audit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
declare
  v_action  text;
  v_pid     uuid;
  v_rec     uuid;
  v_meta    jsonb;
  v_role    text;
begin
  begin v_role := iapp.acting_role(); exception when others then v_role := null; end;

  if tg_table_name = 'ai_analysis' then
    v_pid := new.patient_id; v_rec := new.id;
    v_action := 'ai_analyze';
    v_meta := jsonb_build_object(
      'event','ai_analysis','op',tg_op,'status',new.status,
      'image_id',new.image_id,'modality',new.modality,'eye',new.eye,
      'provider',new.provider,'model',new.model,
      'prompt_version',new.prompt_version,'attempt',new.attempt,
      'latency_ms',new.latency_ms,'tokens_in',new.tokens_in,
      'tokens_out',new.tokens_out,'error_code',new.error_code);

  elsif tg_table_name = 'doctor_review' then
    v_pid := new.patient_id; v_rec := new.analysis_id;
    v_action := 'update';
    v_meta := jsonb_build_object(
      'event','ai_doctor_review','action',new.action,
      'image_id',new.image_id,'reviewer',new.reviewer_id,
      'has_edit',(new.edited_impression is not null),
      'reason',new.reject_reason);

  else  -- final_report
    v_pid := new.patient_id; v_rec := new.id;
    v_action := case when tg_op = 'INSERT' then 'create' else 'update' end;
    v_meta := jsonb_build_object(
      'event','final_report','op',tg_op,'status',new.status,
      'image_id',new.image_id,'ai_assisted',new.ai_assisted,
      'ai_analysis_id',new.ai_analysis_id,'author',new.authored_by,
      'chars',length(coalesce(new.report_text,'')));
  end if;

  insert into iapp.audit_logs
    (actor_id, actor_role, patient_id, resource, record_id,
     action, outcome, after_data)
  values
    (auth.uid(), v_role, v_pid, tg_table_name, v_rec,
     v_action, 'allow', v_meta);
  return null;
exception when others then
  -- Ø§Ù„ØªØ¯Ù‚ÙŠÙ‚ Ù„Ø§ ÙŠÙØ³Ù‚Ø· Ø¹Ù…Ù„Ø§Ù‹ Ø³Ø±ÙŠØ±ÙŠØ§Ù‹: Ù„Ùˆ ØªØ¹Ø°Ù‘Ø±Øª Ø§Ù„ÙƒØªØ§Ø¨Ø© (Ù‚Ø³Ù… Ù…ÙÙ‚ÙˆØ¯ Ù…Ø«Ù„Ø§Ù‹)
  -- ÙŠÙØ±ÙØ¹ ØªØ­Ø°ÙŠØ± ÙˆÙŠÙ…Ø¶ÙŠ Ø§Ù„ØµÙÙ‘. Ø§Ù„ØµÙ…Øª Ø§Ù„ØªØ§Ù… Ù‡Ù†Ø§ Ø£Ø³ÙˆØ£ Ù…Ù† Ø§Ù„ØªØ­Ø°ÙŠØ±.
  raise warning 'ai audit failed for %: %', tg_table_name, sqlerrm;
  return null;
end $$;


ALTER FUNCTION "iapp"."tg_ai_audit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."tg_ai_finding_guard"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
declare a record; ok boolean;
begin
  select patient_id, modality, eye into a
    from iapp.ai_analysis where id = new.analysis_id;
  if a is null then
    raise exception 'ai_analysis_missing' using errcode='23503';
  end if;
  new.patient_id := a.patient_id;
  if new.modality is null then new.modality := a.modality; end if;
  if new.eye is null then new.eye := a.eye; end if;
  if new.modality <> a.modality then
    raise exception 'ai_finding_modality_mismatch: % <> %', new.modality, a.modality
      using errcode='23514';
  end if;
  select exists(select 1 from iapp.ai_finding_catalog
                 where modality = new.modality and category = new.category
                   and is_active) into ok;
  if not ok then
    raise exception 'ai_unknown_category: % not allowed for %', new.category, new.modality
      using errcode='23514';
  end if;
  return new;
end $$;


ALTER FUNCTION "iapp"."tg_ai_finding_guard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."tg_ai_immutable"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.image_id   is distinct from old.image_id
  or new.patient_id is distinct from old.patient_id
  or new.created_by is distinct from old.created_by then
    raise exception 'ai_analysis_immutable: image/patient/actor cannot change'
      using errcode='23514';
  end if;
  return new;
end $$;


ALTER FUNCTION "iapp"."tg_ai_immutable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."tg_ai_supersede"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
begin
  if new.status = 'succeeded'
     and (tg_op = 'INSERT' or old.status is distinct from 'succeeded') then
    update iapp.ai_analysis
       set status = 'superseded'
     where image_id = new.image_id and id <> new.id
       and status = 'succeeded' and deleted_at is null;
  end if;
  if new.status in ('succeeded','failed') and new.finished_at is null then
    new.finished_at := now();
  end if;
  return new;
end $$;


ALTER FUNCTION "iapp"."tg_ai_supersede"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."tg_final_requires_review"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
declare act iapp.ai_review_action;
begin
  if new.authored_by is null then
    raise exception 'final_report_needs_human_author' using errcode='23502';
  end if;
  if new.source = 'ai' then
    raise exception 'final_report_cannot_be_ai_sourced' using errcode='23514';
  end if;

  if new.ai_analysis_id is not null then
    select action into act from iapp.doctor_review
      where analysis_id = new.ai_analysis_id and superseded_at is null;
    if act is null then
      raise exception 'ai_not_reviewed: doctor review required before use'
        using errcode='23514';
    end if;
    if act not in ('accept','edit') then
      raise exception 'ai_review_not_approved: current decision is %', act
        using errcode='23514';
    end if;
    new.ai_assisted := true;
  end if;

  if new.status = 'final' and new.finalized_at is null then
    new.finalized_at := now();
  end if;
  if new.status = 'draft' then
    new.finalized_at := null;
  end if;
  new.updated_at := now();
  return new;
end $$;


ALTER FUNCTION "iapp"."tg_final_requires_review"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."tg_imaging_defaults"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- study_date Ù‡Ùˆ Ø§Ù„ØªØ§Ø±ÙŠØ® Ø§Ù„Ù…Ø¹ØªÙ…Ø¯ØŒ Ùˆ captured_on ÙŠØ¨Ù‚Ù‰ Ù…Ø±Ø¢Ø© Ù„Ù‡
  -- Ø­ØªÙ‰ Ù„Ø§ ØªÙ†ÙƒØ³Ø± Ø§Ù„Ø´Ø§Ø´Ø§Øª Ø§Ù„ØªÙŠ Ù…Ø§ Ø²Ø§Ù„Øª ØªÙ‚Ø±Ø£ Ø§Ù„Ø¹Ù…ÙˆØ¯ Ø§Ù„Ù‚Ø¯ÙŠÙ….
  if new.study_date is null then
    new.study_date := coalesce(new.captured_on, current_date);
  end if;
  new.captured_on := new.study_date;

  if new.study_date > current_date then
    raise exception 'imaging_future_date: ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¯Ø±Ø§Ø³Ø© ÙÙŠ Ø§Ù„Ù…Ø³ØªÙ‚Ø¨Ù„';
  end if;

  if new.status = 'reported'::iapp.imaging_status
     and coalesce(btrim(new.doctor_report), '') = '' then
    raise exception 'imaging_report_required: Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø§Ø¹ØªÙ…Ø§Ø¯ Ø¯Ø±Ø§Ø³Ø© Ø¨Ù„Ø§ ØªÙ‚Ø±ÙŠØ±';
  end if;

  if new.status = 'reported'::iapp.imaging_status then
    if new.reported_at is null then new.reported_at := now(); end if;
    if new.reported_by is null then new.reported_by := auth.uid(); end if;
  end if;

  return new;
end
$$;


ALTER FUNCTION "iapp"."tg_imaging_defaults"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."tg_imaging_order_defaults"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
                                                                                                                                                                                                                                                                                                                                                                                                                                       begin
                                                                                                                                                                                                                                                                                                                                                                                                                                         if tg_op = 'INSERT' then
                                                                                                                                                                                                                                                                                                                                                                                                                                             if new.order_no is null then
                                                                                                                                                                                                                                                                                                                                                                                                                                                   new.order_no := 'IMG-' || to_char(coalesce(new.ordered_on, current_date), 'YYYY')
                                                                                                                                                                                                                                                                                                                                                                                                                                                                       || '-' || lpad(nextval('iapp.imaging_order_seq')::text, 5, '0');
                                                                                                                                                                                                                                                                                                                                                                                                                                                                           end if;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                               if new.created_by is null then new.created_by := auth.uid(); end if;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 end if;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   if new.ordered_on > current_date then
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       raise exception 'order_future_date: ØªØ§Ø±ÙŠØ® Ø§Ù„Ø·Ù„Ø¨ ÙÙŠ Ø§Ù„Ù…Ø³ØªÙ‚Ø¨Ù„';
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         end if;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           return new;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           end
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           $$;


ALTER FUNCTION "iapp"."tg_imaging_order_defaults"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."tg_reject_noop_transition"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- Ø§Ù„Ø­Ø§Ù„Ø© Ù„Ù… ØªØªØºÙŠÙ‘Ø±: Ù…Ø³Ù…ÙˆØ­ ØªÙ…Ø§Ù…Ø§Ù‹ Ù„ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø£Ùˆ Ø§Ù„ØºØ±ÙØ© Ø£Ùˆ Ø§Ù„Ø¬Ø¯ÙˆÙ„Ø©.
  if new.status is not distinct from old.status then

    -- ØºÙŠØ± Ø§Ù„Ù…Ø³Ù…ÙˆØ­: Ø¥Ø¹Ø§Ø¯Ø© ÙƒØªØ§Ø¨Ø© Ø£Ø«Ø± Ø§Ù„ÙØ¹Ù„ Ù†ÙØ³Ù‡. Ù„Ø§ ÙŠØ­Ø¯Ø« Ø¥Ù„Ø§ Ø¨ØªÙ†ÙÙŠØ°Ù‡ Ù…Ø±ØªÙŠÙ†.
    if (new.confirmed_at is distinct from old.confirmed_at)
    or (new.arrived_at   is distinct from old.arrived_at)
    or (new.waiting_at   is distinct from old.waiting_at)
    or (new.in_clinic_at is distinct from old.in_clinic_at)
    or (new.completed_at is distinct from old.completed_at)
    or (new.cancelled_at is distinct from old.cancelled_at)
    or (new.no_show_at   is distinct from old.no_show_at)
    -- â†“ Ù‡Ø°Ø§Ù† Ø§Ù„Ø³Ø·Ø±Ø§Ù† Ù‡Ù…Ø§ Ø§Ù„Ø¥ØµÙ„Ø§Ø­ Ø§Ù„ÙØ¹Ù„ÙŠ ÙÙŠ Ù‚Ø§Ø¹Ø¯ØªÙƒ.
    or (new.confirmed_by is distinct from old.confirmed_by)
    or (new.cancelled_by is distinct from old.cancelled_by)
    then
      raise exception 'already_in_state: Ø§Ù„Ù…ÙˆØ¹Ø¯ % ÙÙŠ Ø­Ø§Ù„Ø© % Ø¨Ø§Ù„ÙØ¹Ù„', old.id, old.status
        using errcode = '55000';
    end if;
  end if;
  return new;
end $$;


ALTER FUNCTION "iapp"."tg_reject_noop_transition"() OWNER TO "postgres";


COMMENT ON FUNCTION "iapp"."tg_reject_noop_transition"() IS 'Ø§Ù„Ù…Ø±Ø­Ù„Ø© 8: ÙŠÙ…Ù†Ø¹ Ø§Ù„ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¶Ø§Ø¦Ø¹ Ø­ÙŠÙ† ÙŠÙ†ÙÙ‘Ø° Ø´Ø®ØµØ§Ù† Ù†ÙØ³ Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡ ÙÙŠ Ù†ÙØ³ Ø§Ù„Ù„Ø­Ø¸Ø©. ÙŠØ±Ø§Ù‚Ø¨ Ø£Ø¹Ù…Ø¯Ø© Ø§Ù„ÙØ§Ø¹Ù„ Ù„Ø£Ù† iapp.transition ØªÙƒØªØ¨Ù‡Ø§ Ø¨Ù„Ø§ Ø´Ø±Ø· Ø¹Ù„Ù‰ ØªØºÙŠÙ‘Ø± Ø§Ù„Ø­Ø§Ù„Ø©. Ø§Ù„Ø§Ø³Ù… ÙŠØ¨Ø¯Ø£ Ø¨Ù€ 00 Ù„ÙŠÙÙ†ÙÙŽÙ‘Ø° Ù‚Ø¨Ù„ Ù…Ø´ØºÙ‘Ù„ Ø§Ù„ØªØ­Ù‚Ù‚ â€” ØªØ±ØªÙŠØ¨ Ø§Ù„Ù…Ø´ØºÙ‘Ù„Ø§Øª Ø£Ø¨Ø¬Ø¯ÙŠ.';



CREATE OR REPLACE FUNCTION "iapp"."tg_review_guard"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
declare a record;
begin
  select image_id, patient_id, status into a
    from iapp.ai_analysis where id = new.analysis_id;
  if a is null then
    raise exception 'ai_analysis_missing' using errcode='23503';
  end if;
  -- ØªØ­Ù„ÙŠÙ„ ÙØ§Ø´Ù„ Ù„Ø§ ÙŠÙØ±Ø§Ø¬ÙŽØ¹: Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù…Ø§ ÙŠÙÙ‚Ø¨Ù„ Ø£Ùˆ ÙŠÙØ¹Ø¯ÙŽÙ‘Ù„.
  if a.status = 'failed' then
    raise exception 'ai_review_on_failed_run' using errcode='23514';
  end if;
  new.image_id   := a.image_id;
  new.patient_id := a.patient_id;
  if new.reviewer_id is null then
    raise exception 'ai_review_needs_reviewer' using errcode='23502';
  end if;
  update iapp.doctor_review set superseded_at = now()
   where analysis_id = new.analysis_id and superseded_at is null and id <> new.id;
  return new;
end $$;


ALTER FUNCTION "iapp"."tg_review_guard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."touch_row"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
end $$;


ALTER FUNCTION "iapp"."touch_row"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."transition"("p_appointment_id" "uuid", "p_to" "iapp"."appointment_status", "p_reason" "text" DEFAULT NULL::"text") RETURNS "iapp"."appointments"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'iapp', 'public'
    AS $$
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
end $$;


ALTER FUNCTION "iapp"."transition"("p_appointment_id" "uuid", "p_to" "iapp"."appointment_status", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iapp"."validate_appointment_transition"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
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
end $_$;


ALTER FUNCTION "iapp"."validate_appointment_transition"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."block_audit_mutation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  raise exception 'audit_log is append-only';
end $$;


ALTER FUNCTION "public"."block_audit_mutation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_patient_id"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select patient_id from public.patient_links
  where user_id = auth.uid() and verified
$$;


ALTER FUNCTION "public"."current_patient_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_role"() RETURNS "public"."iapp_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select role from public.profiles
  where id = auth.uid() and is_active
$$;


ALTER FUNCTION "public"."current_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_profile_role"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'ØºÙŠØ± Ù…Ø³Ù…ÙˆØ­: Ø§Ù„Ù…Ø¯ÙŠØ± ÙˆØ­Ø¯Ù‡ ÙŠØºÙŠÙ‘Ø± Ø§Ù„Ø£Ø¯ÙˆØ§Ø±';
    end if;
    if new.id = auth.uid() then
      raise exception 'ØºÙŠØ± Ù…Ø³Ù…ÙˆØ­: Ù„Ø§ ÙŠÙ…ÙƒÙ† ØªØºÙŠÙŠØ± Ø¯ÙˆØ±Ùƒ Ø¨Ù†ÙØ³Ùƒ';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;


ALTER FUNCTION "public"."guard_profile_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, role, phone, full_name)
  values (
    new.id,
    'patient',
    new.phone,
    coalesce(new.raw_user_meta_data->>'full_name', null)
  )
  on conflict (id) do nothing;
  return new;
end $$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select coalesce((select role='admin' from public.profiles
                   where id = auth.uid() and is_active), false)
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_staff"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select coalesce((select role in ('admin','doctor','secretary')
                   from public.profiles where id = auth.uid() and is_active), false)
$$;


ALTER FUNCTION "public"."is_staff"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."ai_analysis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "image_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "visit_id" "uuid",
    "modality" "text" NOT NULL,
    "eye" "iapp"."eye_side",
    "status" "iapp"."ai_run_status" DEFAULT 'queued'::"iapp"."ai_run_status" NOT NULL,
    "attempt" smallint DEFAULT 1 NOT NULL,
    "parent_id" "uuid",
    "provider" "text" DEFAULT 'anthropic'::"text" NOT NULL,
    "model" "text",
    "prompt_version" "text" DEFAULT 'v1'::"text" NOT NULL,
    "request_meta" "jsonb",
    "raw_response" "jsonb",
    "latency_ms" integer,
    "tokens_in" integer,
    "tokens_out" integer,
    "error_code" "text",
    "error_message" "text",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "finished_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "deleted_at" timestamp with time zone,
    CONSTRAINT "chk_ai_attempt" CHECK ((("attempt" >= 1) AND ("attempt" <= 20))),
    CONSTRAINT "chk_ai_failed_has_reason" CHECK ((("status" <> 'failed'::"iapp"."ai_run_status") OR ("error_message" IS NOT NULL))),
    CONSTRAINT "chk_ai_no_self_parent" CHECK ((("parent_id" IS NULL) OR ("parent_id" <> "id")))
);


ALTER TABLE "iapp"."ai_analysis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."ai_finding_catalog" (
    "modality" "text" NOT NULL,
    "category" "text" NOT NULL,
    "seq" smallint DEFAULT 0 NOT NULL,
    "label_ar" "text" NOT NULL,
    "label_en" "text" NOT NULL,
    "value_kind" "text" DEFAULT 'text'::"text" NOT NULL,
    "unit" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    CONSTRAINT "chk_cat_modality" CHECK (("modality" = ANY (ARRAY['fundus'::"text", 'oct'::"text", 'octa'::"text", 'ffa'::"text", 'pentacam'::"text", 'visual_field'::"text", 'uwf_fundus'::"text", 'uwf_oct'::"text", 'uwf_octa'::"text", 'b_scan'::"text", 'other'::"text"]))),
    CONSTRAINT "chk_cat_value_kind" CHECK (("value_kind" = ANY (ARRAY['text'::"text", 'numeric'::"text", 'boolean'::"text", 'grade'::"text"])))
);


ALTER TABLE "iapp"."ai_finding_catalog" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."ai_findings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "analysis_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "modality" "text" NOT NULL,
    "category" "text" NOT NULL,
    "eye" "iapp"."eye_side",
    "seq" smallint DEFAULT 0 NOT NULL,
    "present" boolean,
    "value_text" "text",
    "value_num" numeric(10,3),
    "unit" "text",
    "severity" "iapp"."ai_severity" DEFAULT 'unknown'::"iapp"."ai_severity" NOT NULL,
    "confidence" numeric(4,3),
    "detail" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_find_confidence" CHECK ((("confidence" IS NULL) OR (("confidence" >= (0)::numeric) AND ("confidence" <= (1)::numeric)))),
    CONSTRAINT "chk_find_has_content" CHECK ((("present" IS NOT NULL) OR ("value_text" IS NOT NULL) OR ("value_num" IS NOT NULL) OR ("detail" IS NOT NULL)))
);


ALTER TABLE "iapp"."ai_findings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."ai_impression" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "analysis_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "impression_text" "text" NOT NULL,
    "differentials" "jsonb",
    "recommendations" "text",
    "urgency" "iapp"."ai_urgency" DEFAULT 'routine'::"iapp"."ai_urgency" NOT NULL,
    "confidence" numeric(4,3),
    "limitations" "text",
    "is_final" boolean GENERATED ALWAYS AS (false) STORED,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_ai_never_final" CHECK (("is_final" = false)),
    CONSTRAINT "chk_imp_confidence" CHECK ((("confidence" IS NULL) OR (("confidence" >= (0)::numeric) AND ("confidence" <= (1)::numeric)))),
    CONSTRAINT "chk_imp_not_empty" CHECK (("length"("btrim"("impression_text")) >= 3))
);


ALTER TABLE "iapp"."ai_impression" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."appointment_status_history" (
    "id" bigint NOT NULL,
    "appointment_id" "uuid" NOT NULL,
    "from_status" "iapp"."appointment_status",
    "to_status" "iapp"."appointment_status" NOT NULL,
    "actor_id" "uuid",
    "actor_role" "text",
    "reason" "text",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "iapp"."appointment_status_history" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "iapp"."appointment_status_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "iapp"."appointment_status_history_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "iapp"."appointment_status_history_id_seq" OWNED BY "iapp"."appointment_status_history"."id";



CREATE TABLE IF NOT EXISTS "iapp"."appointment_transitions" (
    "from_status" "iapp"."appointment_status" NOT NULL,
    "to_status" "iapp"."appointment_status" NOT NULL,
    "allowed_roles" "text"[] NOT NULL,
    "sets_timestamp" "text",
    "requires_reason" boolean DEFAULT false NOT NULL,
    "description" "text"
);


ALTER TABLE "iapp"."appointment_transitions" OWNER TO "postgres";


COMMENT ON TABLE "iapp"."appointment_transitions" IS 'The complete lifecycle. Any (from,to) pair absent from this table is rejected. COMPLETED is deliberately terminal - reopening a finished encounter would desynchronise the linked visit record.';



CREATE TABLE IF NOT EXISTS "iapp"."audit_logs" (
    "id" bigint NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actor_id" "uuid",
    "actor_role" "text",
    "patient_id" "uuid",
    "resource" "text" NOT NULL,
    "record_id" "uuid",
    "action" "text" NOT NULL,
    "outcome" "text" NOT NULL,
    "reason" "text",
    "before_data" "jsonb",
    "after_data" "jsonb",
    "row_count" integer,
    "ip" "inet",
    "user_agent" "text",
    "request_id" "uuid",
    CONSTRAINT "audit_logs_action_check" CHECK (("action" = ANY (ARRAY['read'::"text", 'create'::"text", 'update'::"text", 'delete'::"text", 'login'::"text", 'logout'::"text", 'export'::"text", 'print'::"text", 'link'::"text", 'ai_analyze'::"text"]))),
    CONSTRAINT "audit_logs_outcome_check" CHECK (("outcome" = ANY (ARRAY['allow'::"text", 'deny'::"text", 'error'::"text"])))
)
PARTITION BY RANGE ("occurred_at");

ALTER TABLE ONLY "iapp"."audit_logs" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."audit_logs" OWNER TO "postgres";


COMMENT ON TABLE "iapp"."audit_logs" IS 'Append-only, partitioned monthly. No soft delete and no FK to patients: the log must survive record deletion. Successor to public.audit_log.';



CREATE SEQUENCE IF NOT EXISTS "iapp"."audit_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "iapp"."audit_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "iapp"."audit_logs_id_seq" OWNED BY "iapp"."audit_logs"."id";



CREATE TABLE IF NOT EXISTS "iapp"."audit_logs_2026_08" (
    "id" bigint DEFAULT "nextval"('"iapp"."audit_logs_id_seq"'::"regclass") NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actor_id" "uuid",
    "actor_role" "text",
    "patient_id" "uuid",
    "resource" "text" NOT NULL,
    "record_id" "uuid",
    "action" "text" NOT NULL,
    "outcome" "text" NOT NULL,
    "reason" "text",
    "before_data" "jsonb",
    "after_data" "jsonb",
    "row_count" integer,
    "ip" "inet",
    "user_agent" "text",
    "request_id" "uuid",
    CONSTRAINT "audit_logs_action_check" CHECK (("action" = ANY (ARRAY['read'::"text", 'create'::"text", 'update'::"text", 'delete'::"text", 'login'::"text", 'logout'::"text", 'export'::"text", 'print'::"text", 'link'::"text", 'ai_analyze'::"text"]))),
    CONSTRAINT "audit_logs_outcome_check" CHECK (("outcome" = ANY (ARRAY['allow'::"text", 'deny'::"text", 'error'::"text"])))
);


ALTER TABLE "iapp"."audit_logs_2026_08" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."audit_logs_2026_09" (
    "id" bigint DEFAULT "nextval"('"iapp"."audit_logs_id_seq"'::"regclass") NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actor_id" "uuid",
    "actor_role" "text",
    "patient_id" "uuid",
    "resource" "text" NOT NULL,
    "record_id" "uuid",
    "action" "text" NOT NULL,
    "outcome" "text" NOT NULL,
    "reason" "text",
    "before_data" "jsonb",
    "after_data" "jsonb",
    "row_count" integer,
    "ip" "inet",
    "user_agent" "text",
    "request_id" "uuid",
    CONSTRAINT "audit_logs_action_check" CHECK (("action" = ANY (ARRAY['read'::"text", 'create'::"text", 'update'::"text", 'delete'::"text", 'login'::"text", 'logout'::"text", 'export'::"text", 'print'::"text", 'link'::"text", 'ai_analyze'::"text"]))),
    CONSTRAINT "audit_logs_outcome_check" CHECK (("outcome" = ANY (ARRAY['allow'::"text", 'deny'::"text", 'error'::"text"])))
);


ALTER TABLE "iapp"."audit_logs_2026_09" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."audit_logs_2026_10" (
    "id" bigint DEFAULT "nextval"('"iapp"."audit_logs_id_seq"'::"regclass") NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actor_id" "uuid",
    "actor_role" "text",
    "patient_id" "uuid",
    "resource" "text" NOT NULL,
    "record_id" "uuid",
    "action" "text" NOT NULL,
    "outcome" "text" NOT NULL,
    "reason" "text",
    "before_data" "jsonb",
    "after_data" "jsonb",
    "row_count" integer,
    "ip" "inet",
    "user_agent" "text",
    "request_id" "uuid",
    CONSTRAINT "audit_logs_action_check" CHECK (("action" = ANY (ARRAY['read'::"text", 'create'::"text", 'update'::"text", 'delete'::"text", 'login'::"text", 'logout'::"text", 'export'::"text", 'print'::"text", 'link'::"text", 'ai_analyze'::"text"]))),
    CONSTRAINT "audit_logs_outcome_check" CHECK (("outcome" = ANY (ARRAY['allow'::"text", 'deny'::"text", 'error'::"text"])))
);


ALTER TABLE "iapp"."audit_logs_2026_10" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."audit_logs_default" (
    "id" bigint DEFAULT "nextval"('"iapp"."audit_logs_id_seq"'::"regclass") NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actor_id" "uuid",
    "actor_role" "text",
    "patient_id" "uuid",
    "resource" "text" NOT NULL,
    "record_id" "uuid",
    "action" "text" NOT NULL,
    "outcome" "text" NOT NULL,
    "reason" "text",
    "before_data" "jsonb",
    "after_data" "jsonb",
    "row_count" integer,
    "ip" "inet",
    "user_agent" "text",
    "request_id" "uuid",
    CONSTRAINT "audit_logs_action_check" CHECK (("action" = ANY (ARRAY['read'::"text", 'create'::"text", 'update'::"text", 'delete'::"text", 'login'::"text", 'logout'::"text", 'export'::"text", 'print'::"text", 'link'::"text", 'ai_analyze'::"text"]))),
    CONSTRAINT "audit_logs_outcome_check" CHECK (("outcome" = ANY (ARRAY['allow'::"text", 'deny'::"text", 'error'::"text"])))
);


ALTER TABLE "iapp"."audit_logs_default" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."clinic_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "day_of_week" smallint NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "slot_minutes" smallint,
    "doctor_id" "uuid",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "chk_schedule_window" CHECK (("end_time" > "start_time")),
    CONSTRAINT "clinic_schedules_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6))),
    CONSTRAINT "clinic_schedules_slot_minutes_check" CHECK ((("slot_minutes" >= 5) AND ("slot_minutes" <= 120)))
);

ALTER TABLE ONLY "iapp"."clinic_schedules" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."clinic_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."clinics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name_ar" "text" NOT NULL,
    "name_en" "text",
    "address" "text",
    "phone" "text",
    "whatsapp" "text",
    "icon" "text",
    "timezone" "text" DEFAULT 'Africa/Cairo'::"text" NOT NULL,
    "slot_minutes" smallint DEFAULT 30 NOT NULL,
    "notes" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    CONSTRAINT "clinics_slot_minutes_check" CHECK ((("slot_minutes" >= 5) AND ("slot_minutes" <= 120)))
);

ALTER TABLE ONLY "iapp"."clinics" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."clinics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."diagnoses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "visit_id" "uuid",
    "examination_id" "uuid",
    "doctor_id" "uuid",
    "diagnosis_text" "text" NOT NULL,
    "icd10_code" "text",
    "eye" "iapp"."eye_side",
    "status" "iapp"."diagnosis_status" DEFAULT 'active'::"iapp"."diagnosis_status" NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "diagnosed_on" "date" DEFAULT CURRENT_DATE NOT NULL,
    "resolved_on" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    "legacy_id" "text",
    CONSTRAINT "chk_dx_resolved" CHECK ((("resolved_on" IS NULL) OR ("resolved_on" >= "diagnosed_on")))
);

ALTER TABLE ONLY "iapp"."diagnoses" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."diagnoses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."doctor_review" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "analysis_id" "uuid" NOT NULL,
    "image_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "action" "iapp"."ai_review_action" NOT NULL,
    "edited_impression" "text",
    "edited_findings" "jsonb",
    "reject_reason" "text",
    "comment" "text",
    "reviewer_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "reviewed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "superseded_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_rev_edit_has_text" CHECK ((("action" <> 'edit'::"iapp"."ai_review_action") OR ("length"("btrim"(COALESCE("edited_impression", ''::"text"))) >= 3))),
    CONSTRAINT "chk_rev_reject_has_reason" CHECK ((("action" <> 'reject'::"iapp"."ai_review_action") OR ("length"("btrim"(COALESCE("reject_reason", ''::"text"))) >= 3)))
);


ALTER TABLE "iapp"."doctor_review" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."doctors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid",
    "full_name_ar" "text" NOT NULL,
    "full_name_en" "text",
    "short_name" "text",
    "title_ar" "text",
    "initial" "text",
    "license_no" "text",
    "specialty" "text" DEFAULT 'ophthalmology'::"text",
    "phone" "text",
    "email" "text",
    "is_primary" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    "legacy_id" "text"
);

ALTER TABLE ONLY "iapp"."doctors" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."doctors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."exam_findings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "examination_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "eye" "iapp"."eye_side" NOT NULL,
    "section" "text" NOT NULL,
    "field" "text" NOT NULL,
    "value" "text",
    "is_normal" boolean,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    CONSTRAINT "chk_finding_field_section" CHECK (((("section" = 'anterior'::"text") AND ("field" = ANY (ARRAY['lids'::"text", 'conjunctiva'::"text", 'cornea'::"text", 'ac'::"text", 'iris'::"text", 'pupil'::"text", 'lens'::"text"]))) OR (("section" = 'posterior'::"text") AND ("field" = ANY (ARRAY['vitreous'::"text", 'disc'::"text", 'cd_ratio'::"text", 'macula'::"text", 'vessels'::"text", 'periphery'::"text"])))))
);


ALTER TABLE "iapp"."exam_findings" OWNER TO "postgres";


COMMENT ON TABLE "iapp"."exam_findings" IS 'Ù…ÙˆØ¬ÙˆØ¯Ø§Øª Ø§Ù„Ù‚Ø·Ø§Ø¹ Ø§Ù„Ø£Ù…Ø§Ù…ÙŠ ÙˆØ§Ù„Ø®Ù„ÙÙŠØŒ ØµÙ Ù„ÙƒÙ„ (ÙØ­ØµØŒ Ø¹ÙŠÙ†ØŒ Ø­Ù‚Ù„) â€” ØªØ¯Ø¹Ù… OD/OS/OU';



COMMENT ON COLUMN "iapp"."exam_findings"."value" IS 'Ù†Øµ Ø­Ø±Ù‘. Ø§Ù„Ù‚ÙˆØ§Ø¦Ù… ÙÙŠ Ø§Ù„ÙˆØ§Ø¬Ù‡Ø© Ø§Ù‚ØªØ±Ø§Ø­ Ù„Ø§ Ø­ØµØ±';



CREATE TABLE IF NOT EXISTS "iapp"."examinations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "visit_id" "uuid",
    "doctor_id" "uuid",
    "exam_date" "date" NOT NULL,
    "chief_complaint" "text",
    "va_right" "text",
    "va_left" "text",
    "va_right_corrected" "text",
    "va_left_corrected" "text",
    "color_vision" "text",
    "contrast_sensitivity" "text",
    "cover_test" "text",
    "anterior_segment_right" "text",
    "anterior_segment_left" "text",
    "anterior_segment" "text",
    "posterior_segment_right" "text",
    "posterior_segment_left" "text",
    "posterior_segment" "text",
    "treatment_plan" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    "legacy_id" "text",
    "va_right_ph" "text",
    "va_left_ph" "text"
);

ALTER TABLE ONLY "iapp"."examinations" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."examinations" OWNER TO "postgres";


COMMENT ON COLUMN "iapp"."examinations"."va_right" IS 'UCVA OD â€” Ø­Ø¯Ø© Ø§Ù„Ø¥Ø¨ØµØ§Ø± Ø¨Ù„Ø§ ØªØµØ­ÙŠØ­ØŒ Ù†Øµ Ù„Ø§ Ø±Ù‚Ù…';



COMMENT ON COLUMN "iapp"."examinations"."va_left" IS 'UCVA OS';



COMMENT ON COLUMN "iapp"."examinations"."va_right_corrected" IS 'BCVA OD â€” Ø¨Ø£ÙØ¶Ù„ ØªØµØ­ÙŠØ­';



COMMENT ON COLUMN "iapp"."examinations"."va_left_corrected" IS 'BCVA OS';



COMMENT ON COLUMN "iapp"."examinations"."anterior_segment" IS 'Legacy un-lateralised field from iapp_exams. New records should use the _right/_left columns; this is preserved so migration is lossless.';



COMMENT ON COLUMN "iapp"."examinations"."va_right_ph" IS 'PH OD â€” Ø¨Ø§Ù„Ø«Ù‚Ø¨';



COMMENT ON COLUMN "iapp"."examinations"."va_left_ph" IS 'PH OS â€” Ø¨Ø§Ù„Ø«Ù‚Ø¨';



CREATE TABLE IF NOT EXISTS "iapp"."follow_ups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "visit_id" "uuid",
    "examination_id" "uuid",
    "doctor_id" "uuid",
    "clinic_id" "uuid",
    "due_date" "date" NOT NULL,
    "reason" "text",
    "status" "iapp"."follow_up_status" DEFAULT 'pending'::"iapp"."follow_up_status" NOT NULL,
    "notified_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "resulting_appointment_id" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    "legacy_id" "text"
);

ALTER TABLE ONLY "iapp"."follow_ups" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."follow_ups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."image_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "image_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "source" "iapp"."report_source" DEFAULT 'ai'::"iapp"."report_source" NOT NULL,
    "model_name" "text",
    "report_text" "text" NOT NULL,
    "findings" "jsonb",
    "confidence" numeric(4,3),
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "is_approved" boolean DEFAULT false NOT NULL,
    "consent_recorded" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    CONSTRAINT "chk_report_review" CHECK (("is_approved" = ("reviewed_at" IS NOT NULL))),
    CONSTRAINT "image_reports_confidence_check" CHECK ((("confidence" >= (0)::numeric) AND ("confidence" <= (1)::numeric)))
);

ALTER TABLE ONLY "iapp"."image_reports" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."image_reports" OWNER TO "postgres";


COMMENT ON TABLE "iapp"."image_reports" IS 'AI output was NEVER persisted in the current system (discarded on unmount). This table starts empty apart from imgmeta notes. See MIGRATION_MAP F-11.';



CREATE TABLE IF NOT EXISTS "iapp"."imaging_order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "seq" smallint DEFAULT 1 NOT NULL,
    "modality" "iapp"."image_modality" NOT NULL,
    "eye" "iapp"."eye_side" NOT NULL,
    "notes" "text",
    "image_id" "uuid",
    "done" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_order_item_seq" CHECK ((("seq" >= 1) AND ("seq" <= 12)))
);


ALTER TABLE "iapp"."imaging_order_items" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "iapp"."imaging_order_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "iapp"."imaging_order_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."iop_measurements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "examination_id" "uuid",
    "visit_id" "uuid",
    "measured_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "eye" "iapp"."eye_side" NOT NULL,
    "value_mmhg" numeric(4,1) NOT NULL,
    "method" "text" DEFAULT 'unknown'::"text",
    "is_post_dilation" boolean DEFAULT false NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    "legacy_id" "text",
    CONSTRAINT "iop_measurements_eye_check" CHECK (("eye" = ANY (ARRAY['OD'::"iapp"."eye_side", 'OS'::"iapp"."eye_side"]))),
    CONSTRAINT "iop_measurements_value_mmhg_check" CHECK ((("value_mmhg" >= (0)::numeric) AND ("value_mmhg" <= (80)::numeric)))
);

ALTER TABLE ONLY "iapp"."iop_measurements" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."iop_measurements" OWNER TO "postgres";


COMMENT ON COLUMN "iapp"."iop_measurements"."method" IS 'Goldmann Â· NCT Â· Tonopen Â· iCare Â· Perkins Â· digital â€” Ø±Ù‚Ù…Ø§Ù† Ø¨Ø¬Ù‡Ø§Ø²ÙŠÙ† Ù…Ø®ØªÙ„ÙÙŠÙ† Ù„Ø§ ÙŠÙÙ‚Ø§Ø±Ù†Ø§Ù†';



CREATE TABLE IF NOT EXISTS "iapp"."medications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "name_ar" "text",
    "generic_name" "text",
    "form" "iapp"."medication_form" DEFAULT 'other'::"iapp"."medication_form" NOT NULL,
    "strength" "text",
    "is_custom" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);

ALTER TABLE ONLY "iapp"."medications" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."medications" OWNER TO "postgres";


COMMENT ON TABLE "iapp"."medications" IS 'Catalogue. Seeded from DEFAULT_DRUGS (index.html:1906 area) plus each device''s localStorage iapp_custom_drugs, which must be collected manually - it was never synced to the server. See MIGRATION_MAP F-9.';



CREATE TABLE IF NOT EXISTS "iapp"."migration_issues" (
    "id" bigint NOT NULL,
    "run_id" "uuid",
    "severity" "text" NOT NULL,
    "source_key" "text",
    "source_id" "text",
    "field" "text",
    "issue" "text" NOT NULL,
    "raw_value" "jsonb",
    CONSTRAINT "migration_issues_severity_check" CHECK (("severity" = ANY (ARRAY['blocker'::"text", 'warn'::"text", 'info'::"text"])))
);

ALTER TABLE ONLY "iapp"."migration_issues" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."migration_issues" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "iapp"."migration_issues_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "iapp"."migration_issues_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "iapp"."migration_issues_id_seq" OWNED BY "iapp"."migration_issues"."id";



CREATE TABLE IF NOT EXISTS "iapp"."migration_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "finished_at" timestamp with time zone,
    "mode" "text" NOT NULL,
    "source_hash" "text",
    "stats" "jsonb",
    "errors" "jsonb",
    "notes" "text",
    CONSTRAINT "migration_runs_mode_check" CHECK (("mode" = ANY (ARRAY['dry_run'::"text", 'apply'::"text"])))
);

ALTER TABLE ONLY "iapp"."migration_runs" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."migration_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid",
    "profile_id" "uuid",
    "channel" "iapp"."notification_channel" DEFAULT 'in_app'::"iapp"."notification_channel" NOT NULL,
    "status" "iapp"."notification_status" DEFAULT 'pending'::"iapp"."notification_status" NOT NULL,
    "title" "text",
    "body" "text" NOT NULL,
    "payload" "jsonb",
    "related_resource" "text",
    "related_id" "uuid",
    "scheduled_for" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "read_at" timestamp with time zone,
    "error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "chk_notif_target" CHECK ((("patient_id" IS NOT NULL) OR ("profile_id" IS NOT NULL)))
);

ALTER TABLE ONLY "iapp"."notifications" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "iapp"."notifications" IS 'NEW capability. No existing data migrates here - the current system has no notification storage. Starts empty. See MIGRATION_MAP F-12.';



CREATE TABLE IF NOT EXISTS "iapp"."patients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_code" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "date_of_birth" "date",
    "age_at_registration" smallint,
    "gender" "iapp"."gender" DEFAULT 'unknown'::"iapp"."gender" NOT NULL,
    "phone" "text",
    "phone_normalized" "text",
    "alt_phone" "text",
    "email" "text",
    "national_id" "text",
    "address" "text",
    "city" "text",
    "occupation" "text",
    "blood_type" "text",
    "allergies" "text",
    "medical_history" "text",
    "emergency_contact_name" "text",
    "emergency_contact_phone" "text",
    "notes" "text",
    "primary_clinic_id" "uuid",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    "legacy_id" "text",
    "primary_condition" "text",
    "triage_status" "text",
    "last_visit" "date",
    CONSTRAINT "patients_age_at_registration_check" CHECK ((("age_at_registration" >= 0) AND ("age_at_registration" <= 130))),
    CONSTRAINT "patients_blood_type_check" CHECK ((("blood_type" IS NULL) OR ("blood_type" = ANY (ARRAY['A+'::"text", 'A-'::"text", 'B+'::"text", 'B-'::"text", 'AB+'::"text", 'AB-'::"text", 'O+'::"text", 'O-'::"text"])))),
    CONSTRAINT "patients_date_of_birth_check" CHECK (("date_of_birth" <= CURRENT_DATE)),
    CONSTRAINT "patients_email_check" CHECK ((("email" IS NULL) OR ("email" ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'::"text"))),
    CONSTRAINT "patients_full_name_check" CHECK (("length"("btrim"("full_name")) > 1)),
    CONSTRAINT "patients_patient_code_check" CHECK (("patient_code" ~ '^P-[0-9]{4,8}$'::"text"))
);

ALTER TABLE ONLY "iapp"."patients" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."patients" OWNER TO "postgres";


COMMENT ON COLUMN "iapp"."patients"."phone_normalized" IS 'E.164-ish normalized phone. Non-unique: family members legitimately share a number.';



COMMENT ON COLUMN "iapp"."patients"."legacy_id" IS 'Original iapp_patients[].id. Unique so re-running migration cannot duplicate rows.';



COMMENT ON COLUMN "iapp"."patients"."primary_condition" IS 'Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© ÙƒÙ…Ø§ ÙŠÙƒØªØ¨Ù‡Ø§ Ø§Ù„Ø·Ø¨ÙŠØ¨. Ø§Ù„ØªØ´Ø®ÙŠØµØ§Øª Ø§Ù„Ù…ÙØµÙŽÙ‘Ù„Ø© ÙÙŠ Ø¬Ø¯ÙˆÙ„ diagnoses.';



COMMENT ON COLUMN "iapp"."patients"."triage_status" IS 'ØªØµÙ†ÙŠÙ ØªØ´ØºÙŠÙ„ÙŠ Ø³Ø±ÙŠØ¹: Ù…ÙƒØªÙ…Ù„ / Ù…ØªØ§Ø¨Ø¹Ø© / Ø·Ø§Ø±Ø¦.';



COMMENT ON COLUMN "iapp"."patients"."last_visit" IS 'ÙŠÙØ­Ø¯ÙŽÙ‘Ø« ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ø¨Ù…Ø´ØºÙ‘Ù„ Ø¹Ù†Ø¯ ÙƒÙ„ Ø²ÙŠØ§Ø±Ø© â€” Ù„Ø§ ÙŠÙØ¯Ø®Ù„ ÙŠØ¯ÙˆÙŠØ§Ù‹.';



CREATE TABLE IF NOT EXISTS "iapp"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "visit_id" "uuid",
    "service_id" "uuid",
    "clinic_id" "uuid",
    "amount" numeric(12,2) NOT NULL,
    "discount" numeric(12,2) DEFAULT 0 NOT NULL,
    "amount_paid" numeric(12,2) DEFAULT 0 NOT NULL,
    "currency" character(3) DEFAULT 'EGP'::"bpchar" NOT NULL,
    "status" "iapp"."payment_status" DEFAULT 'unpaid'::"iapp"."payment_status" NOT NULL,
    "method" "iapp"."payment_method",
    "paid_at" timestamp with time zone,
    "receipt_no" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    "legacy_id" "text",
    CONSTRAINT "chk_pay_not_over" CHECK (("amount_paid" <= (("amount" - "discount") + 0.01))),
    CONSTRAINT "chk_pay_status" CHECK (((("status" = 'paid'::"iapp"."payment_status") AND ("amount_paid" >= (("amount" - "discount") - 0.01))) OR (("status" = 'unpaid'::"iapp"."payment_status") AND ("amount_paid" = (0)::numeric)) OR ("status" = ANY (ARRAY['partial'::"iapp"."payment_status", 'refunded'::"iapp"."payment_status", 'waived'::"iapp"."payment_status"])))),
    CONSTRAINT "payments_amount_check" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "payments_amount_paid_check" CHECK (("amount_paid" >= (0)::numeric)),
    CONSTRAINT "payments_discount_check" CHECK (("discount" >= (0)::numeric))
);

ALTER TABLE ONLY "iapp"."payments" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."prescription_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prescription_id" "uuid" NOT NULL,
    "medication_id" "uuid",
    "free_text" "text",
    "dose" "text",
    "frequency" "text",
    "duration" "text",
    "eye" "iapp"."eye_side",
    "instructions" "text",
    "sort_order" smallint DEFAULT 0 NOT NULL,
    "is_parsed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    CONSTRAINT "chk_item_identity" CHECK ((("medication_id" IS NOT NULL) OR ("free_text" IS NOT NULL)))
);

ALTER TABLE ONLY "iapp"."prescription_items" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."prescription_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."prescriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "visit_id" "uuid",
    "examination_id" "uuid",
    "doctor_id" "uuid",
    "clinic_id" "uuid",
    "prescribed_on" "date" DEFAULT CURRENT_DATE NOT NULL,
    "eye" "iapp"."eye_side",
    "is_glasses" boolean DEFAULT false NOT NULL,
    "notes" "text",
    "legacy_medicines_text" "text",
    "printed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    "legacy_id" "text"
);

ALTER TABLE ONLY "iapp"."prescriptions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."prescriptions" OWNER TO "postgres";


COMMENT ON COLUMN "iapp"."prescriptions"."legacy_medicines_text" IS 'The original free-text `medicines` field. Retained permanently as the source of truth for migrated records, because text->structured parsing is lossy.';



CREATE TABLE IF NOT EXISTS "iapp"."refractions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "examination_id" "uuid",
    "visit_id" "uuid",
    "prescription_id" "uuid",
    "measured_on" "date" DEFAULT CURRENT_DATE NOT NULL,
    "refraction_type" "iapp"."refraction_type" DEFAULT 'final'::"iapp"."refraction_type" NOT NULL,
    "eye" "iapp"."eye_side" NOT NULL,
    "sphere" numeric(5,2),
    "cylinder" numeric(5,2),
    "axis" smallint,
    "add_power" numeric(4,2),
    "prism" numeric(4,2),
    "base" "text",
    "ipd_mm" numeric(4,1),
    "va_result" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    "legacy_id" "text",
    CONSTRAINT "chk_cyl_axis" CHECK ((("cylinder" IS NULL) OR ("cylinder" = (0)::numeric) OR ("axis" IS NOT NULL))),
    CONSTRAINT "refractions_add_power_check" CHECK ((("add_power" >= (0)::numeric) AND ("add_power" <= (6)::numeric))),
    CONSTRAINT "refractions_axis_check" CHECK ((("axis" >= 0) AND ("axis" <= 180))),
    CONSTRAINT "refractions_cylinder_check" CHECK ((("cylinder" >= ('-15'::integer)::numeric) AND ("cylinder" <= (15)::numeric))),
    CONSTRAINT "refractions_eye_check" CHECK (("eye" = ANY (ARRAY['OD'::"iapp"."eye_side", 'OS'::"iapp"."eye_side"]))),
    CONSTRAINT "refractions_ipd_mm_check" CHECK ((("ipd_mm" >= (40)::numeric) AND ("ipd_mm" <= (85)::numeric))),
    CONSTRAINT "refractions_sphere_check" CHECK ((("sphere" >= ('-30'::integer)::numeric) AND ("sphere" <= (30)::numeric)))
);

ALTER TABLE ONLY "iapp"."refractions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."refractions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name_en" "text" NOT NULL,
    "name_ar" "text" NOT NULL,
    "description" "text",
    "rank" smallint DEFAULT 100 NOT NULL,
    "is_system" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "roles_code_check" CHECK (("code" ~ '^[a-z_]{3,32}$'::"text"))
);

ALTER TABLE ONLY "iapp"."roles" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."roles" OWNER TO "postgres";


COMMENT ON TABLE "iapp"."roles" IS 'Replaces the public.iapp_role enum from Phase 1. The enum is retained during transition; profiles.role_id becomes authoritative at Phase 3 cutover.';



CREATE TABLE IF NOT EXISTS "iapp"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text",
    "name_ar" "text" NOT NULL,
    "name_en" "text",
    "icon" "text",
    "default_price" numeric(12,2) DEFAULT 0 NOT NULL,
    "currency" character(3) DEFAULT 'EGP'::"bpchar" NOT NULL,
    "category" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    "legacy_id" "text",
    CONSTRAINT "services_default_price_check" CHECK (("default_price" >= (0)::numeric))
);

ALTER TABLE ONLY "iapp"."services" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."staff" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid",
    "clinic_id" "uuid",
    "full_name_ar" "text" NOT NULL,
    "job_title" "text",
    "phone" "text",
    "email" "text",
    "employee_no" "text",
    "hired_on" "date",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    "legacy_id" "text"
);

ALTER TABLE ONLY "iapp"."staff" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."staff" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."surgeries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "visit_id" "uuid",
    "examination_id" "uuid",
    "clinic_id" "uuid",
    "doctor_id" "uuid",
    "eye" "iapp"."eye_side" NOT NULL,
    "procedure_name" "text" NOT NULL,
    "procedure_code" "text",
    "performed_on" "date",
    "is_planned" boolean DEFAULT false NOT NULL,
    "is_external" boolean DEFAULT false NOT NULL,
    "surgeon_name" "text",
    "anesthesia" "text",
    "outcome" "text",
    "complications" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    "legacy_id" "text",
    CONSTRAINT "chk_surgery_date" CHECK (("is_planned" OR ("performed_on" IS NOT NULL)))
);


ALTER TABLE "iapp"."surgeries" OWNER TO "postgres";


COMMENT ON TABLE "iapp"."surgeries" IS 'Ø§Ù„ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¬Ø±Ø§Ø­ÙŠ â€” Ø£ÙØ¬Ø±ÙŠØª Ø¹Ù†Ø¯Ù†Ø§ Ø£Ùˆ ÙŠØ±ÙˆÙŠÙ‡Ø§ Ø§Ù„Ù…Ø±ÙŠØ¶ (is_external)';



CREATE OR REPLACE VIEW "iapp"."v_active_patients" WITH ("security_invoker"='true') AS
 SELECT "id",
    "patient_code",
    "full_name",
    "date_of_birth",
    "age_at_registration",
    "gender",
    "phone",
    "phone_normalized",
    "alt_phone",
    "email",
    "national_id",
    "address",
    "city",
    "occupation",
    "blood_type",
    "allergies",
    "medical_history",
    "emergency_contact_name",
    "emergency_contact_phone",
    "notes",
    "primary_clinic_id",
    "is_active",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by",
    "deleted_at",
    "legacy_id"
   FROM "iapp"."patients"
  WHERE ("deleted_at" IS NULL);


ALTER VIEW "iapp"."v_active_patients" OWNER TO "postgres";


COMMENT ON VIEW "iapp"."v_active_patients" IS 'Application code should read views, not base tables, so a forgotten deleted_at filter cannot resurrect deleted records.';



CREATE TABLE IF NOT EXISTS "iapp"."visits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "clinic_id" "uuid",
    "doctor_id" "uuid",
    "appointment_id" "uuid",
    "visit_date" "date" NOT NULL,
    "visit_type" "iapp"."visit_type" DEFAULT 'routine'::"iapp"."visit_type" NOT NULL,
    "chief_complaint" "text",
    "summary" "text",
    "notes" "text",
    "is_locked" boolean DEFAULT false NOT NULL,
    "locked_at" timestamp with time zone,
    "locked_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    "legacy_id" "text",
    CONSTRAINT "chk_visit_lock" CHECK (("is_locked" = ("locked_at" IS NOT NULL)))
);

ALTER TABLE ONLY "iapp"."visits" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."visits" OWNER TO "postgres";


CREATE OR REPLACE VIEW "iapp"."v_active_visits" WITH ("security_invoker"='true') AS
 SELECT "id",
    "patient_id",
    "clinic_id",
    "doctor_id",
    "appointment_id",
    "visit_date",
    "visit_type",
    "chief_complaint",
    "summary",
    "notes",
    "is_locked",
    "locked_at",
    "locked_by",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by",
    "deleted_at",
    "legacy_id"
   FROM "iapp"."visits"
  WHERE ("deleted_at" IS NULL);


ALTER VIEW "iapp"."v_active_visits" OWNER TO "postgres";


CREATE OR REPLACE VIEW "iapp"."v_ai_latest" WITH ("security_invoker"='true') AS
 SELECT "a"."id" AS "analysis_id",
    "a"."image_id",
    "a"."patient_id",
    "a"."modality",
    "a"."eye",
    "a"."status",
    "a"."attempt",
    "a"."model",
    "a"."prompt_version",
    "a"."error_message",
    "a"."created_at",
    "a"."finished_at",
    "i"."impression_text",
    "i"."urgency",
    "i"."confidence",
    "i"."recommendations",
    "i"."limitations",
    "i"."differentials",
    "r"."action" AS "review_action",
    "r"."reviewed_at",
    "r"."edited_impression",
    "r"."reject_reason",
    ( SELECT "count"(*) AS "count"
           FROM "iapp"."ai_findings" "f"
          WHERE ("f"."analysis_id" = "a"."id")) AS "finding_count",
    ( SELECT "fr"."id"
           FROM "iapp"."final_report" "fr"
          WHERE (("fr"."image_id" = "a"."image_id") AND ("fr"."deleted_at" IS NULL))) AS "final_report_id"
   FROM (("iapp"."ai_analysis" "a"
     LEFT JOIN "iapp"."ai_impression" "i" ON (("i"."analysis_id" = "a"."id")))
     LEFT JOIN "iapp"."doctor_review" "r" ON ((("r"."analysis_id" = "a"."id") AND ("r"."superseded_at" IS NULL))))
  WHERE ("a"."deleted_at" IS NULL);


ALTER VIEW "iapp"."v_ai_latest" OWNER TO "postgres";


CREATE OR REPLACE VIEW "iapp"."v_appointment_board" WITH ("security_invoker"='true') AS
 SELECT "a"."id",
    "a"."status",
    "a"."scheduled_date",
    "a"."scheduled_time",
    "a"."duration_minutes",
    "a"."appointment_type",
    "a"."room",
    "a"."notes",
    "a"."source",
    "a"."requested_at",
    "a"."confirmed_at",
    "a"."arrived_at",
    "a"."waiting_at",
    "a"."in_clinic_at",
    "a"."completed_at",
    "a"."cancelled_at",
    "a"."cancel_reason",
    "a"."patient_id",
    COALESCE("p"."full_name", "a"."guest_name") AS "display_name",
    COALESCE("p"."phone", "a"."guest_phone") AS "display_phone",
    "p"."patient_code",
    "a"."doctor_id",
    "d"."full_name_ar" AS "doctor_name",
    "d"."short_name" AS "doctor_short",
    "a"."clinic_id",
    "c"."name_ar" AS "clinic_name",
    "a"."visit_id",
    "a"."rescheduled_from",
    "a"."reschedule_count",
        CASE
            WHEN ("a"."arrived_at" IS NOT NULL) THEN ("round"((EXTRACT(epoch FROM (COALESCE("a"."in_clinic_at", "now"()) - "a"."arrived_at")) / (60)::numeric)))::integer
            ELSE NULL::integer
        END AS "wait_minutes"
   FROM ((("iapp"."appointments" "a"
     LEFT JOIN "iapp"."patients" "p" ON (("p"."id" = "a"."patient_id")))
     LEFT JOIN "iapp"."doctors" "d" ON (("d"."id" = "a"."doctor_id")))
     LEFT JOIN "iapp"."clinics" "c" ON (("c"."id" = "a"."clinic_id")))
  WHERE ("a"."deleted_at" IS NULL);


ALTER VIEW "iapp"."v_appointment_board" OWNER TO "postgres";


COMMENT ON VIEW "iapp"."v_appointment_board" IS 'The single read shape for all three applications. wait_minutes finally answers "how long has this patient been waiting?" - impossible in the old model, which recorded no arrival time.';



CREATE OR REPLACE VIEW "iapp"."v_exam_full" WITH ("security_barrier"='true', "security_invoker"='true') AS
 SELECT "e"."id",
    "e"."patient_id",
    "e"."visit_id",
    "e"."doctor_id",
    "e"."exam_date",
    "e"."chief_complaint",
    "e"."va_right",
    "e"."va_left",
    "e"."va_right_corrected",
    "e"."va_left_corrected",
    "e"."va_right_ph",
    "e"."va_left_ph",
    "e"."color_vision",
    "e"."contrast_sensitivity",
    "e"."cover_test",
    "e"."anterior_segment",
    "e"."anterior_segment_right",
    "e"."anterior_segment_left",
    "e"."posterior_segment",
    "e"."posterior_segment_right",
    "e"."posterior_segment_left",
    "e"."treatment_plan",
    "e"."notes",
    "e"."created_at",
    "od"."value_mmhg" AS "iop_od",
    "od"."method" AS "iop_od_method",
    "od"."measured_at" AS "iop_od_at",
    "os"."value_mmhg" AS "iop_os",
    "os"."method" AS "iop_os_method",
    "os"."measured_at" AS "iop_os_at",
    "rd"."sphere" AS "sph_od",
    "rd"."cylinder" AS "cyl_od",
    "rd"."axis" AS "axis_od",
    "rd"."add_power" AS "add_od",
    "rs"."sphere" AS "sph_os",
    "rs"."cylinder" AS "cyl_os",
    "rs"."axis" AS "axis_os",
    "rs"."add_power" AS "add_os"
   FROM (((("iapp"."examinations" "e"
     LEFT JOIN LATERAL ( SELECT "i"."value_mmhg",
            "i"."method",
            "i"."measured_at"
           FROM "iapp"."iop_measurements" "i"
          WHERE (("i"."examination_id" = "e"."id") AND ("i"."eye" = 'OD'::"iapp"."eye_side") AND ("i"."deleted_at" IS NULL))
          ORDER BY "i"."measured_at" DESC
         LIMIT 1) "od" ON (true))
     LEFT JOIN LATERAL ( SELECT "i"."value_mmhg",
            "i"."method",
            "i"."measured_at"
           FROM "iapp"."iop_measurements" "i"
          WHERE (("i"."examination_id" = "e"."id") AND ("i"."eye" = 'OS'::"iapp"."eye_side") AND ("i"."deleted_at" IS NULL))
          ORDER BY "i"."measured_at" DESC
         LIMIT 1) "os" ON (true))
     LEFT JOIN LATERAL ( SELECT "r"."sphere",
            "r"."cylinder",
            "r"."axis",
            "r"."add_power"
           FROM "iapp"."refractions" "r"
          WHERE (("r"."examination_id" = "e"."id") AND ("r"."eye" = 'OD'::"iapp"."eye_side") AND ("r"."deleted_at" IS NULL))
          ORDER BY "r"."measured_on" DESC
         LIMIT 1) "rd" ON (true))
     LEFT JOIN LATERAL ( SELECT "r"."sphere",
            "r"."cylinder",
            "r"."axis",
            "r"."add_power"
           FROM "iapp"."refractions" "r"
          WHERE (("r"."examination_id" = "e"."id") AND ("r"."eye" = 'OS'::"iapp"."eye_side") AND ("r"."deleted_at" IS NULL))
          ORDER BY "r"."measured_on" DESC
         LIMIT 1) "rs" ON (true))
  WHERE ("e"."deleted_at" IS NULL);


ALTER VIEW "iapp"."v_exam_full" OWNER TO "postgres";


COMMENT ON VIEW "iapp"."v_exam_full" IS 'Ø§Ù„ÙØ­Øµ + Ø¶ØºØ· Ø§Ù„Ø¹ÙŠÙ† + Ø§Ù„Ø§Ù†ÙƒØ³Ø§Ø± ÙÙŠ ØµÙ ÙˆØ§Ø­Ø¯ â€” Ø£Ø³Ø§Ø³ Ù…Ù‚Ø§Ø±Ù†Ø© Ø§Ù„Ø²ÙŠØ§Ø±Ø© Ø¨Ø³Ø§Ø¨Ù‚ØªÙ‡Ø§';



CREATE OR REPLACE VIEW "iapp"."v_my_diagnoses" WITH ("security_barrier"='true', "security_invoker"='true') AS
 SELECT "id",
    "patient_id",
    "diagnosis_text",
    "eye",
    "status",
    "diagnosed_on"
   FROM "iapp"."diagnoses"
  WHERE (("patient_id" = "iapp"."current_patient_uuid"()) AND ("deleted_at" IS NULL));


ALTER VIEW "iapp"."v_my_diagnoses" OWNER TO "postgres";


CREATE OR REPLACE VIEW "iapp"."v_my_examinations" WITH ("security_barrier"='true', "security_invoker"='true') AS
 SELECT "id",
    "patient_id",
    "exam_date",
    "doctor_id",
    "visit_id",
    "treatment_plan",
    "va_right",
    "va_left"
   FROM "iapp"."examinations"
  WHERE (("patient_id" = "iapp"."current_patient_uuid"()) AND ("deleted_at" IS NULL));


ALTER VIEW "iapp"."v_my_examinations" OWNER TO "postgres";


CREATE OR REPLACE VIEW "iapp"."v_my_patient" WITH ("security_barrier"='true', "security_invoker"='true') AS
 SELECT "id",
    "patient_code",
    "full_name",
    "date_of_birth",
    "gender",
    "phone",
    "email",
    "address",
    "city",
    "blood_type",
    "allergies",
    "emergency_contact_name",
    "emergency_contact_phone",
    "primary_clinic_id"
   FROM "iapp"."patients"
  WHERE (("id" = "iapp"."current_patient_uuid"()) AND ("deleted_at" IS NULL));


ALTER VIEW "iapp"."v_my_patient" OWNER TO "postgres";


CREATE OR REPLACE VIEW "iapp"."v_my_prescriptions" WITH ("security_barrier"='true', "security_invoker"='true') AS
 SELECT "id",
    "patient_id",
    "prescribed_on",
    "eye",
    "is_glasses",
    "notes",
    "legacy_medicines_text"
   FROM "iapp"."prescriptions"
  WHERE (("patient_id" = "iapp"."current_patient_uuid"()) AND ("deleted_at" IS NULL));


ALTER VIEW "iapp"."v_my_prescriptions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "iapp"."v_my_visits" WITH ("security_barrier"='true', "security_invoker"='true') AS
 SELECT "id",
    "patient_id",
    "visit_date",
    "visit_type",
    "doctor_id",
    "clinic_id"
   FROM "iapp"."visits"
  WHERE (("patient_id" = "iapp"."current_patient_uuid"()) AND ("deleted_at" IS NULL));


ALTER VIEW "iapp"."v_my_visits" OWNER TO "postgres";


CREATE OR REPLACE VIEW "iapp"."v_patient_clinical" WITH ("security_barrier"='true') AS
 SELECT "id",
    "patient_code",
    "full_name",
    "date_of_birth",
    "age_at_registration",
    "gender",
    "phone",
    "phone_normalized",
    "alt_phone",
    "email",
    "national_id",
    "address",
    "city",
    "occupation",
    "blood_type",
    "allergies",
    "medical_history",
    "emergency_contact_name",
    "emergency_contact_phone",
    "notes",
    "primary_clinic_id",
    "is_active",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by",
    "deleted_at",
    "legacy_id",
    "primary_condition",
    "triage_status",
    "last_visit"
   FROM "iapp"."patients"
  WHERE ("iapp"."is_doctor"() AND ("deleted_at" IS NULL));


ALTER VIEW "iapp"."v_patient_clinical" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iapp"."visit_ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid",
    "visit_id" "uuid",
    "rating" smallint NOT NULL,
    "comment" "text",
    "rated_on" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    "legacy_id" "text",
    CONSTRAINT "visit_ratings_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);

ALTER TABLE ONLY "iapp"."visit_ratings" FORCE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."visit_ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" bigint NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "role" "public"."iapp_role",
    "patient_id" "text",
    "resource" "text" NOT NULL,
    "action" "text" NOT NULL,
    "outcome" "text" NOT NULL,
    "reason" "text",
    "record_ids" "text"[],
    "row_count" integer,
    "ip" "inet",
    "user_agent" "text",
    "request_id" "uuid",
    "detail" "jsonb",
    CONSTRAINT "audit_log_outcome_check" CHECK (("outcome" = ANY (ARRAY['allow'::"text", 'deny'::"text", 'error'::"text"])))
);

ALTER TABLE ONLY "public"."audit_log" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."audit_log" IS 'Append-only PHI access log. Addresses Phase 0 finding S7. Writable only by service_role via the gateway.';



CREATE SEQUENCE IF NOT EXISTS "public"."audit_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."audit_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."audit_log_id_seq" OWNED BY "public"."audit_log"."id";



CREATE TABLE IF NOT EXISTS "public"."auth_events" (
    "id" bigint NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "identifier" "text" NOT NULL,
    "event" "text" NOT NULL,
    "ip" "inet",
    "user_agent" "text",
    CONSTRAINT "auth_events_event_check" CHECK (("event" = ANY (ARRAY['login_ok'::"text", 'login_fail'::"text", 'otp_sent'::"text", 'locked'::"text"])))
);

ALTER TABLE ONLY "public"."auth_events" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."auth_events" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."auth_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."auth_events_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."auth_events_id_seq" OWNED BY "public"."auth_events"."id";



CREATE TABLE IF NOT EXISTS "public"."patient_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "patient_id" "text" NOT NULL,
    "verified" boolean DEFAULT false NOT NULL,
    "verified_at" timestamp with time zone,
    "verified_by" "uuid",
    "method" "text" DEFAULT 'phone_otp'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "patient_links_method_check" CHECK (("method" = ANY (ARRAY['phone_otp'::"text", 'staff_issued'::"text", 'admin_manual'::"text"])))
);

ALTER TABLE ONLY "public"."patient_links" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_links" OWNER TO "postgres";


COMMENT ON TABLE "public"."patient_links" IS 'Verified binding between an auth account and a patient record. Unverified links grant NO access - authorize() requires ctx.patientId which is only populated from a verified link.';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "role" "public"."iapp_role" DEFAULT 'patient'::"public"."iapp_role" NOT NULL,
    "full_name" "text",
    "phone" "text",
    "clinic_id" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "last_login_at" timestamp with time zone
);

ALTER TABLE ONLY "public"."profiles" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'Authoritative role assignment. Never trust a role claim from the client.';



ALTER TABLE ONLY "iapp"."audit_logs" ATTACH PARTITION "iapp"."audit_logs_2026_08" FOR VALUES FROM ('2026-08-01 00:00:00+00') TO ('2026-09-01 00:00:00+00');



ALTER TABLE ONLY "iapp"."audit_logs" ATTACH PARTITION "iapp"."audit_logs_2026_09" FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');



ALTER TABLE ONLY "iapp"."audit_logs" ATTACH PARTITION "iapp"."audit_logs_2026_10" FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');



ALTER TABLE ONLY "iapp"."audit_logs" ATTACH PARTITION "iapp"."audit_logs_default" DEFAULT;



ALTER TABLE ONLY "iapp"."appointment_status_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"iapp"."appointment_status_history_id_seq"'::"regclass");



ALTER TABLE ONLY "iapp"."audit_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"iapp"."audit_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "iapp"."migration_issues" ALTER COLUMN "id" SET DEFAULT "nextval"('"iapp"."migration_issues_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."audit_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."audit_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."auth_events" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."auth_events_id_seq"'::"regclass");



ALTER TABLE ONLY "iapp"."ai_analysis"
    ADD CONSTRAINT "ai_analysis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."ai_finding_catalog"
    ADD CONSTRAINT "ai_finding_catalog_pkey" PRIMARY KEY ("modality", "category");



ALTER TABLE ONLY "iapp"."ai_findings"
    ADD CONSTRAINT "ai_findings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."ai_impression"
    ADD CONSTRAINT "ai_impression_analysis_id_key" UNIQUE ("analysis_id");



ALTER TABLE ONLY "iapp"."ai_impression"
    ADD CONSTRAINT "ai_impression_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."appointment_status_history"
    ADD CONSTRAINT "appointment_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."appointment_transitions"
    ADD CONSTRAINT "appointment_transitions_pkey" PRIMARY KEY ("from_status", "to_status");



ALTER TABLE ONLY "iapp"."appointments"
    ADD CONSTRAINT "appointments_legacy_id_key" UNIQUE ("legacy_id");



ALTER TABLE ONLY "iapp"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."appointments"
    ADD CONSTRAINT "appointments_visit_id_key" UNIQUE ("visit_id");



ALTER TABLE ONLY "iapp"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id", "occurred_at");



ALTER TABLE ONLY "iapp"."audit_logs_2026_08"
    ADD CONSTRAINT "audit_logs_2026_08_pkey" PRIMARY KEY ("id", "occurred_at");



ALTER TABLE ONLY "iapp"."audit_logs_2026_09"
    ADD CONSTRAINT "audit_logs_2026_09_pkey" PRIMARY KEY ("id", "occurred_at");



ALTER TABLE ONLY "iapp"."audit_logs_2026_10"
    ADD CONSTRAINT "audit_logs_2026_10_pkey" PRIMARY KEY ("id", "occurred_at");



ALTER TABLE ONLY "iapp"."audit_logs_default"
    ADD CONSTRAINT "audit_logs_default_pkey" PRIMARY KEY ("id", "occurred_at");



ALTER TABLE "iapp"."medical_images"
    ADD CONSTRAINT "chk_img_mime" CHECK ((("mime_type" IS NULL) OR ("mime_type" = ANY (ARRAY['image/jpeg'::"text", 'image/png'::"text", 'image/webp'::"text", 'application/pdf'::"text"])))) NOT VALID;



ALTER TABLE "iapp"."medical_images"
    ADD CONSTRAINT "chk_img_no_public_url" CHECK ((("storage_provider" <> 'supabase'::"text") OR ("storage_path" !~* '^https?://'::"text"))) NOT VALID;



ALTER TABLE "iapp"."medical_images"
    ADD CONSTRAINT "chk_img_path_shape" CHECK ((("storage_provider" <> 'supabase'::"text") OR ("storage_path" ~ '^p/[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/.+'::"text"))) NOT VALID;



ALTER TABLE "iapp"."medical_images"
    ADD CONSTRAINT "chk_img_size_max" CHECK ((("size_bytes" IS NULL) OR ("size_bytes" <= 26214400))) NOT VALID;



ALTER TABLE "iapp"."medical_images"
    ADD CONSTRAINT "chk_img_thumb_shape" CHECK ((("thumbnail_path" IS NULL) OR ("thumbnail_path" ~ '^p/[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/.+'::"text"))) NOT VALID;



ALTER TABLE "iapp"."visits"
    ADD CONSTRAINT "chk_visit_date_sane" CHECK ((("visit_date" >= '2000-01-01'::"date") AND ("visit_date" <= (CURRENT_DATE + 1)))) NOT VALID;



ALTER TABLE ONLY "iapp"."clinic_schedules"
    ADD CONSTRAINT "clinic_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."clinics"
    ADD CONSTRAINT "clinics_code_key" UNIQUE ("code");



ALTER TABLE ONLY "iapp"."clinics"
    ADD CONSTRAINT "clinics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."diagnoses"
    ADD CONSTRAINT "diagnoses_legacy_id_key" UNIQUE ("legacy_id");



ALTER TABLE ONLY "iapp"."diagnoses"
    ADD CONSTRAINT "diagnoses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."doctor_review"
    ADD CONSTRAINT "doctor_review_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."doctors"
    ADD CONSTRAINT "doctors_legacy_id_key" UNIQUE ("legacy_id");



ALTER TABLE ONLY "iapp"."doctors"
    ADD CONSTRAINT "doctors_license_no_key" UNIQUE ("license_no");



ALTER TABLE ONLY "iapp"."doctors"
    ADD CONSTRAINT "doctors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."doctors"
    ADD CONSTRAINT "doctors_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "iapp"."exam_findings"
    ADD CONSTRAINT "exam_findings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."examinations"
    ADD CONSTRAINT "examinations_legacy_id_key" UNIQUE ("legacy_id");



ALTER TABLE ONLY "iapp"."examinations"
    ADD CONSTRAINT "examinations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."appointments"
    ADD CONSTRAINT "excl_clinic_unassigned_double_booking" EXCLUDE USING "gist" ("clinic_id" WITH =, "slot" WITH &&) WHERE ((("deleted_at" IS NULL) AND ("doctor_id" IS NULL) AND ("status" <> ALL (ARRAY['CANCELLED'::"iapp"."appointment_status", 'NO_SHOW'::"iapp"."appointment_status", 'COMPLETED'::"iapp"."appointment_status"]))));



ALTER TABLE ONLY "iapp"."appointments"
    ADD CONSTRAINT "excl_doctor_double_booking" EXCLUDE USING "gist" ("doctor_id" WITH =, "slot" WITH &&) WHERE ((("deleted_at" IS NULL) AND ("doctor_id" IS NOT NULL) AND ("status" <> ALL (ARRAY['CANCELLED'::"iapp"."appointment_status", 'NO_SHOW'::"iapp"."appointment_status", 'COMPLETED'::"iapp"."appointment_status"]))));



COMMENT ON CONSTRAINT "excl_doctor_double_booking" ON "iapp"."appointments" IS 'Race-proof: two concurrent bookings for the same doctor and overlapping time cannot both commit, regardless of application-level checking.';



ALTER TABLE ONLY "iapp"."appointments"
    ADD CONSTRAINT "excl_patient_double_booking" EXCLUDE USING "gist" ("patient_id" WITH =, "slot" WITH &&) WHERE ((("deleted_at" IS NULL) AND ("patient_id" IS NOT NULL) AND ("status" <> ALL (ARRAY['CANCELLED'::"iapp"."appointment_status", 'NO_SHOW'::"iapp"."appointment_status", 'COMPLETED'::"iapp"."appointment_status"]))));



ALTER TABLE ONLY "iapp"."appointments"
    ADD CONSTRAINT "excl_room_double_booking" EXCLUDE USING "gist" ("clinic_id" WITH =, "room" WITH =, "slot" WITH &&) WHERE ((("deleted_at" IS NULL) AND ("room" IS NOT NULL) AND ("status" <> ALL (ARRAY['CANCELLED'::"iapp"."appointment_status", 'NO_SHOW'::"iapp"."appointment_status", 'COMPLETED'::"iapp"."appointment_status"]))));



ALTER TABLE ONLY "iapp"."final_report"
    ADD CONSTRAINT "final_report_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."follow_ups"
    ADD CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."image_reports"
    ADD CONSTRAINT "image_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."imaging_order_items"
    ADD CONSTRAINT "imaging_order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."imaging_orders"
    ADD CONSTRAINT "imaging_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."iop_measurements"
    ADD CONSTRAINT "iop_measurements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."medical_images"
    ADD CONSTRAINT "medical_images_legacy_id_key" UNIQUE ("legacy_id");



ALTER TABLE ONLY "iapp"."medical_images"
    ADD CONSTRAINT "medical_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."medications"
    ADD CONSTRAINT "medications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."migration_issues"
    ADD CONSTRAINT "migration_issues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."migration_runs"
    ADD CONSTRAINT "migration_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."patients"
    ADD CONSTRAINT "patients_legacy_id_key" UNIQUE ("legacy_id");



ALTER TABLE ONLY "iapp"."patients"
    ADD CONSTRAINT "patients_national_id_key" UNIQUE ("national_id");



ALTER TABLE ONLY "iapp"."patients"
    ADD CONSTRAINT "patients_patient_code_key" UNIQUE ("patient_code");



ALTER TABLE ONLY "iapp"."patients"
    ADD CONSTRAINT "patients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."payments"
    ADD CONSTRAINT "payments_legacy_id_key" UNIQUE ("legacy_id");



ALTER TABLE ONLY "iapp"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."payments"
    ADD CONSTRAINT "payments_receipt_no_key" UNIQUE ("receipt_no");



ALTER TABLE ONLY "iapp"."prescription_items"
    ADD CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."prescriptions"
    ADD CONSTRAINT "prescriptions_legacy_id_key" UNIQUE ("legacy_id");



ALTER TABLE ONLY "iapp"."prescriptions"
    ADD CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."refractions"
    ADD CONSTRAINT "refractions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."roles"
    ADD CONSTRAINT "roles_code_key" UNIQUE ("code");



ALTER TABLE ONLY "iapp"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."services"
    ADD CONSTRAINT "services_code_key" UNIQUE ("code");



ALTER TABLE ONLY "iapp"."services"
    ADD CONSTRAINT "services_legacy_id_key" UNIQUE ("legacy_id");



ALTER TABLE ONLY "iapp"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."staff"
    ADD CONSTRAINT "staff_employee_no_key" UNIQUE ("employee_no");



ALTER TABLE ONLY "iapp"."staff"
    ADD CONSTRAINT "staff_legacy_id_key" UNIQUE ("legacy_id");



ALTER TABLE ONLY "iapp"."staff"
    ADD CONSTRAINT "staff_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."staff"
    ADD CONSTRAINT "staff_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "iapp"."surgeries"
    ADD CONSTRAINT "surgeries_legacy_id_key" UNIQUE ("legacy_id");



ALTER TABLE ONLY "iapp"."surgeries"
    ADD CONSTRAINT "surgeries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."follow_ups"
    ADD CONSTRAINT "uq_followup_source" UNIQUE ("legacy_id", "due_date");



ALTER TABLE ONLY "iapp"."medical_images"
    ADD CONSTRAINT "uq_image_storage" UNIQUE ("storage_provider", "storage_path");



ALTER TABLE ONLY "iapp"."iop_measurements"
    ADD CONSTRAINT "uq_iop_legacy" UNIQUE ("legacy_id", "eye");



ALTER TABLE ONLY "iapp"."medications"
    ADD CONSTRAINT "uq_medication_name" UNIQUE NULLS NOT DISTINCT ("name", "strength", "form");



ALTER TABLE ONLY "iapp"."visit_ratings"
    ADD CONSTRAINT "uq_rating_per_visit" UNIQUE ("visit_id", "patient_id");



ALTER TABLE ONLY "iapp"."refractions"
    ADD CONSTRAINT "uq_refraction_legacy" UNIQUE ("legacy_id", "eye");



ALTER TABLE ONLY "iapp"."clinic_schedules"
    ADD CONSTRAINT "uq_schedule" UNIQUE NULLS NOT DISTINCT ("clinic_id", "day_of_week", "start_time", "doctor_id");



ALTER TABLE ONLY "iapp"."visit_ratings"
    ADD CONSTRAINT "visit_ratings_legacy_id_key" UNIQUE ("legacy_id");



ALTER TABLE ONLY "iapp"."visit_ratings"
    ADD CONSTRAINT "visit_ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iapp"."visits"
    ADD CONSTRAINT "visits_appointment_id_key" UNIQUE ("appointment_id");



ALTER TABLE ONLY "iapp"."visits"
    ADD CONSTRAINT "visits_legacy_id_key" UNIQUE ("legacy_id");



ALTER TABLE ONLY "iapp"."visits"
    ADD CONSTRAINT "visits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_events"
    ADD CONSTRAINT "auth_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_links"
    ADD CONSTRAINT "patient_links_patient_id_key" UNIQUE ("patient_id");



ALTER TABLE ONLY "public"."patient_links"
    ADD CONSTRAINT "patient_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_links"
    ADD CONSTRAINT "patient_links_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_audit_actor" ON ONLY "iapp"."audit_logs" USING "btree" ("actor_id", "occurred_at" DESC);



CREATE INDEX "audit_logs_2026_08_actor_id_occurred_at_idx" ON "iapp"."audit_logs_2026_08" USING "btree" ("actor_id", "occurred_at" DESC);



CREATE INDEX "idx_audit_time" ON ONLY "iapp"."audit_logs" USING "btree" ("occurred_at" DESC);



CREATE INDEX "audit_logs_2026_08_occurred_at_idx" ON "iapp"."audit_logs_2026_08" USING "btree" ("occurred_at" DESC);



CREATE INDEX "idx_audit_deny" ON ONLY "iapp"."audit_logs" USING "btree" ("occurred_at" DESC) WHERE ("outcome" = 'deny'::"text");



CREATE INDEX "audit_logs_2026_08_occurred_at_idx1" ON "iapp"."audit_logs_2026_08" USING "btree" ("occurred_at" DESC) WHERE ("outcome" = 'deny'::"text");



CREATE INDEX "idx_audit_patient" ON ONLY "iapp"."audit_logs" USING "btree" ("patient_id", "occurred_at" DESC);



CREATE INDEX "audit_logs_2026_08_patient_id_occurred_at_idx" ON "iapp"."audit_logs_2026_08" USING "btree" ("patient_id", "occurred_at" DESC);



CREATE INDEX "idx_audit_resource" ON ONLY "iapp"."audit_logs" USING "btree" ("resource", "record_id", "occurred_at" DESC);



CREATE INDEX "audit_logs_2026_08_resource_record_id_occurred_at_idx" ON "iapp"."audit_logs_2026_08" USING "btree" ("resource", "record_id", "occurred_at" DESC);



CREATE INDEX "audit_logs_2026_09_actor_id_occurred_at_idx" ON "iapp"."audit_logs_2026_09" USING "btree" ("actor_id", "occurred_at" DESC);



CREATE INDEX "audit_logs_2026_09_occurred_at_idx" ON "iapp"."audit_logs_2026_09" USING "btree" ("occurred_at" DESC);



CREATE INDEX "audit_logs_2026_09_occurred_at_idx1" ON "iapp"."audit_logs_2026_09" USING "btree" ("occurred_at" DESC) WHERE ("outcome" = 'deny'::"text");



CREATE INDEX "audit_logs_2026_09_patient_id_occurred_at_idx" ON "iapp"."audit_logs_2026_09" USING "btree" ("patient_id", "occurred_at" DESC);



CREATE INDEX "audit_logs_2026_09_resource_record_id_occurred_at_idx" ON "iapp"."audit_logs_2026_09" USING "btree" ("resource", "record_id", "occurred_at" DESC);



CREATE INDEX "audit_logs_2026_10_actor_id_occurred_at_idx" ON "iapp"."audit_logs_2026_10" USING "btree" ("actor_id", "occurred_at" DESC);



CREATE INDEX "audit_logs_2026_10_occurred_at_idx" ON "iapp"."audit_logs_2026_10" USING "btree" ("occurred_at" DESC);



CREATE INDEX "audit_logs_2026_10_occurred_at_idx1" ON "iapp"."audit_logs_2026_10" USING "btree" ("occurred_at" DESC) WHERE ("outcome" = 'deny'::"text");



CREATE INDEX "audit_logs_2026_10_patient_id_occurred_at_idx" ON "iapp"."audit_logs_2026_10" USING "btree" ("patient_id", "occurred_at" DESC);



CREATE INDEX "audit_logs_2026_10_resource_record_id_occurred_at_idx" ON "iapp"."audit_logs_2026_10" USING "btree" ("resource", "record_id", "occurred_at" DESC);



CREATE INDEX "audit_logs_default_actor_id_occurred_at_idx" ON "iapp"."audit_logs_default" USING "btree" ("actor_id", "occurred_at" DESC);



CREATE INDEX "audit_logs_default_occurred_at_idx" ON "iapp"."audit_logs_default" USING "btree" ("occurred_at" DESC);



CREATE INDEX "audit_logs_default_occurred_at_idx1" ON "iapp"."audit_logs_default" USING "btree" ("occurred_at" DESC) WHERE ("outcome" = 'deny'::"text");



CREATE INDEX "audit_logs_default_patient_id_occurred_at_idx" ON "iapp"."audit_logs_default" USING "btree" ("patient_id", "occurred_at" DESC);



CREATE INDEX "audit_logs_default_resource_record_id_occurred_at_idx" ON "iapp"."audit_logs_default" USING "btree" ("resource", "record_id", "occurred_at" DESC);



CREATE INDEX "idx_ai_analysis_actor" ON "iapp"."ai_analysis" USING "btree" ("created_by", "created_at" DESC);



CREATE INDEX "idx_ai_analysis_image" ON "iapp"."ai_analysis" USING "btree" ("image_id", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_ai_analysis_patient" ON "iapp"."ai_analysis" USING "btree" ("patient_id", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_ai_find_analysis" ON "iapp"."ai_findings" USING "btree" ("analysis_id", "seq");



CREATE INDEX "idx_apt_day_board" ON "iapp"."appointments" USING "btree" ("clinic_id", "scheduled_date", "scheduled_time") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_apt_doctor_day" ON "iapp"."appointments" USING "btree" ("doctor_id", "scheduled_date", "scheduled_time") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_apt_history" ON "iapp"."appointment_status_history" USING "btree" ("appointment_id", "occurred_at" DESC);



CREATE INDEX "idx_apt_inbox" ON "iapp"."appointments" USING "btree" ("clinic_id", "created_at" DESC) WHERE (("deleted_at" IS NULL) AND ("status" = ANY (ARRAY['REQUESTED'::"iapp"."appointment_status", 'PENDING'::"iapp"."appointment_status"])));



CREATE INDEX "idx_apt_live" ON "iapp"."appointments" USING "btree" ("clinic_id", "scheduled_date", "status") WHERE (("deleted_at" IS NULL) AND ("status" = ANY (ARRAY['ARRIVED'::"iapp"."appointment_status", 'WAITING'::"iapp"."appointment_status", 'IN_CLINIC'::"iapp"."appointment_status"])));



CREATE INDEX "idx_apt_patient" ON "iapp"."appointments" USING "btree" ("patient_id", "scheduled_date" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_apt_slot_gist" ON "iapp"."appointments" USING "gist" ("slot") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_doctors_active" ON "iapp"."doctors" USING "btree" ("is_active") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_doctors_profile" ON "iapp"."doctors" USING "btree" ("profile_id");



CREATE INDEX "idx_dx_active" ON "iapp"."diagnoses" USING "btree" ("patient_id") WHERE (("deleted_at" IS NULL) AND ("status" = 'active'::"iapp"."diagnosis_status"));



CREATE INDEX "idx_dx_patient" ON "iapp"."diagnoses" USING "btree" ("patient_id", "diagnosed_on" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dx_text_trgm" ON "iapp"."diagnoses" USING "gin" ("diagnosis_text" "public"."gin_trgm_ops") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_exams_patient_date" ON "iapp"."examinations" USING "btree" ("patient_id", "exam_date" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_exams_visit" ON "iapp"."examinations" USING "btree" ("visit_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_final_patient" ON "iapp"."final_report" USING "btree" ("patient_id", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_findings_exam" ON "iapp"."exam_findings" USING "btree" ("examination_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_findings_patient_field" ON "iapp"."exam_findings" USING "btree" ("patient_id", "field", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_fu_due_pending" ON "iapp"."follow_ups" USING "btree" ("due_date") WHERE (("deleted_at" IS NULL) AND ("status" = 'pending'::"iapp"."follow_up_status"));



CREATE INDEX "idx_fu_patient" ON "iapp"."follow_ups" USING "btree" ("patient_id", "due_date" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_imaging_items_order" ON "iapp"."imaging_order_items" USING "btree" ("order_id", "seq");



CREATE INDEX "idx_imaging_orders_open" ON "iapp"."imaging_orders" USING "btree" ("status", "ordered_on" DESC) WHERE (("deleted_at" IS NULL) AND ("status" = 'requested'::"iapp"."imaging_order_status"));



CREATE INDEX "idx_imaging_orders_patient" ON "iapp"."imaging_orders" USING "btree" ("patient_id", "ordered_on" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_img_modality" ON "iapp"."medical_images" USING "btree" ("modality", "study_date" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_img_patient" ON "iapp"."medical_images" USING "btree" ("patient_id", "captured_on" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_img_pending" ON "iapp"."medical_images" USING "btree" ("status", "study_date" DESC) WHERE (("deleted_at" IS NULL) AND ("status" <> 'reported'::"iapp"."imaging_status"));



CREATE INDEX "idx_img_reports" ON "iapp"."image_reports" USING "btree" ("image_id", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_img_reports_pending" ON "iapp"."image_reports" USING "btree" ("created_at" DESC) WHERE (("deleted_at" IS NULL) AND (NOT "is_approved"));



CREATE INDEX "idx_img_study" ON "iapp"."medical_images" USING "btree" ("patient_id", "study_date" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_img_visit" ON "iapp"."medical_images" USING "btree" ("visit_id");



CREATE INDEX "idx_iop_elevated" ON "iapp"."iop_measurements" USING "btree" ("patient_id", "measured_at" DESC) WHERE (("deleted_at" IS NULL) AND ("value_mmhg" >= (21)::numeric));



CREATE INDEX "idx_iop_patient" ON "iapp"."iop_measurements" USING "btree" ("patient_id", "measured_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_iop_patient_eye_time" ON "iapp"."iop_measurements" USING "btree" ("patient_id", "eye", "measured_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_meds_name_trgm" ON "iapp"."medications" USING "gin" ("name" "public"."gin_trgm_ops") WHERE "is_active";



CREATE INDEX "idx_notif_patient" ON "iapp"."notifications" USING "btree" ("patient_id", "created_at" DESC);



CREATE INDEX "idx_notif_pending" ON "iapp"."notifications" USING "btree" ("scheduled_for") WHERE ("status" = 'pending'::"iapp"."notification_status");



CREATE INDEX "idx_notif_unread" ON "iapp"."notifications" USING "btree" ("profile_id") WHERE ("status" <> 'read'::"iapp"."notification_status");



CREATE INDEX "idx_patients_clinic" ON "iapp"."patients" USING "btree" ("primary_clinic_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_patients_code" ON "iapp"."patients" USING "btree" ("patient_code") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_patients_created" ON "iapp"."patients" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_patients_legacy" ON "iapp"."patients" USING "btree" ("legacy_id");



CREATE INDEX "idx_patients_name_trgm" ON "iapp"."patients" USING "gin" ("full_name" "public"."gin_trgm_ops") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_patients_phone" ON "iapp"."patients" USING "btree" ("phone_normalized") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_patients_phone_active" ON "iapp"."patients" USING "btree" ("phone_normalized") WHERE (("deleted_at" IS NULL) AND "is_active");



CREATE INDEX "idx_pay_outstanding" ON "iapp"."payments" USING "btree" ("patient_id") WHERE (("deleted_at" IS NULL) AND ("status" = ANY (ARRAY['unpaid'::"iapp"."payment_status", 'partial'::"iapp"."payment_status"])));



CREATE INDEX "idx_pay_paid_at" ON "iapp"."payments" USING "btree" ("clinic_id", "paid_at") WHERE (("deleted_at" IS NULL) AND ("status" = 'paid'::"iapp"."payment_status"));



CREATE INDEX "idx_pay_patient" ON "iapp"."payments" USING "btree" ("patient_id", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_pay_visit" ON "iapp"."payments" USING "btree" ("visit_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_refr_exam" ON "iapp"."refractions" USING "btree" ("examination_id");



CREATE INDEX "idx_refr_patient" ON "iapp"."refractions" USING "btree" ("patient_id", "measured_on" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_refr_prescription" ON "iapp"."refractions" USING "btree" ("prescription_id");



CREATE INDEX "idx_review_image" ON "iapp"."doctor_review" USING "btree" ("image_id", "reviewed_at" DESC);



CREATE INDEX "idx_review_patient" ON "iapp"."doctor_review" USING "btree" ("patient_id", "reviewed_at" DESC);



CREATE INDEX "idx_rx_items" ON "iapp"."prescription_items" USING "btree" ("prescription_id", "sort_order") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_rx_items_unparsed" ON "iapp"."prescription_items" USING "btree" ("prescription_id") WHERE (("deleted_at" IS NULL) AND (NOT "is_parsed"));



CREATE INDEX "idx_rx_patient_date" ON "iapp"."prescriptions" USING "btree" ("patient_id", "prescribed_on" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_rx_visit" ON "iapp"."prescriptions" USING "btree" ("visit_id");



CREATE INDEX "idx_sched_clinic_day" ON "iapp"."clinic_schedules" USING "btree" ("clinic_id", "day_of_week") WHERE "is_active";



CREATE INDEX "idx_staff_clinic" ON "iapp"."staff" USING "btree" ("clinic_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_surgeries_patient" ON "iapp"."surgeries" USING "btree" ("patient_id", "performed_on" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_visits_clinic_date" ON "iapp"."visits" USING "btree" ("clinic_id", "visit_date") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_visits_date" ON "iapp"."visits" USING "btree" ("visit_date" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_visits_doctor_date" ON "iapp"."visits" USING "btree" ("doctor_id", "visit_date" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_visits_patient_date" ON "iapp"."visits" USING "btree" ("patient_id", "visit_date" DESC) WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "uq_ai_active_run" ON "iapp"."ai_analysis" USING "btree" ("image_id") WHERE (("status" = 'succeeded'::"iapp"."ai_run_status") AND ("deleted_at" IS NULL));



CREATE UNIQUE INDEX "uq_doctor_primary" ON "iapp"."doctors" USING "btree" ("is_primary") WHERE ("is_primary" AND ("deleted_at" IS NULL));



CREATE UNIQUE INDEX "uq_exam_findings_slot" ON "iapp"."exam_findings" USING "btree" ("examination_id", "eye", "field") WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "uq_final_per_image" ON "iapp"."final_report" USING "btree" ("image_id") WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "uq_find_cat" ON "iapp"."ai_findings" USING "btree" ("analysis_id", "category", "eye") NULLS NOT DISTINCT;



CREATE UNIQUE INDEX "uq_imaging_order_no" ON "iapp"."imaging_orders" USING "btree" ("order_no") WHERE ("order_no" IS NOT NULL);



CREATE UNIQUE INDEX "uq_review_active" ON "iapp"."doctor_review" USING "btree" ("analysis_id") WHERE ("superseded_at" IS NULL);



CREATE INDEX "idx_audit_deny" ON "public"."audit_log" USING "btree" ("occurred_at" DESC) WHERE ("outcome" = 'deny'::"text");



CREATE INDEX "idx_audit_patient" ON "public"."audit_log" USING "btree" ("patient_id", "occurred_at" DESC);



CREATE INDEX "idx_audit_time" ON "public"."audit_log" USING "btree" ("occurred_at" DESC);



CREATE INDEX "idx_audit_user" ON "public"."audit_log" USING "btree" ("user_id", "occurred_at" DESC);



CREATE INDEX "idx_auth_events_ident" ON "public"."auth_events" USING "btree" ("identifier", "occurred_at" DESC);



CREATE INDEX "idx_patient_links_user" ON "public"."patient_links" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_phone" ON "public"."profiles" USING "btree" ("phone");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role") WHERE "is_active";



ALTER INDEX "iapp"."idx_audit_actor" ATTACH PARTITION "iapp"."audit_logs_2026_08_actor_id_occurred_at_idx";



ALTER INDEX "iapp"."idx_audit_time" ATTACH PARTITION "iapp"."audit_logs_2026_08_occurred_at_idx";



ALTER INDEX "iapp"."idx_audit_deny" ATTACH PARTITION "iapp"."audit_logs_2026_08_occurred_at_idx1";



ALTER INDEX "iapp"."idx_audit_patient" ATTACH PARTITION "iapp"."audit_logs_2026_08_patient_id_occurred_at_idx";



ALTER INDEX "iapp"."audit_logs_pkey" ATTACH PARTITION "iapp"."audit_logs_2026_08_pkey";



ALTER INDEX "iapp"."idx_audit_resource" ATTACH PARTITION "iapp"."audit_logs_2026_08_resource_record_id_occurred_at_idx";



ALTER INDEX "iapp"."idx_audit_actor" ATTACH PARTITION "iapp"."audit_logs_2026_09_actor_id_occurred_at_idx";



ALTER INDEX "iapp"."idx_audit_time" ATTACH PARTITION "iapp"."audit_logs_2026_09_occurred_at_idx";



ALTER INDEX "iapp"."idx_audit_deny" ATTACH PARTITION "iapp"."audit_logs_2026_09_occurred_at_idx1";



ALTER INDEX "iapp"."idx_audit_patient" ATTACH PARTITION "iapp"."audit_logs_2026_09_patient_id_occurred_at_idx";



ALTER INDEX "iapp"."audit_logs_pkey" ATTACH PARTITION "iapp"."audit_logs_2026_09_pkey";



ALTER INDEX "iapp"."idx_audit_resource" ATTACH PARTITION "iapp"."audit_logs_2026_09_resource_record_id_occurred_at_idx";



ALTER INDEX "iapp"."idx_audit_actor" ATTACH PARTITION "iapp"."audit_logs_2026_10_actor_id_occurred_at_idx";



ALTER INDEX "iapp"."idx_audit_time" ATTACH PARTITION "iapp"."audit_logs_2026_10_occurred_at_idx";



ALTER INDEX "iapp"."idx_audit_deny" ATTACH PARTITION "iapp"."audit_logs_2026_10_occurred_at_idx1";



ALTER INDEX "iapp"."idx_audit_patient" ATTACH PARTITION "iapp"."audit_logs_2026_10_patient_id_occurred_at_idx";



ALTER INDEX "iapp"."audit_logs_pkey" ATTACH PARTITION "iapp"."audit_logs_2026_10_pkey";



ALTER INDEX "iapp"."idx_audit_resource" ATTACH PARTITION "iapp"."audit_logs_2026_10_resource_record_id_occurred_at_idx";



ALTER INDEX "iapp"."idx_audit_actor" ATTACH PARTITION "iapp"."audit_logs_default_actor_id_occurred_at_idx";



ALTER INDEX "iapp"."idx_audit_time" ATTACH PARTITION "iapp"."audit_logs_default_occurred_at_idx";



ALTER INDEX "iapp"."idx_audit_deny" ATTACH PARTITION "iapp"."audit_logs_default_occurred_at_idx1";



ALTER INDEX "iapp"."idx_audit_patient" ATTACH PARTITION "iapp"."audit_logs_default_patient_id_occurred_at_idx";



ALTER INDEX "iapp"."audit_logs_pkey" ATTACH PARTITION "iapp"."audit_logs_default_pkey";



ALTER INDEX "iapp"."idx_audit_resource" ATTACH PARTITION "iapp"."audit_logs_default_resource_record_id_occurred_at_idx";



CREATE OR REPLACE TRIGGER "trg_00_reject_noop" BEFORE UPDATE ON "iapp"."appointments" FOR EACH ROW EXECUTE FUNCTION "iapp"."tg_reject_noop_transition"();



CREATE OR REPLACE TRIGGER "trg_ai_finding_guard" BEFORE INSERT OR UPDATE ON "iapp"."ai_findings" FOR EACH ROW EXECUTE FUNCTION "iapp"."tg_ai_finding_guard"();



CREATE OR REPLACE TRIGGER "trg_ai_immutable" BEFORE UPDATE ON "iapp"."ai_analysis" FOR EACH ROW EXECUTE FUNCTION "iapp"."tg_ai_immutable"();



CREATE OR REPLACE TRIGGER "trg_ai_supersede" BEFORE INSERT OR UPDATE OF "status" ON "iapp"."ai_analysis" FOR EACH ROW EXECUTE FUNCTION "iapp"."tg_ai_supersede"();



CREATE OR REPLACE TRIGGER "trg_audit_ai_analysis" AFTER INSERT OR UPDATE OF "status" ON "iapp"."ai_analysis" FOR EACH ROW EXECUTE FUNCTION "iapp"."tg_ai_audit"();



CREATE OR REPLACE TRIGGER "trg_audit_final" AFTER INSERT OR UPDATE ON "iapp"."final_report" FOR EACH ROW EXECUTE FUNCTION "iapp"."tg_ai_audit"();



CREATE OR REPLACE TRIGGER "trg_audit_imaging_orders" AFTER INSERT OR DELETE OR UPDATE ON "iapp"."imaging_orders" FOR EACH ROW EXECUTE FUNCTION "iapp"."audit_imaging_orders"();



CREATE OR REPLACE TRIGGER "trg_audit_immutable" BEFORE DELETE OR UPDATE ON "iapp"."audit_logs" FOR EACH ROW EXECUTE FUNCTION "iapp"."block_audit_mutation"();



CREATE OR REPLACE TRIGGER "trg_audit_medical_images" AFTER INSERT OR DELETE OR UPDATE ON "iapp"."medical_images" FOR EACH ROW EXECUTE FUNCTION "iapp"."audit_medical_images"();



CREATE OR REPLACE TRIGGER "trg_audit_review" AFTER INSERT ON "iapp"."doctor_review" FOR EACH ROW EXECUTE FUNCTION "iapp"."tg_ai_audit"();



CREATE OR REPLACE TRIGGER "trg_dx_same_patient" BEFORE INSERT OR UPDATE ON "iapp"."diagnoses" FOR EACH ROW EXECUTE FUNCTION "iapp"."check_same_patient"();



CREATE OR REPLACE TRIGGER "trg_exam_same_patient" BEFORE INSERT OR UPDATE ON "iapp"."examinations" FOR EACH ROW EXECUTE FUNCTION "iapp"."check_same_patient"();



CREATE OR REPLACE TRIGGER "trg_final_requires_review" BEFORE INSERT OR UPDATE ON "iapp"."final_report" FOR EACH ROW EXECUTE FUNCTION "iapp"."tg_final_requires_review"();



CREATE OR REPLACE TRIGGER "trg_fu_same_patient" BEFORE INSERT OR UPDATE ON "iapp"."follow_ups" FOR EACH ROW EXECUTE FUNCTION "iapp"."check_same_patient"();



CREATE OR REPLACE TRIGGER "trg_imaging_defaults" BEFORE INSERT OR UPDATE ON "iapp"."medical_images" FOR EACH ROW EXECUTE FUNCTION "iapp"."tg_imaging_defaults"();



CREATE OR REPLACE TRIGGER "trg_imaging_order_defaults" BEFORE INSERT OR UPDATE ON "iapp"."imaging_orders" FOR EACH ROW EXECUTE FUNCTION "iapp"."tg_imaging_order_defaults"();



CREATE OR REPLACE TRIGGER "trg_img_same_patient" BEFORE INSERT OR UPDATE ON "iapp"."medical_images" FOR EACH ROW EXECUTE FUNCTION "iapp"."check_same_patient"();



CREATE OR REPLACE TRIGGER "trg_log_status" AFTER INSERT OR UPDATE ON "iapp"."appointments" FOR EACH ROW EXECUTE FUNCTION "iapp"."log_appointment_status"();



CREATE OR REPLACE TRIGGER "trg_notify_appointment" AFTER INSERT OR UPDATE ON "iapp"."appointments" FOR EACH ROW EXECUTE FUNCTION "iapp"."notify_appointment_change"();



CREATE OR REPLACE TRIGGER "trg_order_same_patient" BEFORE INSERT OR UPDATE ON "iapp"."imaging_orders" FOR EACH ROW EXECUTE FUNCTION "iapp"."check_same_patient"();



CREATE OR REPLACE TRIGGER "trg_patient_phone" BEFORE INSERT OR UPDATE OF "phone" ON "iapp"."patients" FOR EACH ROW EXECUTE FUNCTION "iapp"."sync_patient_phone"();



CREATE OR REPLACE TRIGGER "trg_pay_same_patient" BEFORE INSERT OR UPDATE ON "iapp"."payments" FOR EACH ROW EXECUTE FUNCTION "iapp"."check_same_patient"();



CREATE OR REPLACE TRIGGER "trg_payment_status" BEFORE INSERT OR UPDATE ON "iapp"."payments" FOR EACH ROW EXECUTE FUNCTION "iapp"."sync_payment_status"();



CREATE OR REPLACE TRIGGER "trg_review_guard" BEFORE INSERT ON "iapp"."doctor_review" FOR EACH ROW EXECUTE FUNCTION "iapp"."tg_review_guard"();



CREATE OR REPLACE TRIGGER "trg_rx_same_patient" BEFORE INSERT OR UPDATE ON "iapp"."prescriptions" FOR EACH ROW EXECUTE FUNCTION "iapp"."check_same_patient"();



CREATE OR REPLACE TRIGGER "trg_sync_last_visit" AFTER INSERT OR UPDATE OF "visit_date" ON "iapp"."visits" FOR EACH ROW EXECUTE FUNCTION "iapp"."sync_last_visit"();



CREATE OR REPLACE TRIGGER "trg_touch_clinic_schedules" BEFORE INSERT OR UPDATE ON "iapp"."clinic_schedules" FOR EACH ROW EXECUTE FUNCTION "iapp"."touch_row"();



CREATE OR REPLACE TRIGGER "trg_touch_clinics" BEFORE INSERT OR UPDATE ON "iapp"."clinics" FOR EACH ROW EXECUTE FUNCTION "iapp"."touch_row"();



CREATE OR REPLACE TRIGGER "trg_touch_diagnoses" BEFORE INSERT OR UPDATE ON "iapp"."diagnoses" FOR EACH ROW EXECUTE FUNCTION "iapp"."touch_row"();



CREATE OR REPLACE TRIGGER "trg_touch_doctors" BEFORE INSERT OR UPDATE ON "iapp"."doctors" FOR EACH ROW EXECUTE FUNCTION "iapp"."touch_row"();



CREATE OR REPLACE TRIGGER "trg_touch_examinations" BEFORE INSERT OR UPDATE ON "iapp"."examinations" FOR EACH ROW EXECUTE FUNCTION "iapp"."touch_row"();



CREATE OR REPLACE TRIGGER "trg_touch_follow_ups" BEFORE INSERT OR UPDATE ON "iapp"."follow_ups" FOR EACH ROW EXECUTE FUNCTION "iapp"."touch_row"();



CREATE OR REPLACE TRIGGER "trg_touch_image_reports" BEFORE INSERT OR UPDATE ON "iapp"."image_reports" FOR EACH ROW EXECUTE FUNCTION "iapp"."touch_row"();



CREATE OR REPLACE TRIGGER "trg_touch_imaging_orders" BEFORE INSERT OR UPDATE ON "iapp"."imaging_orders" FOR EACH ROW EXECUTE FUNCTION "iapp"."touch_row"();



CREATE OR REPLACE TRIGGER "trg_touch_iop_measurements" BEFORE INSERT OR UPDATE ON "iapp"."iop_measurements" FOR EACH ROW EXECUTE FUNCTION "iapp"."touch_row"();



CREATE OR REPLACE TRIGGER "trg_touch_medical_images" BEFORE INSERT OR UPDATE ON "iapp"."medical_images" FOR EACH ROW EXECUTE FUNCTION "iapp"."touch_row"();



CREATE OR REPLACE TRIGGER "trg_touch_medications" BEFORE INSERT OR UPDATE ON "iapp"."medications" FOR EACH ROW EXECUTE FUNCTION "iapp"."touch_row"();



CREATE OR REPLACE TRIGGER "trg_touch_notifications" BEFORE INSERT OR UPDATE ON "iapp"."notifications" FOR EACH ROW EXECUTE FUNCTION "iapp"."touch_row"();



CREATE OR REPLACE TRIGGER "trg_touch_patients" BEFORE INSERT OR UPDATE ON "iapp"."patients" FOR EACH ROW EXECUTE FUNCTION "iapp"."touch_row"();



CREATE OR REPLACE TRIGGER "trg_touch_payments" BEFORE INSERT OR UPDATE ON "iapp"."payments" FOR EACH ROW EXECUTE FUNCTION "iapp"."touch_row"();



CREATE OR REPLACE TRIGGER "trg_touch_prescription_items" BEFORE INSERT OR UPDATE ON "iapp"."prescription_items" FOR EACH ROW EXECUTE FUNCTION "iapp"."touch_row"();



CREATE OR REPLACE TRIGGER "trg_touch_prescriptions" BEFORE INSERT OR UPDATE ON "iapp"."prescriptions" FOR EACH ROW EXECUTE FUNCTION "iapp"."touch_row"();



CREATE OR REPLACE TRIGGER "trg_touch_refractions" BEFORE INSERT OR UPDATE ON "iapp"."refractions" FOR EACH ROW EXECUTE FUNCTION "iapp"."touch_row"();



CREATE OR REPLACE TRIGGER "trg_touch_roles" BEFORE INSERT OR UPDATE ON "iapp"."roles" FOR EACH ROW EXECUTE FUNCTION "iapp"."touch_row"();



CREATE OR REPLACE TRIGGER "trg_touch_services" BEFORE INSERT OR UPDATE ON "iapp"."services" FOR EACH ROW EXECUTE FUNCTION "iapp"."touch_row"();



CREATE OR REPLACE TRIGGER "trg_touch_staff" BEFORE INSERT OR UPDATE ON "iapp"."staff" FOR EACH ROW EXECUTE FUNCTION "iapp"."touch_row"();



CREATE OR REPLACE TRIGGER "trg_touch_visit_ratings" BEFORE INSERT OR UPDATE ON "iapp"."visit_ratings" FOR EACH ROW EXECUTE FUNCTION "iapp"."touch_row"();



CREATE OR REPLACE TRIGGER "trg_touch_visits" BEFORE INSERT OR UPDATE ON "iapp"."visits" FOR EACH ROW EXECUTE FUNCTION "iapp"."touch_row"();



CREATE OR REPLACE TRIGGER "trg_validate_transition" BEFORE INSERT OR UPDATE ON "iapp"."appointments" FOR EACH ROW EXECUTE FUNCTION "iapp"."validate_appointment_transition"();



CREATE OR REPLACE TRIGGER "trg_audit_no_update" BEFORE DELETE OR UPDATE ON "public"."audit_log" FOR EACH ROW EXECUTE FUNCTION "public"."block_audit_mutation"();



CREATE OR REPLACE TRIGGER "trg_guard_profile_role" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."guard_profile_role"();



ALTER TABLE ONLY "iapp"."ai_analysis"
    ADD CONSTRAINT "ai_analysis_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."ai_analysis"
    ADD CONSTRAINT "ai_analysis_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "iapp"."medical_images"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "iapp"."ai_analysis"
    ADD CONSTRAINT "ai_analysis_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "iapp"."ai_analysis"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."ai_analysis"
    ADD CONSTRAINT "ai_analysis_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "iapp"."patients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iapp"."ai_analysis"
    ADD CONSTRAINT "ai_analysis_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "iapp"."visits"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."ai_findings"
    ADD CONSTRAINT "ai_findings_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "iapp"."ai_analysis"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "iapp"."ai_findings"
    ADD CONSTRAINT "ai_findings_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "iapp"."patients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iapp"."ai_impression"
    ADD CONSTRAINT "ai_impression_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "iapp"."ai_analysis"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "iapp"."ai_impression"
    ADD CONSTRAINT "ai_impression_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "iapp"."patients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iapp"."appointment_status_history"
    ADD CONSTRAINT "appointment_status_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."appointment_status_history"
    ADD CONSTRAINT "appointment_status_history_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "iapp"."appointments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "iapp"."appointments"
    ADD CONSTRAINT "appointments_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."appointments"
    ADD CONSTRAINT "appointments_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "iapp"."clinics"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iapp"."appointments"
    ADD CONSTRAINT "appointments_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."appointments"
    ADD CONSTRAINT "appointments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."appointments"
    ADD CONSTRAINT "appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "iapp"."doctors"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iapp"."appointments"
    ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "iapp"."patients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iapp"."appointments"
    ADD CONSTRAINT "appointments_rescheduled_from_fkey" FOREIGN KEY ("rescheduled_from") REFERENCES "iapp"."appointments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."appointments"
    ADD CONSTRAINT "appointments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."appointments"
    ADD CONSTRAINT "appointments_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "iapp"."visits"("id") ON DELETE SET NULL;



ALTER TABLE "iapp"."audit_logs"
    ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."clinic_schedules"
    ADD CONSTRAINT "clinic_schedules_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "iapp"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "iapp"."clinic_schedules"
    ADD CONSTRAINT "clinic_schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."clinic_schedules"
    ADD CONSTRAINT "clinic_schedules_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."clinics"
    ADD CONSTRAINT "clinics_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."clinics"
    ADD CONSTRAINT "clinics_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."diagnoses"
    ADD CONSTRAINT "diagnoses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."diagnoses"
    ADD CONSTRAINT "diagnoses_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "iapp"."doctors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."diagnoses"
    ADD CONSTRAINT "diagnoses_examination_id_fkey" FOREIGN KEY ("examination_id") REFERENCES "iapp"."examinations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."diagnoses"
    ADD CONSTRAINT "diagnoses_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "iapp"."patients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iapp"."diagnoses"
    ADD CONSTRAINT "diagnoses_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."diagnoses"
    ADD CONSTRAINT "diagnoses_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "iapp"."visits"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."doctor_review"
    ADD CONSTRAINT "doctor_review_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "iapp"."ai_analysis"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "iapp"."doctor_review"
    ADD CONSTRAINT "doctor_review_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "iapp"."medical_images"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "iapp"."doctor_review"
    ADD CONSTRAINT "doctor_review_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "iapp"."patients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iapp"."doctor_review"
    ADD CONSTRAINT "doctor_review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iapp"."doctors"
    ADD CONSTRAINT "doctors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."doctors"
    ADD CONSTRAINT "doctors_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."doctors"
    ADD CONSTRAINT "doctors_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."exam_findings"
    ADD CONSTRAINT "exam_findings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."exam_findings"
    ADD CONSTRAINT "exam_findings_examination_id_fkey" FOREIGN KEY ("examination_id") REFERENCES "iapp"."examinations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "iapp"."exam_findings"
    ADD CONSTRAINT "exam_findings_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "iapp"."patients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iapp"."exam_findings"
    ADD CONSTRAINT "exam_findings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."examinations"
    ADD CONSTRAINT "examinations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."examinations"
    ADD CONSTRAINT "examinations_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "iapp"."doctors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."examinations"
    ADD CONSTRAINT "examinations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "iapp"."patients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iapp"."examinations"
    ADD CONSTRAINT "examinations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."examinations"
    ADD CONSTRAINT "examinations_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "iapp"."visits"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."final_report"
    ADD CONSTRAINT "final_report_ai_analysis_id_fkey" FOREIGN KEY ("ai_analysis_id") REFERENCES "iapp"."ai_analysis"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."final_report"
    ADD CONSTRAINT "final_report_authored_by_fkey" FOREIGN KEY ("authored_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iapp"."final_report"
    ADD CONSTRAINT "final_report_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "iapp"."medical_images"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "iapp"."final_report"
    ADD CONSTRAINT "final_report_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "iapp"."patients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iapp"."final_report"
    ADD CONSTRAINT "final_report_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "iapp"."visits"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."ai_findings"
    ADD CONSTRAINT "fk_find_catalog" FOREIGN KEY ("modality", "category") REFERENCES "iapp"."ai_finding_catalog"("modality", "category");



ALTER TABLE ONLY "iapp"."refractions"
    ADD CONSTRAINT "fk_refraction_prescription" FOREIGN KEY ("prescription_id") REFERENCES "iapp"."prescriptions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."clinic_schedules"
    ADD CONSTRAINT "fk_schedule_doctor" FOREIGN KEY ("doctor_id") REFERENCES "iapp"."doctors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."follow_ups"
    ADD CONSTRAINT "follow_ups_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "iapp"."clinics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."follow_ups"
    ADD CONSTRAINT "follow_ups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."follow_ups"
    ADD CONSTRAINT "follow_ups_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "iapp"."doctors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."follow_ups"
    ADD CONSTRAINT "follow_ups_examination_id_fkey" FOREIGN KEY ("examination_id") REFERENCES "iapp"."examinations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."follow_ups"
    ADD CONSTRAINT "follow_ups_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "iapp"."patients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iapp"."follow_ups"
    ADD CONSTRAINT "follow_ups_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."follow_ups"
    ADD CONSTRAINT "follow_ups_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "iapp"."visits"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."image_reports"
    ADD CONSTRAINT "image_reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."image_reports"
    ADD CONSTRAINT "image_reports_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "iapp"."medical_images"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "iapp"."image_reports"
    ADD CONSTRAINT "image_reports_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "iapp"."patients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iapp"."image_reports"
    ADD CONSTRAINT "image_reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "iapp"."doctors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."image_reports"
    ADD CONSTRAINT "image_reports_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."imaging_order_items"
    ADD CONSTRAINT "imaging_order_items_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "iapp"."medical_images"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."imaging_order_items"
    ADD CONSTRAINT "imaging_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "iapp"."imaging_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "iapp"."imaging_orders"
    ADD CONSTRAINT "imaging_orders_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "iapp"."clinics"("id");



ALTER TABLE ONLY "iapp"."imaging_orders"
    ADD CONSTRAINT "imaging_orders_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "iapp"."doctors"("id");



ALTER TABLE ONLY "iapp"."imaging_orders"
    ADD CONSTRAINT "imaging_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "iapp"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "iapp"."imaging_orders"
    ADD CONSTRAINT "imaging_orders_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "iapp"."visits"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."iop_measurements"
    ADD CONSTRAINT "iop_measurements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."iop_measurements"
    ADD CONSTRAINT "iop_measurements_examination_id_fkey" FOREIGN KEY ("examination_id") REFERENCES "iapp"."examinations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."iop_measurements"
    ADD CONSTRAINT "iop_measurements_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "iapp"."patients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iapp"."iop_measurements"
    ADD CONSTRAINT "iop_measurements_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."iop_measurements"
    ADD CONSTRAINT "iop_measurements_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "iapp"."visits"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."medical_images"
    ADD CONSTRAINT "medical_images_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."medical_images"
    ADD CONSTRAINT "medical_images_examination_id_fkey" FOREIGN KEY ("examination_id") REFERENCES "iapp"."examinations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."medical_images"
    ADD CONSTRAINT "medical_images_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "iapp"."patients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iapp"."medical_images"
    ADD CONSTRAINT "medical_images_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."medical_images"
    ADD CONSTRAINT "medical_images_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."medical_images"
    ADD CONSTRAINT "medical_images_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "iapp"."visits"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."medications"
    ADD CONSTRAINT "medications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."medications"
    ADD CONSTRAINT "medications_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."migration_issues"
    ADD CONSTRAINT "migration_issues_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "iapp"."migration_runs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "iapp"."notifications"
    ADD CONSTRAINT "notifications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."notifications"
    ADD CONSTRAINT "notifications_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "iapp"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "iapp"."notifications"
    ADD CONSTRAINT "notifications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "iapp"."notifications"
    ADD CONSTRAINT "notifications_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."patients"
    ADD CONSTRAINT "patients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."patients"
    ADD CONSTRAINT "patients_primary_clinic_id_fkey" FOREIGN KEY ("primary_clinic_id") REFERENCES "iapp"."clinics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."patients"
    ADD CONSTRAINT "patients_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."payments"
    ADD CONSTRAINT "payments_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "iapp"."clinics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."payments"
    ADD CONSTRAINT "payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."payments"
    ADD CONSTRAINT "payments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "iapp"."patients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iapp"."payments"
    ADD CONSTRAINT "payments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "iapp"."services"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."payments"
    ADD CONSTRAINT "payments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."payments"
    ADD CONSTRAINT "payments_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "iapp"."visits"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."prescription_items"
    ADD CONSTRAINT "prescription_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."prescription_items"
    ADD CONSTRAINT "prescription_items_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "iapp"."medications"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."prescription_items"
    ADD CONSTRAINT "prescription_items_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "iapp"."prescriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "iapp"."prescription_items"
    ADD CONSTRAINT "prescription_items_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."prescriptions"
    ADD CONSTRAINT "prescriptions_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "iapp"."clinics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."prescriptions"
    ADD CONSTRAINT "prescriptions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."prescriptions"
    ADD CONSTRAINT "prescriptions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "iapp"."doctors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."prescriptions"
    ADD CONSTRAINT "prescriptions_examination_id_fkey" FOREIGN KEY ("examination_id") REFERENCES "iapp"."examinations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."prescriptions"
    ADD CONSTRAINT "prescriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "iapp"."patients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iapp"."prescriptions"
    ADD CONSTRAINT "prescriptions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."prescriptions"
    ADD CONSTRAINT "prescriptions_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "iapp"."visits"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."refractions"
    ADD CONSTRAINT "refractions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."refractions"
    ADD CONSTRAINT "refractions_examination_id_fkey" FOREIGN KEY ("examination_id") REFERENCES "iapp"."examinations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."refractions"
    ADD CONSTRAINT "refractions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "iapp"."patients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iapp"."refractions"
    ADD CONSTRAINT "refractions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."refractions"
    ADD CONSTRAINT "refractions_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "iapp"."visits"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."roles"
    ADD CONSTRAINT "roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."roles"
    ADD CONSTRAINT "roles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."services"
    ADD CONSTRAINT "services_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."services"
    ADD CONSTRAINT "services_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."staff"
    ADD CONSTRAINT "staff_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "iapp"."clinics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."staff"
    ADD CONSTRAINT "staff_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."staff"
    ADD CONSTRAINT "staff_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."staff"
    ADD CONSTRAINT "staff_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."surgeries"
    ADD CONSTRAINT "surgeries_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "iapp"."clinics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."surgeries"
    ADD CONSTRAINT "surgeries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."surgeries"
    ADD CONSTRAINT "surgeries_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "iapp"."doctors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."surgeries"
    ADD CONSTRAINT "surgeries_examination_id_fkey" FOREIGN KEY ("examination_id") REFERENCES "iapp"."examinations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."surgeries"
    ADD CONSTRAINT "surgeries_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "iapp"."patients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iapp"."surgeries"
    ADD CONSTRAINT "surgeries_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."surgeries"
    ADD CONSTRAINT "surgeries_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "iapp"."visits"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."visit_ratings"
    ADD CONSTRAINT "visit_ratings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."visit_ratings"
    ADD CONSTRAINT "visit_ratings_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "iapp"."patients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."visit_ratings"
    ADD CONSTRAINT "visit_ratings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."visit_ratings"
    ADD CONSTRAINT "visit_ratings_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "iapp"."visits"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."visits"
    ADD CONSTRAINT "visits_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "iapp"."clinics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."visits"
    ADD CONSTRAINT "visits_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."visits"
    ADD CONSTRAINT "visits_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "iapp"."doctors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."visits"
    ADD CONSTRAINT "visits_locked_by_fkey" FOREIGN KEY ("locked_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iapp"."visits"
    ADD CONSTRAINT "visits_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "iapp"."patients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iapp"."visits"
    ADD CONSTRAINT "visits_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."patient_links"
    ADD CONSTRAINT "patient_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_links"
    ADD CONSTRAINT "patient_links_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "iapp"."ai_analysis" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_analysis_clinical" ON "iapp"."ai_analysis" TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



CREATE POLICY "ai_catalog_read" ON "iapp"."ai_finding_catalog" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "iapp"."ai_finding_catalog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."ai_findings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_findings_clinical" ON "iapp"."ai_findings" TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



ALTER TABLE "iapp"."ai_impression" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_impression_clinical" ON "iapp"."ai_impression" TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



ALTER TABLE "iapp"."appointment_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."appointment_transitions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."appointments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "apt_patient_read" ON "iapp"."appointments" FOR SELECT TO "authenticated" USING (("patient_id" = "iapp"."my_patient_id"()));



CREATE POLICY "apt_secretary_read" ON "iapp"."appointments" FOR SELECT TO "authenticated" USING (("iapp"."is_secretary"() AND ("clinic_id" IN ( SELECT "iapp"."my_clinic_ids"() AS "my_clinic_ids"))));



CREATE POLICY "apt_staff_read" ON "iapp"."appointments" FOR SELECT TO "authenticated" USING (("iapp"."is_doctor"() OR "public"."is_admin"()));



CREATE POLICY "audit_admin_read" ON "iapp"."audit_logs" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



ALTER TABLE "iapp"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."audit_logs_2026_08" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_logs_2026_08_admin" ON "iapp"."audit_logs_2026_08" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



ALTER TABLE "iapp"."audit_logs_2026_09" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_logs_2026_09_admin" ON "iapp"."audit_logs_2026_09" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



ALTER TABLE "iapp"."audit_logs_2026_10" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_logs_2026_10_admin" ON "iapp"."audit_logs_2026_10" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



ALTER TABLE "iapp"."audit_logs_default" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_logs_default_admin" ON "iapp"."audit_logs_default" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "audit_patient_read" ON "iapp"."audit_logs" FOR SELECT TO "authenticated" USING ((("patient_id" IS NOT NULL) AND ("patient_id" = "iapp"."current_patient_uuid"())));



CREATE POLICY "auditlog_admin" ON "iapp"."audit_logs" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "auditlog_own_patient" ON "iapp"."audit_logs" FOR SELECT TO "authenticated" USING ((("patient_id" IS NOT NULL) AND ("patient_id" = "iapp"."my_patient_id"())));



CREATE POLICY "clinic_read" ON "iapp"."clinics" FOR SELECT TO "authenticated" USING (("is_active" AND ("deleted_at" IS NULL)));



ALTER TABLE "iapp"."clinic_schedules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clinic_write" ON "iapp"."clinics" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "iapp"."clinics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."diagnoses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "diagnoses_clinical_all" ON "iapp"."diagnoses" TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



CREATE POLICY "diagnoses_patient_read" ON "iapp"."diagnoses" FOR SELECT TO "authenticated" USING ((("patient_id" = "iapp"."current_patient_uuid"()) AND ("deleted_at" IS NULL)));



CREATE POLICY "doc_read" ON "iapp"."doctors" FOR SELECT TO "authenticated" USING (("deleted_at" IS NULL));



CREATE POLICY "doc_write" ON "iapp"."doctors" TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



ALTER TABLE "iapp"."doctor_review" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "doctor_review_clinical" ON "iapp"."doctor_review" TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK (("iapp"."is_doctor"() AND ("reviewer_id" = "auth"."uid"())));



ALTER TABLE "iapp"."doctors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."exam_findings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "exam_findings_clinical_all" ON "iapp"."exam_findings" TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



CREATE POLICY "exam_findings_patient_read" ON "iapp"."exam_findings" FOR SELECT TO "authenticated" USING ((("patient_id" = "iapp"."current_patient_uuid"()) AND ("deleted_at" IS NULL)));



ALTER TABLE "iapp"."examinations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "examinations_clinical_all" ON "iapp"."examinations" TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



CREATE POLICY "examinations_patient_read" ON "iapp"."examinations" FOR SELECT TO "authenticated" USING ((("patient_id" = "iapp"."current_patient_uuid"()) AND ("deleted_at" IS NULL)));



ALTER TABLE "iapp"."final_report" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "final_report_clinical" ON "iapp"."final_report" TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



CREATE POLICY "final_report_patient_read" ON "iapp"."final_report" FOR SELECT TO "authenticated" USING ((("status" = 'final'::"iapp"."report_state") AND ("deleted_at" IS NULL) AND ("patient_id" = "iapp"."my_patient_id"())));



ALTER TABLE "iapp"."follow_ups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "follow_ups_clinical_all" ON "iapp"."follow_ups" TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



CREATE POLICY "follow_ups_patient_read" ON "iapp"."follow_ups" FOR SELECT TO "authenticated" USING ((("patient_id" = "iapp"."current_patient_uuid"()) AND ("deleted_at" IS NULL)));



CREATE POLICY "hist_read" ON "iapp"."appointment_status_history" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "iapp"."appointments" "a"
  WHERE ("a"."id" = "appointment_status_history"."appointment_id"))));



ALTER TABLE "iapp"."image_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "imaging_items_delete" ON "iapp"."imaging_order_items" FOR DELETE TO "authenticated" USING ("iapp"."is_doctor"());



CREATE POLICY "imaging_items_read" ON "iapp"."imaging_order_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "iapp"."imaging_orders" "o"
  WHERE (("o"."id" = "imaging_order_items"."order_id") AND ("iapp"."is_doctor"() OR ("o"."patient_id" = "iapp"."current_patient_uuid"()))))));



CREATE POLICY "imaging_items_update" ON "iapp"."imaging_order_items" FOR UPDATE TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



CREATE POLICY "imaging_items_write" ON "iapp"."imaging_order_items" FOR INSERT TO "authenticated" WITH CHECK ("iapp"."is_doctor"());



ALTER TABLE "iapp"."imaging_order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."imaging_orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "imaging_orders_delete" ON "iapp"."imaging_orders" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "imaging_orders_insert" ON "iapp"."imaging_orders" FOR INSERT TO "authenticated" WITH CHECK ("iapp"."is_doctor"());



CREATE POLICY "imaging_orders_patient" ON "iapp"."imaging_orders" FOR SELECT TO "authenticated" USING ((("patient_id" = "iapp"."current_patient_uuid"()) AND ("deleted_at" IS NULL)));



CREATE POLICY "imaging_orders_read" ON "iapp"."imaging_orders" FOR SELECT TO "authenticated" USING ("iapp"."is_doctor"());



CREATE POLICY "imaging_orders_update" ON "iapp"."imaging_orders" FOR UPDATE TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



CREATE POLICY "imgrep_via_parent" ON "iapp"."image_reports" TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



ALTER TABLE "iapp"."iop_measurements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "iop_measurements_clinical_all" ON "iapp"."iop_measurements" TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



CREATE POLICY "iop_measurements_patient_read" ON "iapp"."iop_measurements" FOR SELECT TO "authenticated" USING ((("patient_id" = "iapp"."current_patient_uuid"()) AND ("deleted_at" IS NULL)));



ALTER TABLE "iapp"."medical_images" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "medical_images_delete" ON "iapp"."medical_images" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "medical_images_insert" ON "iapp"."medical_images" FOR INSERT TO "authenticated" WITH CHECK ("iapp"."is_doctor"());



CREATE POLICY "medical_images_patient_read" ON "iapp"."medical_images" FOR SELECT TO "authenticated" USING ((("patient_id" = "iapp"."current_patient_uuid"()) AND ("deleted_at" IS NULL)));



CREATE POLICY "medical_images_read" ON "iapp"."medical_images" FOR SELECT TO "authenticated" USING ("iapp"."is_doctor"());



CREATE POLICY "medical_images_update" ON "iapp"."medical_images" FOR UPDATE TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



ALTER TABLE "iapp"."medications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "meds_read" ON "iapp"."medications" FOR SELECT TO "authenticated" USING (("is_active" AND "iapp"."is_doctor"()));



CREATE POLICY "meds_write" ON "iapp"."medications" TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



CREATE POLICY "mig_admin" ON "iapp"."migration_runs" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "migissue_admin" ON "iapp"."migration_issues" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "iapp"."migration_issues" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."migration_runs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notif_mark_read" ON "iapp"."notifications" FOR UPDATE TO "authenticated" USING ((("profile_id" = "auth"."uid"()) OR ("patient_id" = "iapp"."current_patient_uuid"()))) WITH CHECK ((("profile_id" = "auth"."uid"()) OR ("patient_id" = "iapp"."current_patient_uuid"())));



CREATE POLICY "notif_own" ON "iapp"."notifications" FOR SELECT TO "authenticated" USING ((("profile_id" = "auth"."uid"()) OR ("patient_id" = "iapp"."current_patient_uuid"())));



CREATE POLICY "notif_staff_write" ON "iapp"."notifications" TO "authenticated" USING ("public"."is_staff"()) WITH CHECK ("public"."is_staff"());



ALTER TABLE "iapp"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pat_clinical_all" ON "iapp"."patients" TO "authenticated" USING (("iapp"."is_doctor"() AND ("deleted_at" IS NULL))) WITH CHECK ("iapp"."is_doctor"());



CREATE POLICY "pat_secretary_read" ON "iapp"."patients" FOR SELECT TO "authenticated" USING (("iapp"."is_secretary"() AND ("deleted_at" IS NULL)));



CREATE POLICY "pat_secretary_update" ON "iapp"."patients" FOR UPDATE TO "authenticated" USING (("iapp"."is_secretary"() AND ("deleted_at" IS NULL))) WITH CHECK ("iapp"."is_secretary"());



CREATE POLICY "pat_secretary_write" ON "iapp"."patients" FOR INSERT TO "authenticated" WITH CHECK ("iapp"."is_secretary"());



CREATE POLICY "pat_self_read" ON "iapp"."patients" FOR SELECT TO "authenticated" USING ((("id" = "iapp"."current_patient_uuid"()) AND ("deleted_at" IS NULL)));



ALTER TABLE "iapp"."patients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pay_clinical_all" ON "iapp"."payments" TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



CREATE POLICY "pay_patient_read" ON "iapp"."payments" FOR SELECT TO "authenticated" USING ((("patient_id" = "iapp"."current_patient_uuid"()) AND ("deleted_at" IS NULL)));



CREATE POLICY "pay_secretary" ON "iapp"."payments" TO "authenticated" USING (("iapp"."is_secretary"() AND ("clinic_id" IN ( SELECT "iapp"."my_clinic_ids"() AS "my_clinic_ids")))) WITH CHECK ("iapp"."is_secretary"());



ALTER TABLE "iapp"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."prescription_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."prescriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "prescriptions_clinical_all" ON "iapp"."prescriptions" TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



CREATE POLICY "prescriptions_patient_read" ON "iapp"."prescriptions" FOR SELECT TO "authenticated" USING ((("patient_id" = "iapp"."current_patient_uuid"()) AND ("deleted_at" IS NULL)));



CREATE POLICY "rating_doctor" ON "iapp"."visit_ratings" TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



CREATE POLICY "rating_patient_create" ON "iapp"."visit_ratings" FOR INSERT TO "authenticated" WITH CHECK (("patient_id" = "iapp"."current_patient_uuid"()));



CREATE POLICY "rating_patient_read" ON "iapp"."visit_ratings" FOR SELECT TO "authenticated" USING ((("patient_id" = "iapp"."current_patient_uuid"()) OR "iapp"."is_doctor"()));



ALTER TABLE "iapp"."refractions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "refractions_clinical_all" ON "iapp"."refractions" TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



CREATE POLICY "refractions_patient_read" ON "iapp"."refractions" FOR SELECT TO "authenticated" USING ((("patient_id" = "iapp"."current_patient_uuid"()) AND ("deleted_at" IS NULL)));



ALTER TABLE "iapp"."roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "roles_admin" ON "iapp"."roles" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "roles_read" ON "iapp"."roles" FOR SELECT TO "authenticated" USING ("is_active");



CREATE POLICY "rxitem_via_parent" ON "iapp"."prescription_items" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "iapp"."prescriptions" "p"
  WHERE (("p"."id" = "prescription_items"."prescription_id") AND ("iapp"."is_doctor"() OR ("p"."patient_id" = "iapp"."current_patient_uuid"())))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "iapp"."prescriptions" "p"
  WHERE (("p"."id" = "prescription_items"."prescription_id") AND "iapp"."is_doctor"()))));



CREATE POLICY "sched_read" ON "iapp"."clinic_schedules" FOR SELECT TO "authenticated" USING ("is_active");



CREATE POLICY "sched_write" ON "iapp"."clinic_schedules" TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



ALTER TABLE "iapp"."services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."staff" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "staff_admin" ON "iapp"."staff" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "staff_self" ON "iapp"."staff" FOR SELECT TO "authenticated" USING (("profile_id" = "auth"."uid"()));



ALTER TABLE "iapp"."surgeries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "surgeries_clinical_all" ON "iapp"."surgeries" TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



CREATE POLICY "surgeries_patient_read" ON "iapp"."surgeries" FOR SELECT TO "authenticated" USING ((("patient_id" = "iapp"."current_patient_uuid"()) AND ("deleted_at" IS NULL)));



CREATE POLICY "svc_read_all" ON "iapp"."services" FOR SELECT TO "authenticated" USING (("is_active" AND ("deleted_at" IS NULL)));



CREATE POLICY "svc_write_doctor" ON "iapp"."services" TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



CREATE POLICY "transitions_admin" ON "iapp"."appointment_transitions" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "transitions_read" ON "iapp"."appointment_transitions" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "iapp"."visit_ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "iapp"."visits" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "visits_clinical_all" ON "iapp"."visits" TO "authenticated" USING ("iapp"."is_doctor"()) WITH CHECK ("iapp"."is_doctor"());



CREATE POLICY "visits_patient_read" ON "iapp"."visits" FOR SELECT TO "authenticated" USING ((("patient_id" = "iapp"."current_patient_uuid"()) AND ("deleted_at" IS NULL)));



ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_select_admin" ON "public"."audit_log" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



ALTER TABLE "public"."auth_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authev_admin" ON "public"."auth_events" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



ALTER TABLE "public"."patient_links" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "plinks_admin_write" ON "public"."patient_links" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "plinks_select_self" ON "public"."patient_links" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "plinks_select_staff" ON "public"."patient_links" FOR SELECT TO "authenticated" USING ("public"."is_staff"());



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_admin_write" ON "public"."profiles" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "profiles_select_self" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "profiles_select_staff" ON "public"."profiles" FOR SELECT TO "authenticated" USING ("public"."is_staff"());



CREATE POLICY "profiles_update_self" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



GRANT USAGE ON SCHEMA "iapp" TO "authenticated";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "iapp"."ai_quota_used"("p_hours" integer) TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."final_report" TO "authenticated";



GRANT ALL ON FUNCTION "iapp"."ai_to_final_report"("p_analysis_id" "uuid", "p_text" "text", "p_finalize" boolean) TO "authenticated";



GRANT ALL ON FUNCTION "iapp"."available_slots"("p_clinic_id" "uuid", "p_date" "date", "p_doctor_id" "uuid") TO "authenticated";



GRANT SELECT ON TABLE "iapp"."appointments" TO "authenticated";



GRANT ALL ON FUNCTION "iapp"."book_appointment"("p_clinic_id" "uuid", "p_date" "date", "p_time" time without time zone, "p_patient_id" "uuid", "p_doctor_id" "uuid", "p_type" "text", "p_notes" "text", "p_room" "text", "p_duration" smallint, "p_guest_name" "text", "p_guest_phone" "text") TO "authenticated";



GRANT ALL ON FUNCTION "iapp"."call_patient"("p_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "iapp"."cancel_appointment"("p_id" "uuid", "p_reason" "text") TO "authenticated";



GRANT ALL ON FUNCTION "iapp"."claim_patient_record"("p_code" "text", "p_phone" "text") TO "authenticated";



GRANT ALL ON FUNCTION "iapp"."complete_appointment"("p_id" "uuid", "p_visit_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "iapp"."confirm_appointment"("p_id" "uuid") TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."medical_images" TO "authenticated";



GRANT ALL ON FUNCTION "iapp"."log_event"("p_resource" "text", "p_action" "text", "p_record_id" "uuid", "p_patient_id" "uuid", "p_outcome" "text", "p_reason" "text", "p_meta" "jsonb") TO "authenticated";



GRANT ALL ON FUNCTION "iapp"."mark_arrived"("p_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "iapp"."mark_no_show"("p_id" "uuid") TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."imaging_orders" TO "authenticated";



GRANT ALL ON FUNCTION "iapp"."mark_order_printed"("p_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "iapp"."mark_waiting"("p_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "iapp"."my_clinic_ids"() TO "authenticated";



GRANT ALL ON FUNCTION "iapp"."my_link_status"() TO "authenticated";



GRANT ALL ON FUNCTION "iapp"."reschedule_appointment"("p_id" "uuid", "p_new_date" "date", "p_new_time" time without time zone, "p_reason" "text", "p_new_doctor_id" "uuid", "p_new_room" "text") TO "authenticated";



GRANT ALL ON FUNCTION "iapp"."review_appointment"("p_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."block_audit_mutation"() TO "anon";
GRANT ALL ON FUNCTION "public"."block_audit_mutation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."block_audit_mutation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_patient_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_patient_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_patient_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_profile_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_profile_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_profile_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_staff"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_staff"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_staff"() TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."ai_analysis" TO "authenticated";



GRANT SELECT ON TABLE "iapp"."ai_finding_catalog" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."ai_findings" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."ai_impression" TO "authenticated";



GRANT SELECT ON TABLE "iapp"."appointment_status_history" TO "authenticated";



GRANT SELECT ON TABLE "iapp"."appointment_transitions" TO "authenticated";



GRANT SELECT ON TABLE "iapp"."audit_logs" TO "authenticated";



GRANT SELECT ON TABLE "iapp"."audit_logs_2026_08" TO "authenticated";



GRANT SELECT ON TABLE "iapp"."audit_logs_2026_09" TO "authenticated";



GRANT SELECT ON TABLE "iapp"."audit_logs_2026_10" TO "authenticated";



GRANT SELECT ON TABLE "iapp"."audit_logs_default" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."clinic_schedules" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."clinics" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."diagnoses" TO "authenticated";



GRANT SELECT,INSERT,UPDATE ON TABLE "iapp"."doctor_review" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."doctors" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."exam_findings" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."examinations" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."follow_ups" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."image_reports" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."imaging_order_items" TO "authenticated";



GRANT USAGE ON SEQUENCE "iapp"."imaging_order_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."iop_measurements" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."medications" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."notifications" TO "authenticated";



GRANT INSERT ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT("id") ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT("patient_code"),UPDATE("patient_code") ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT("full_name"),UPDATE("full_name") ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT("date_of_birth"),UPDATE("date_of_birth") ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT("age_at_registration"),UPDATE("age_at_registration") ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT("gender"),UPDATE("gender") ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT("phone"),UPDATE("phone") ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT("phone_normalized") ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT("alt_phone"),UPDATE("alt_phone") ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT("email"),UPDATE("email") ON TABLE "iapp"."patients" TO "authenticated";



GRANT UPDATE("national_id") ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT("address"),UPDATE("address") ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT("city"),UPDATE("city") ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT("occupation"),UPDATE("occupation") ON TABLE "iapp"."patients" TO "authenticated";



GRANT UPDATE("blood_type") ON TABLE "iapp"."patients" TO "authenticated";



GRANT UPDATE("allergies") ON TABLE "iapp"."patients" TO "authenticated";



GRANT UPDATE("medical_history") ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT("emergency_contact_name"),UPDATE("emergency_contact_name") ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT("emergency_contact_phone"),UPDATE("emergency_contact_phone") ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT("notes"),UPDATE("notes") ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT("primary_clinic_id"),UPDATE("primary_clinic_id") ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT("is_active"),UPDATE("is_active") ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT("created_at") ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT("updated_at") ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT("deleted_at"),UPDATE("deleted_at") ON TABLE "iapp"."patients" TO "authenticated";



GRANT UPDATE("primary_condition") ON TABLE "iapp"."patients" TO "authenticated";



GRANT UPDATE("triage_status") ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT("last_visit") ON TABLE "iapp"."patients" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."payments" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."prescription_items" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."prescriptions" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."refractions" TO "authenticated";



GRANT SELECT ON TABLE "iapp"."roles" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."services" TO "authenticated";



GRANT SELECT ON TABLE "iapp"."staff" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."surgeries" TO "authenticated";



GRANT SELECT ON TABLE "iapp"."v_active_patients" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "iapp"."visits" TO "authenticated";



GRANT SELECT ON TABLE "iapp"."v_ai_latest" TO "authenticated";



GRANT SELECT ON TABLE "iapp"."v_appointment_board" TO "authenticated";



GRANT SELECT ON TABLE "iapp"."v_exam_full" TO "authenticated";



GRANT SELECT ON TABLE "iapp"."v_my_diagnoses" TO "authenticated";



GRANT SELECT ON TABLE "iapp"."v_my_examinations" TO "authenticated";



GRANT SELECT ON TABLE "iapp"."v_my_patient" TO "authenticated";



GRANT SELECT ON TABLE "iapp"."v_my_prescriptions" TO "authenticated";



GRANT SELECT ON TABLE "iapp"."v_my_visits" TO "authenticated";



GRANT SELECT ON TABLE "iapp"."v_patient_clinical" TO "authenticated";



GRANT SELECT,INSERT ON TABLE "iapp"."visit_ratings" TO "authenticated";



GRANT ALL ON TABLE "public"."audit_log" TO "service_role";
GRANT SELECT ON TABLE "public"."audit_log" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."audit_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."audit_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."audit_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."auth_events" TO "service_role";
GRANT SELECT ON TABLE "public"."auth_events" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."auth_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."auth_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."auth_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."patient_links" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_links" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";












