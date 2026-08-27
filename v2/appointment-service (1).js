/**
 * I APP — Phase 4: Unified Appointment Service
 * ONE module. Loaded by index.html, Secretary.html and patient.html.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE RULE THIS MODULE EXISTS TO ENFORCE:
 *
 *   No application contains appointment lifecycle logic.
 *
 * There is no `if (status === 'confirmed')` branching in any app that decides
 * what may happen next. Apps call a verb — confirm(), arrive(), call() — and
 * the database's state machine accepts or rejects it. If the lifecycle changes,
 * it changes in one table (iapp.appointment_transitions) and every app follows
 * immediately, with no redeploy.
 *
 * The UI helpers at the bottom (labels, colours, actions) are PRESENTATION
 * only, and they are driven by the transitions table fetched from the server,
 * not by a hardcoded copy of the rules.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Usage:
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.0"></script>
 *   <script src="./iapp-auth.js"></script>          // Phase 1
 *   <script src="./appointment-service.js"></script>
 *
 *   const list = await IAPP.appointments.board({ date: '2026-09-01' });
 *   await IAPP.appointments.confirm(id);
 *   const stop = IAPP.appointments.subscribe({ onChange: reload });
 */
(function (global) {
  'use strict';

  var IAPP = global.IAPP || (global.IAPP = {});
  var BUILD = 'v8';   // يظهر في الواجهة لتمييز النسخة المحمّلة من المخزّنة

  // ── Canonical statuses. Mirrors iapp.appointment_status exactly. ─────────
  var STATUS = {
    REQUESTED: 'REQUESTED',
    PENDING:   'PENDING',
    CONFIRMED: 'CONFIRMED',
    ARRIVED:   'ARRIVED',
    WAITING:   'WAITING',
    IN_CLINIC: 'IN_CLINIC',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    NO_SHOW:   'NO_SHOW'
  };

  // Presentation only. Reuses the existing palette so the UI is unchanged.
  var C = {
    accent: '#4da3ff', teal: '#2dd4bf', gold: '#f5b342',
    danger: '#ff4d6a', success: '#34d399', muted: '#8b98ad'
  };

  var LABEL = {
    REQUESTED: { ar: 'طلب جديد',      color: C.gold,    icon: '🆕' },
    PENDING:   { ar: 'قيد المراجعة',  color: C.gold,    icon: '⏳' },
    CONFIRMED: { ar: 'مؤكد',          color: C.accent,  icon: '✓'  },
    ARRIVED:   { ar: 'وصل',           color: C.teal,    icon: '📍' },
    WAITING:   { ar: 'في الانتظار',   color: C.teal,    icon: '🪑' },
    IN_CLINIC: { ar: 'داخل العيادة',  color: C.success, icon: '👁' },
    COMPLETED: { ar: 'مكتمل',         color: C.muted,   icon: '✔'  },
    CANCELLED: { ar: 'ملغي',          color: C.danger,  icon: '✕'  },
    NO_SHOW:   { ar: 'لم يحضر',       color: C.danger,  icon: '⚠'  }
  };

  // Arabic messages for the errors the server raises.
  var ERRORS = {
    slot_taken:            'هذا الوقت محجوز بالفعل',
    invalid_transition:    'لا يمكن تنفيذ هذا الإجراء من الحالة الحالية',
    forbidden_transition:  'صلاحيتك لا تسمح بهذا الإجراء',
    reason_required:       'يجب إدخال سبب الإلغاء',
    past_date:             'لا يمكن الحجز في تاريخ ماضٍ',
    not_found:             'الموعد غير موجود',
    no_subject:            'أدخل اسم المريض',
    no_patient_link:       'هذا الحساب غير مرتبط بملف مريض',
    too_late:              'لا يمكن تعديل هذا الموعد الآن',
    no_identity:           'يجب تسجيل الدخول أولاً',
    // المرحلة 8: يُرفع عندما ينفّذ شخصان نفس الإجراء في نفس اللحظة.
    // الثاني يصل بعد أن حُسم الأمر، فيُخبَر بذلك بدل أن يكتب فوقه بصمت.
    already_in_state:      'نُفِّذ هذا الإجراء بالفعل — حدّث الشاشة'
  };

  function translate(err) {
    var raw = (err && (err.message || err.hint || '')) || '';
    for (var k in ERRORS) {
      if (raw.indexOf(k) !== -1) return { code: k, message: ERRORS[k], raw: raw };
    }
    return { code: 'unknown', message: 'تعذّر تنفيذ العملية', raw: raw };
  }

  function sb() {
    if (!IAPP.client) throw new Error('iapp-auth.js must be loaded first');
    return IAPP.client();
  }

  // Every write goes through an RPC. The apps never UPDATE the table —
  // they cannot, the grants forbid it.
  async function rpc(fn, args) {
    // .schema('iapp') ضروري: بدونه يبحث supabase-js في public فقط
    // فتفشل كل أفعال المواعيد بخطأ "الدالة غير موجودة".
    var res = await sb().schema('iapp').rpc(fn, args || {});
    if (res.error) {
      var t = translate(res.error);
      var e = new Error(t.message);
      e.code = t.code; e.raw = t.raw;
      throw e;
    }
    return res.data;
  }

  // ── Reads ────────────────────────────────────────────────────────────────

  /**
   * The one read used by all three apps. RLS decides what comes back:
   * the same call returns every clinic appointment for a doctor, the
   * clinic's day for a secretary, and only their own for a patient.
   */
  async function board(opts) {
    opts = opts || {};
    var q = sb().schema('iapp').from('v_appointment_board').select('*');

    if (opts.date)      q = q.eq('scheduled_date', opts.date);
    if (opts.from)      q = q.gte('scheduled_date', opts.from);
    if (opts.to)        q = q.lte('scheduled_date', opts.to);
    if (opts.clinicId)  q = q.eq('clinic_id', opts.clinicId);
    if (opts.doctorId)  q = q.eq('doctor_id', opts.doctorId);
    if (opts.patientId) q = q.eq('patient_id', opts.patientId);
    if (opts.status)    q = Array.isArray(opts.status)
                              ? q.in('status', opts.status)
                              : q.eq('status', opts.status);

    q = q.order('scheduled_date', { ascending: true })
         .order('scheduled_time', { ascending: true });
    if (opts.limit) q = q.limit(opts.limit);

    var res = await q;
    if (res.error) throw new Error(translate(res.error).message);
    return res.data || [];
  }

  /** Waiting-room board: the live states, in queue order. */
  function liveBoard(clinicId, date) {
    return board({
      clinicId: clinicId,
      date: date || todayISO(),
      status: [STATUS.ARRIVED, STATUS.WAITING, STATUS.IN_CLINIC]
    });
  }

  /** Secretary inbox: untriaged and in-progress requests. */
  function inbox(clinicId) {
    return board({ clinicId: clinicId, status: [STATUS.REQUESTED, STATUS.PENDING] });
  }

  async function history(appointmentId) {
    var res = await sb().schema('iapp')
      .from('appointment_status_history')
      .select('*').eq('appointment_id', appointmentId)
      .order('occurred_at', { ascending: true });
    if (res.error) throw new Error(translate(res.error).message);
    return res.data || [];
  }

  async function availableSlots(clinicId, date, doctorId) {
    return rpc('available_slots', {
      p_clinic_id: clinicId, p_date: date, p_doctor_id: doctorId || null
    });
  }

  // ── Writes: one verb per lifecycle step ──────────────────────────────────

  function bookAppointment(o) {
    return rpc('book_appointment', {
      p_clinic_id: o.clinicId,
      p_date: o.date,
      p_time: o.time,
      p_patient_id: o.patientId || null,
      p_doctor_id: o.doctorId || null,
      p_type: o.type || null,
      p_notes: o.notes || null,
      p_room: o.room || null,
      p_duration: o.duration || 10,   // مدة الكشف الافتراضية: 10 دقائق
      p_guest_name: o.guestName || null,
      p_guest_phone: o.guestPhone || null
    });
  }

  var review   = function (id) { return rpc('review_appointment',  { p_id: id }); };
  var confirm  = function (id) { return rpc('confirm_appointment', { p_id: id }); };
  var arrive   = function (id) { return rpc('mark_arrived',        { p_id: id }); };
  var wait     = function (id) { return rpc('mark_waiting',        { p_id: id }); };
  var callIn   = function (id) { return rpc('call_patient',        { p_id: id }); };
  var noShow   = function (id) { return rpc('mark_no_show',        { p_id: id }); };
  var complete = function (id, visitId) {
    return rpc('complete_appointment', { p_id: id, p_visit_id: visitId || null });
  };
  var cancel = function (id, reason) {
    // Fail fast client-side too: the server enforces this, but a clear
    // message beats a round trip.
    if (!reason || String(reason).trim().length < 3) {
      var e = new Error(ERRORS.reason_required); e.code = 'reason_required'; throw e;
    }
    return rpc('cancel_appointment', { p_id: id, p_reason: reason });
  };
  var reschedule = function (id, o) {
    return rpc('reschedule_appointment', {
      p_id: id, p_new_date: o.date, p_new_time: o.time,
      p_reason: o.reason || 'إعادة جدولة',
      p_new_doctor_id: o.doctorId || null,
      p_new_room: o.room || null
    });
  };

  // ── Realtime: replaces the 15s / 20s polling ─────────────────────────────
  //
  // RLS applies to the stream, so each app receives only the rows it may see.
  // Returns an unsubscribe function — call it on unmount.
  function subscribe(opts) {
    opts = opts || {};
    var filter = null;
    if (opts.clinicId)  filter = 'clinic_id=eq.'  + opts.clinicId;
    if (opts.patientId) filter = 'patient_id=eq.' + opts.patientId;

    var cfg = { event: '*', schema: 'iapp', table: 'appointments' };
    if (filter) cfg.filter = filter;

    // ⚠️ ضروري: قناة Realtime لا ترث رمز الجلسة تلقائياً إذا أُنشئ العميل
    // قبل تسجيل الدخول. وبدون الرمز يرفض RLS كل الأحداث بصمت، فتبدو
    // القناة متصلة بلا أي تحديث. نمرّر الرمز صراحةً قبل الاشتراك.
    try {
      var _c = sb();
      _c.auth.getSession().then(function (r) {
        var tok = r && r.data && r.data.session ? r.data.session.access_token : null;
        if (tok && _c.realtime && _c.realtime.setAuth) _c.realtime.setAuth(tok);
      });
    } catch (e) {}

    var ch = sb()
      .channel('iapp-appointments-' + (opts.key || Math.random().toString(36).slice(2)))
      .on('postgres_changes', cfg, function (payload) {
        var oldRow = payload.old || {};
        var newRow = payload.new || {};
        var statusChanged = oldRow.status !== newRow.status;

        if (opts.onStatusChange && statusChanged && payload.eventType === 'UPDATE') {
          opts.onStatusChange({
            id: newRow.id, from: oldRow.status, to: newRow.status, row: newRow
          });
        }
        if (opts.onChange) {
          opts.onChange({
            type: payload.eventType, row: newRow, old: oldRow,
            statusChanged: statusChanged
          });
        }
      })
      .subscribe(function (status, err) {
        // نمرّر الحالة الحقيقية (SUBSCRIBED / CHANNEL_ERROR / TIMED_OUT)
        // بدل مؤشر صامت لا يفسّر سبب الفشل.
        if (opts.onReady) opts.onReady(status, err);
        if (status !== 'SUBSCRIBED') {
          console.warn('[IAPP realtime]', status, err && err.message ? err.message : '');
        }
      });

    return function unsubscribe() { try { sb().removeChannel(ch); } catch (e) {} };
  }

  // ── Presentation helpers ─────────────────────────────────────────────────
  //
  // Which buttons to show is derived from the server's transitions table,
  // fetched once and cached. It is NOT a second copy of the rules: if the
  // server rejects a transition the UI never offered, the error still surfaces.

  var _transitions = null;
  var _transitionsError = null;

  /**
   * جدول الانتقالات هو مصدر الأزرار في التطبيقات الثلاثة.
   * ⚠️ لا نخزّن نتيجة فارغة: الفشل المؤقت كان يُخزَّن للأبد فتختفي كل
   * الأزرار بصمت بلا أي رسالة. الآن نعيد المحاولة ونُبقي سبب الفشل ظاهراً.
   */
  async function loadTransitions() {
    if (_transitions && _transitions.length) return _transitions;
    var res;
    try {
      res = await sb().schema('iapp').from('appointment_transitions').select('*');
    } catch (e) {
      _transitionsError = e.message; return [];
    }
    if (res.error) {
      _transitionsError = res.error.message;
      console.error('[IAPP] تعذّر تحميل جدول الانتقالات:', res.error.message);
      return [];
    }
    _transitionsError = null;
    _transitions = res.data || [];
    if (!_transitions.length) {
      console.warn('[IAPP] جدول الانتقالات فارغ — لن تظهر أزرار الإجراءات');
    }
    return _transitions;
  }

  function transitionsError() { return _transitionsError; }

  /** تشخيص: لماذا لا تظهر الأزرار؟ يُرجع كل ما يلزم لتحديد السبب. */
  async function diagnoseActions(appointment, role) {
    var all = await loadTransitions();
    var sample = all.length ? all[0] : null;
    var matchStatus = all.filter(function (t) { return t.from_status === appointment.status; });
    return {
      build: BUILD,
      loaded: all.length,
      error: _transitionsError,
      status: appointment.status,
      role: role,
      matchingStatus: matchStatus.length,
      rolesForStatus: matchStatus.map(function (t) { return t.to_status + ':' + JSON.stringify(t.allowed_roles); }),
      sampleType: sample ? typeof sample.allowed_roles : null
    };
  }

  var VERB = {
    PENDING:   { fn: review,   ar: 'مراجعة'   },
    CONFIRMED: { fn: confirm,  ar: 'تأكيد'    },
    ARRIVED:   { fn: arrive,   ar: 'تسجيل الوصول' },
    WAITING:   { fn: wait,     ar: 'إلى الانتظار' },
    IN_CLINIC: { fn: callIn,   ar: 'استدعاء'  },
    COMPLETED: { fn: complete, ar: 'إنهاء'    },
    CANCELLED: { fn: cancel,   ar: 'إلغاء'    },
    NO_SHOW:   { fn: noShow,   ar: 'لم يحضر'  }
  };

  /** Actions this role may take on this appointment, straight from the server. */
  async function actionsFor(appointment, role) {
    var all = await loadTransitions();
    return all
      .filter(function (t) {
        // allowed_roles قد يصل كمصفوفة أو كنص Postgres مثل {a,b,c}
        var roles = t.allowed_roles;
        if (typeof roles === 'string') {
          roles = roles.replace(/^[{"]+|[}"]+$/g, '').split(/["\s]*,["\s]*/);
        }
        if (!Array.isArray(roles)) roles = [];
        return t.from_status === appointment.status && roles.indexOf(role) !== -1;
      })
      .map(function (t) {
        var v = VERB[t.to_status] || {};
        return {
          to: t.to_status,
          label: v.ar || t.to_status,
          requiresReason: t.requires_reason,
          color: (LABEL[t.to_status] || {}).color,
          run: function (arg) { return v.fn ? v.fn(appointment.id, arg) : null; }
        };
      });
  }

  function statusLabel(s) {
    return LABEL[s] || { ar: s, color: C.muted, icon: '•' };
  }

  // ── The only place in the system that says what a status *means*. ────────
  // Phase 8: the three apps used to each keep their own copy of these lists.
  // A status added to the enum had to be found in five files. Now: one.
  var LIVE   = [STATUS.ARRIVED, STATUS.WAITING, STATUS.IN_CLINIC];
  var QUEUED = [STATUS.ARRIVED, STATUS.WAITING];
  var OPEN_INBOX = [STATUS.REQUESTED, STATUS.PENDING];

  function isLive(s)     { return LIVE.indexOf(s)   !== -1; }
  /** في الانتظار: وصل ولم يدخل بعد. */
  function isQueued(s)   { return QUEUED.indexOf(s) !== -1; }
  function isInClinic(s) { return s === STATUS.IN_CLINIC; }
  function isDone(s)     { return s === STATUS.COMPLETED; }
  function isOpen(s) {
    return s !== STATUS.COMPLETED && s !== STATUS.CANCELLED && s !== STATUS.NO_SHOW;
  }

  /** Local calendar date. NOT toISOString(), which returns the UTC day and is
   *  the previous date in Egypt before ~02:00 local. */
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
  }

  function waitLabel(a) {
    if (a.wait_minutes == null) return null;
    var m = a.wait_minutes;
    if (m < 60) return m + ' دقيقة';
    return Math.floor(m / 60) + ' ساعة ' + (m % 60) + ' دقيقة';
  }

  IAPP.appointments = {
    STATUS: STATUS,
    // reads
    board: board, liveBoard: liveBoard, inbox: inbox,
    history: history, availableSlots: availableSlots,
    // writes
    book: bookAppointment, review: review, confirm: confirm,
    arrive: arrive, wait: wait, call: callIn, complete: complete,
    cancel: cancel, noShow: noShow, reschedule: reschedule,
    // realtime
    subscribe: subscribe,
    // presentation
    actionsFor: actionsFor, statusLabel: statusLabel,
    transitionsError: transitionsError,
    diagnoseActions: diagnoseActions,
    build: BUILD,
    isLive: isLive, isQueued: isQueued, isInClinic: isInClinic, isDone: isDone,
    isOpen: isOpen, waitLabel: waitLabel, todayISO: todayISO,
    LIVE: LIVE, QUEUED: QUEUED, OPEN_INBOX: OPEN_INBOX,
    translateError: translate
  };
})(window);
