/**
 * I APP — الملف الأساسي (iapp-core.js)
 * المصادقة وإدارة الجلسة — مشترك بين التطبيقات الثلاثة.
 *
 * مضبوط على مشروعك: vkkjatrawzpmdhfloens
 *
 * ─────────────────────────────────────────────────────────────
 * ملاحظة معمارية:
 * لا يوجد Edge Function وسيط هنا. التطبيق يتحدث مع Supabase مباشرة،
 * و RLS في قاعدة البيانات هو الذي يقرر ما يراه كل دور.
 * الحماية في قاعدة البيانات لا في الواجهة — إخفاء زر ليس أمانًا.
 * ─────────────────────────────────────────────────────────────
 *
 * الاستخدام:
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.0"></script>
 *   <script src="./iapp-core.js"></script>
 *   <script src="./appointment-service.js"></script>
 */
(function (global) {
  'use strict';

  // ── إعدادات المشروع ────────────────────────────────────────
  // هذا المفتاح "العام" آمن في كود الواجهة: لا يمنح أي وصول للبيانات
  // بذاته. كل قراءة وكتابة تمر عبر RLS وتتطلب جلسة صالحة.
  var SB_URL = 'https://vkkjatrawzpmdhfloens.supabase.co';
  var SB_KEY = 'sb_publishable_3CWcmc6JnJfgO965m2yK1g_sgNZr4BY';

  var _sb = null, _session = null, _profile = null;

  // ألوان التطبيق الأصلي — نفس الهوية البصرية بلا تغيير
  var C = {
    bg: '#0A0F1E', surface: '#111827', card: '#141E30', border: '#1E2D45',
    accent: '#00C2FF', teal: '#00E5CC', gold: '#FFB830',
    text: '#E8F4FF', muted: '#6B8CAE', danger: '#FF4D6D',
    success: '#00E5B0', purple: '#A78BFA'
  };

  function client() {
    if (!_sb) {
      if (!global.supabase) throw new Error('لم يُحمَّل supabase-js');
      _sb = global.supabase.createClient(SB_URL, SB_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
        db: { schema: 'iapp' }
      });
    }
    return _sb;
  }

  // ── الجلسة ─────────────────────────────────────────────────

  async function getSession() {
    var r = await client().auth.getSession();
    _session = (r && r.data) ? r.data.session : null;
    return _session;
  }

  /**
   * الدور يُقرأ من جدول profiles في الخادم، لا من الطلب.
   * أي ادعاء دور من العميل يُتجاهل، وسحب الدور يسري فورًا.
   */
  async function getProfile(force) {
    if (_profile && !force) return _profile;
    var s = await getSession();
    if (!s) { _profile = null; return null; }

    var r = await client().schema('public')
      .from('profiles')
      .select('id, role, full_name, phone, is_active')
      .eq('id', s.user.id)
      .maybeSingle();

    if (r.error || !r.data || !r.data.is_active) { _profile = null; return null; }

    _profile = {
      userId: r.data.id,
      email: s.user.email,
      role: r.data.role,
      fullName: r.data.full_name,
      phone: r.data.phone
    };
    return _profile;
  }

  async function signIn(email, password) {
    var r = await client().auth.signInWithPassword({
      email: String(email || '').trim(),
      password: password || ''
    });
    if (r.error) {
      return { ok: false, error: translateAuthError(r.error.message) };
    }
    _session = r.data.session;
    _profile = null;
    var p = await getProfile(true);
    if (!p) {
      await signOut();
      return { ok: false, error: 'هذا الحساب غير مفعّل — راجع مدير النظام' };
    }
    return { ok: true, profile: p };
  }

  async function signOut() {
    try { await client().auth.signOut(); } catch (e) {}
    _session = null; _profile = null;
  }

  function onAuthChange(cb) {
    client().auth.onAuthStateChange(function (_e, s) {
      _session = s; _profile = null;
      if (cb) cb(s);
    });
  }

  /**
   * حارس الدخول لكل تطبيق.
   * ⚠️ هذا للتجربة فقط — ليس أمانًا. الأمان الحقيقي في RLS:
   * حتى لو تجاوز أحدهم هذا الحارس فلن يرى أي بيانات غير مصرّح بها.
   */
  async function requireRole(allowed) {
    var s = await getSession();
    if (!s) return { ok: false, reason: 'no_session' };
    var p = await getProfile();
    if (!p) return { ok: false, reason: 'no_profile' };
    if (allowed.indexOf(p.role) === -1) {
      return { ok: false, reason: 'wrong_role', profile: p };
    }
    return { ok: true, profile: p };
  }

  function translateAuthError(msg) {
    msg = String(msg || '');
    if (/Invalid login credentials/i.test(msg)) return 'البريد أو كلمة المرور غير صحيحة';
    if (/Email not confirmed/i.test(msg))       return 'الحساب غير مفعّل — راجع مدير النظام';
    if (/rate limit|too many/i.test(msg))       return 'محاولات كثيرة — انتظر قليلاً';
    if (/network|fetch/i.test(msg))             return 'تعذّر الاتصال بالخادم';
    return 'تعذّر تسجيل الدخول';
  }

  var ROLE_AR = {
    admin: 'مدير النظام', doctor: 'طبيب',
    secretary: 'سكرتارية', patient: 'مريض'
  };

  /** تاريخ اليوم بالتقويم المحلي.
   *  ليس toISOString() لأنه يعطي تاريخ UTC — وهو أمس في مصر قبل الثانية فجرًا. */
  function todayLocal() {
    var d = new Date();
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
  }

  // أنماط مشتركة — نفس تصميم التطبيق الأصلي
  function inp(ex) {
    return Object.assign({
      width: '100%', background: C.bg, border: '1px solid ' + C.border,
      borderRadius: 10, padding: '10px 12px', color: C.text, fontSize: 13,
      outline: 'none', boxSizing: 'border-box', direction: 'rtl', fontFamily: 'inherit'
    }, ex || {});
  }

  global.IAPP = Object.assign(global.IAPP || {}, {
    C: C, inp: inp, ROLE_AR: ROLE_AR, todayLocal: todayLocal,
    client: client, getSession: getSession, getProfile: getProfile,
    signIn: signIn, signOut: signOut, onAuthChange: onAuthChange,
    requireRole: requireRole,
    config: { url: SB_URL }
  });
})(window);
