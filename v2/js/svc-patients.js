/**
 * I APP — خدمة المرضى (svc-patients.js)
 *
 * المكان الوحيد الذي يحتوي استعلامات المرضى. الشاشات تنادي هذه الدوال
 * ولا تعرف شيئاً عن Supabase ولا عن أسماء الجداول.
 *
 * ⚠️ الحقول السريرية (الحساسيات، التاريخ المرضي، الحالة، فصيلة الدم)
 * محجوبة على مستوى الأعمدة عن كل الأدوار بلا تمييز — بما فيها الطبيب.
 * لذلك تُقرأ عبر العرض v_patient_clinical الذي يعمل بصلاحيات مالكه
 * ويتحقق من is_doctor() بداخله. القراءة من جدول patients مباشرة
 * ستفشل بـ permission denied عند طلب أي عمود سريري.
 */
(function (global) {
  'use strict';
  var IAPP = global.IAPP;
  var M = IAPP.models;
  function sb(){ return IAPP.client(); }

  /** يحوّل خطأ Supabase إلى رسالة عربية مفهومة */
  function err(e, ctx){
    var m = (e && e.message) || String(e||'');
    if(/permission denied/i.test(m))  return new Error('لا تملك صلاحية '+(ctx||'هذه العملية'));
    if(/duplicate key.*patient_code/i.test(m)) return new Error('كود المريض مستخدم بالفعل');
    if(/duplicate key.*national_id/i.test(m))  return new Error('الرقم القومي مسجَّل لمريض آخر');
    if(/violates check constraint.*patient_code/i.test(m))
      return new Error('كود المريض يجب أن يكون بصيغة P-0001');
    if(/violates check constraint/i.test(m))   return new Error('قيمة غير مقبولة: '+m);
    if(/JWT|not authenticated/i.test(m))       return new Error('انتهت الجلسة — سجّل الدخول مجدداً');
    return new Error(m);
  }

  var svc = {

    /** قائمة المرضى مع بحث اختياري */
    async list(opts){
      opts = opts || {};
      var q = sb().from('v_patient_clinical').select('*');
      if(opts.search && opts.search.trim().length >= 2){
        var s = opts.search.trim();
        q = q.or('full_name.ilike.%'+s+'%,phone.ilike.%'+s+'%,patient_code.ilike.%'+s+'%');
      }
      if(opts.clinicId) q = q.eq('primary_clinic_id', opts.clinicId);
      if(!opts.includeArchived) q = q.eq('is_active', true);
      q = q.order('created_at',{ascending:false}).limit(opts.limit||60);
      var r = await q;
      if(r.error) throw err(r.error,'قراءة المرضى');
      return r.data || [];
    },

    async get(id){
      var r = await sb().from('v_patient_clinical').select('*').eq('id',id).maybeSingle();
      if(r.error) throw err(r.error,'قراءة ملف المريض');
      if(!r.data) throw new Error('المريض غير موجود');
      return r.data;
    },

    /** الكود التالي بالتسلسل — يُولَّد من آخر كود موجود */
    async nextCode(){
      var r = await sb().from('patients').select('patient_code')
              .order('patient_code',{ascending:false}).limit(1);
      var n = 1;
      if(!r.error && r.data && r.data.length){
        var m = String(r.data[0].patient_code||'').match(/(\d+)$/);
        if(m) n = parseInt(m[1],10) + 1;
      }
      return 'P-' + String(n).padStart(4,'0');
    },

    async create(p){
      var v = M.validatePatient(p);
      if(!v.ok) throw new Error(v.errors[0]);
      var row = {
        patient_code: M.str(p.patient_code) || await svc.nextCode(),
        full_name: M.str(p.full_name),
        age_at_registration: M.int(p.age_at_registration),
        date_of_birth: M.isDate(p.date_of_birth) ? p.date_of_birth : null,
        gender: p.gender || 'unknown',
        phone: M.str(p.phone), alt_phone: M.str(p.alt_phone),
        email: M.str(p.email), national_id: M.str(p.national_id),
        address: M.str(p.address), city: M.str(p.city),
        occupation: M.str(p.occupation), blood_type: M.str(p.blood_type),
        allergies: M.str(p.allergies), medical_history: M.str(p.medical_history),
        primary_condition: M.str(p.primary_condition),
        triage_status: M.str(p.triage_status),
        emergency_contact_name: M.str(p.emergency_contact_name),
        emergency_contact_phone: M.str(p.emergency_contact_phone),
        notes: M.str(p.notes), primary_clinic_id: p.primary_clinic_id || null
      };
      var r = await sb().from('patients').insert(row).select('id').single();
      if(r.error) throw err(r.error,'إضافة مريض');
      return svc.get(r.data.id);
    },

    async update(id, p){
      var v = M.validatePatient(p);
      if(!v.ok) throw new Error(v.errors[0]);
      var row = {
        full_name: M.str(p.full_name),
        age_at_registration: M.int(p.age_at_registration),
        date_of_birth: M.isDate(p.date_of_birth) ? p.date_of_birth : null,
        gender: p.gender || 'unknown',
        phone: M.str(p.phone), alt_phone: M.str(p.alt_phone),
        email: M.str(p.email), address: M.str(p.address), city: M.str(p.city),
        occupation: M.str(p.occupation), blood_type: M.str(p.blood_type),
        allergies: M.str(p.allergies), medical_history: M.str(p.medical_history),
        primary_condition: M.str(p.primary_condition),
        triage_status: M.str(p.triage_status),
        emergency_contact_name: M.str(p.emergency_contact_name),
        emergency_contact_phone: M.str(p.emergency_contact_phone),
        notes: M.str(p.notes)
      };
      if(p.patient_code) row.patient_code = M.str(p.patient_code);
      var r = await sb().from('patients').update(row).eq('id',id);
      if(r.error) throw err(r.error,'تعديل بيانات المريض');
      return svc.get(id);
    },

    /**
     * أرشفة لا حذف. السجل الطبي لا يُمحى:
     * is_active=false يخفيه من القوائم، وسجله السريري يبقى كاملاً.
     */
    async archive(id){
      var r = await sb().from('patients').update({is_active:false}).eq('id',id);
      if(r.error) throw err(r.error,'أرشفة المريض');
      return true;
    },

    async unarchive(id){
      var r = await sb().from('patients').update({is_active:true}).eq('id',id);
      if(r.error) throw err(r.error,'استعادة المريض');
      return true;
    },

    async count(){
      var r = await sb().from('patients').select('id',{count:'exact',head:true})
              .eq('is_active',true);
      return r.error ? 0 : (r.count||0);
    }
  };

  IAPP.svc = IAPP.svc || {};
  IAPP.svc.patients = svc;
})(window);
