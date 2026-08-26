/**
 * I APP — خدمات الوصفات والمتابعة والمواعيد
 *   svc.prescriptions · svc.followups · svc.appointments
 */
(function (global) {
  'use strict';
  var IAPP = global.IAPP, M = IAPP.models;
  function sb(){ return IAPP.client(); }

  function err(e, ctx){
    var m=(e&&e.message)||String(e||'');
    if(/permission denied|row-level security/i.test(m))
      return new Error('لا تملك صلاحية '+(ctx||'هذه العملية'));
    if(/chk_cyl_axis/i.test(m)) return new Error('لا يمكن إدخال أسطواني بلا محور');
    if(/sphere/i.test(m))   return new Error('الكروي خارج المدى (±30)');
    if(/cylinder/i.test(m)) return new Error('الأسطواني خارج المدى (±15)');
    if(/axis/i.test(m))     return new Error('المحور بين 0 و180');
    if(/ipd_mm/i.test(m))   return new Error('المسافة بين الحدقتين بين 40 و85');
    if(/add_power/i.test(m))return new Error('قوة القراءة بين 0 و+6');
    if(/JWT|not authenticated/i.test(m)) return new Error('انتهت الجلسة — سجّل الدخول مجدداً');
    return new Error(m);
  }

  // ══════════════════════════════════════════════════════
  // الوصفات — نظارة وأدوية
  // ══════════════════════════════════════════════════════
  var prescriptions = {

    /** يُرجع الوصفات مع قياساتها وبنودها جاهزة للعرض والطباعة */
    async listByPatient(pid, limit){
      var r = await sb().from('prescriptions').select('*').eq('patient_id',pid)
              .is('deleted_at',null).order('prescribed_on',{ascending:false}).limit(limit||30);
      if(r.error) throw err(r.error,'قراءة الوصفات');
      var rx = r.data||[];
      if(!rx.length) return [];
      var ids = rx.map(function(x){return x.id;});
      var rf = await sb().from('refractions').select('*').in('prescription_id',ids);
      var it = await sb().from('prescription_items').select('*').in('prescription_id',ids);
      var R = rf.error?[]:(rf.data||[]), T = it.error?[]:(it.data||[]);
      rx.forEach(function(x){
        x._od = R.filter(function(z){return z.prescription_id===x.id&&z.eye==='OD';})[0]||null;
        x._os = R.filter(function(z){return z.prescription_id===x.id&&z.eye==='OS';})[0]||null;
        x._items = T.filter(function(z){return z.prescription_id===x.id;})
                    .sort(function(a,b){return (a.sort_order||0)-(b.sort_order||0);});
      });
      return rx;
    },

    /**
     * وصفة نظارة: صف انكسار لكل عين.
     * الأسطواني يقبل الموجب والسالب — كلاهما صياغة سريرية صحيحة.
     */
    async createGlasses(data){
      var od = { sphere:data.od_sphere, cylinder:data.od_cylinder, axis:data.od_axis,
                 add_power:data.add_power, ipd_mm:data.ipd_mm };
      var os = { sphere:data.os_sphere, cylinder:data.os_cylinder, axis:data.os_axis,
                 add_power:data.add_power, ipd_mm:data.ipd_mm };
      var hasOD = M.num(od.sphere)!=null||M.num(od.cylinder)!=null;
      var hasOS = M.num(os.sphere)!=null||M.num(os.cylinder)!=null;
      if(!hasOD && !hasOS && M.num(data.add_power)==null)
        throw new Error('أدخل قياساً واحداً على الأقل');
      if(hasOD){ var v1=M.validateRefraction(od); if(!v1.ok) throw new Error('العين اليمنى: '+v1.errors[0]); }
      if(hasOS){ var v2=M.validateRefraction(os); if(!v2.ok) throw new Error('العين اليسرى: '+v2.errors[0]); }

      var date = M.isDate(data.prescribed_on) ? data.prescribed_on : M.today();
      var rx = await sb().from('prescriptions').insert({
        patient_id:data.patient_id, visit_id:data.visit_id||null,
        examination_id:data.examination_id||null, doctor_id:data.doctor_id||null,
        clinic_id:data.clinic_id||null, prescribed_on:date,
        eye:'OU', is_glasses:true, notes:M.str(data.notes)
      }).select('*').single();
      if(rx.error) throw err(rx.error,'حفظ الوصفة');

      var rows = [];
      function add(eye, r){
        if(M.num(r.sphere)==null && M.num(r.cylinder)==null && M.num(data.add_power)==null) return;
        rows.push({ patient_id:data.patient_id, prescription_id:rx.data.id,
          visit_id:data.visit_id||null, examination_id:data.examination_id||null,
          measured_on:date, refraction_type:'final', eye:eye,
          sphere:M.num(r.sphere), cylinder:M.num(r.cylinder), axis:M.int(r.axis),
          add_power:M.num(data.add_power), ipd_mm:M.num(data.ipd_mm) });
      }
      add('OD', od); add('OS', os);
      if(rows.length){
        var rr = await sb().from('refractions').insert(rows);
        if(rr.error) throw err(rr.error,'حفظ قياسات النظارة');
      }
      return rx.data;
    },

    /**
     * وصفة أدوية.
     * الدواء غير الموجود في الكتالوج يُحفظ بنصه كما كتبه الطبيب —
     * لا مطابقة تقريبية ولا تخمين في وصفة طبية.
     */
    async createDrugs(data){
      var items = (data.items||[]).filter(function(l){
        return l && M.str(l.name) && M.str(l.name).length>1; });
      if(!items.length) throw new Error('أدخل دواءً واحداً على الأقل');

      var date = M.isDate(data.prescribed_on) ? data.prescribed_on : M.today();
      var rx = await sb().from('prescriptions').insert({
        patient_id:data.patient_id, visit_id:data.visit_id||null,
        doctor_id:data.doctor_id||null, clinic_id:data.clinic_id||null,
        prescribed_on:date, is_glasses:false, eye:data.eye||null,
        notes:M.str(data.notes)
      }).select('*').single();
      if(rx.error) throw err(rx.error,'حفظ الوصفة');

      var meds = await prescriptions.medications();
      var rows = items.map(function(l, i){
        var name = M.str(l.name);
        var hit = meds.filter(function(m){ return m.name === name; })[0];
        return { prescription_id:rx.data.id,
          medication_id: hit ? hit.id : null,
          free_text: hit ? null : name,
          dose:M.str(l.dose), frequency:M.str(l.frequency),
          duration:M.str(l.duration), eye:l.eye||null,
          sort_order:i, is_parsed:!!hit };
      });
      var ir = await sb().from('prescription_items').insert(rows);
      if(ir.error) throw err(ir.error,'حفظ بنود الوصفة');
      return rx.data;
    },

    _meds: null,
    async medications(){
      if(prescriptions._meds) return prescriptions._meds;
      var r = await sb().from('medications').select('id,name,form,strength')
              .eq('is_active',true).order('name');
      prescriptions._meds = r.error ? [] : (r.data||[]);
      return prescriptions._meds;
    },

    async addMedication(name, form){
      if(!M.str(name)) throw new Error('اسم الدواء مطلوب');
      var r = await sb().from('medications')
              .insert({ name:M.str(name), form:form||'other', is_custom:true })
              .select('*').single();
      if(r.error) throw err(r.error,'إضافة دواء');
      prescriptions._meds = null;
      return r.data;
    },

    async remove(id){
      var r = await sb().from('prescriptions')
              .update({deleted_at:new Date().toISOString()}).eq('id',id);
      if(r.error) throw err(r.error,'حذف الوصفة');
      return true;
    }
  };

  // ══════════════════════════════════════════════════════
  // المتابعة
  // ══════════════════════════════════════════════════════
  var followups = {
    async listByPatient(pid){
      var r = await sb().from('follow_ups').select('*').eq('patient_id',pid)
              .is('deleted_at',null).order('due_date',{ascending:false});
      if(r.error) throw err(r.error,'قراءة المتابعات');
      return r.data||[];
    },

    /** المستحقة حتى تاريخ معيّن — افتراضياً اليوم */
    async due(untilDate, clinicId){
      var q = sb().from('follow_ups').select('*')
              .eq('status','pending').is('deleted_at',null)
              .lte('due_date', untilDate || M.today());
      if(clinicId) q = q.eq('clinic_id', clinicId);
      var r = await q.order('due_date',{ascending:true}).limit(100);
      if(r.error) throw err(r.error,'قراءة المتابعات المستحقة');
      var fu = r.data||[];
      if(!fu.length) return [];
      // نضم اسم المريض وهاتفه لتفادي استعلام ثانٍ من الشاشة
      var ids = fu.map(function(f){return f.patient_id;});
      var p = await sb().from('patients').select('id,full_name,phone,patient_code').in('id',ids);
      var P = p.error?[]:(p.data||[]);
      fu.forEach(function(f){
        var m = P.filter(function(x){return x.id===f.patient_id;})[0]||{};
        f._name = m.full_name||''; f._phone = m.phone||''; f._code = m.patient_code||'';
      });
      return fu;
    },

    async create(f){
      var chk = M.validateFollowUp(f);
      if(!chk.ok) throw new Error(chk.errors[0]);
      var r = await sb().from('follow_ups').insert({
        patient_id:f.patient_id, visit_id:f.visit_id||null,
        examination_id:f.examination_id||null, doctor_id:f.doctor_id||null,
        clinic_id:f.clinic_id||null, due_date:f.due_date,
        reason:M.str(f.reason)||'متابعة', notes:M.str(f.notes)
      }).select('*').single();
      if(r.error) throw err(r.error,'حفظ المتابعة');
      return r.data;
    },

    async setStatus(id, status){
      var patch = { status: status };
      if(status==='completed') patch.completed_at = new Date().toISOString();
      if(status==='notified')  patch.notified_at  = new Date().toISOString();
      var r = await sb().from('follow_ups').update(patch).eq('id',id);
      if(r.error) throw err(r.error,'تعديل حالة المتابعة');
      return true;
    },

    async countDue(clinicId){
      var q = sb().from('follow_ups').select('id',{count:'exact',head:true})
              .eq('status','pending').is('deleted_at',null).lte('due_date',M.today());
      if(clinicId) q = q.eq('clinic_id',clinicId);
      var r = await q;
      return r.error ? 0 : (r.count||0);
    }
  };

  // ══════════════════════════════════════════════════════
  // المواعيد — غلاف رفيع فوق محرك الحالات
  // ⚠️ لا كتابة مباشرة على الجدول: صلاحيات العميل SELECT فقط،
  // وكل تغيير حالة يمر عبر أفعال المحرك التي تفرض القواعد.
  // ══════════════════════════════════════════════════════
  var appointments = {
    board: function(o){ return IAPP.appointments.board(o||{}); },
    today: function(clinicId){
      return IAPP.appointments.board({ clinicId:clinicId, date:M.today() });
    },
    live: function(clinicId){
      return IAPP.appointments.board({ clinicId:clinicId, date:M.today(),
        status:['ARRIVED','WAITING','IN_CLINIC'] });
    },
    slots: function(clinicId, date, doctorId){
      return IAPP.appointments.availableSlots(clinicId, date, doctorId||null);
    },
    book:       function(o){ return IAPP.appointments.book(o); },
    confirm:    function(id){ return IAPP.appointments.confirm(id); },
    arrive:     function(id){ return IAPP.appointments.arrive(id); },
    wait:       function(id){ return IAPP.appointments.wait(id); },
    call:       function(id){ return IAPP.appointments.call(id); },
    complete:   function(id,v){ return IAPP.appointments.complete(id,v); },
    cancel:     function(id,r){ return IAPP.appointments.cancel(id,r); },
    noShow:     function(id){ return IAPP.appointments.noShow(id); },
    reschedule: function(id,o){ return IAPP.appointments.reschedule(id,o); },
    actionsFor: function(a,role){ return IAPP.appointments.actionsFor(a,role); },
    statusLabel:function(s){ return IAPP.appointments.statusLabel(s); },
    waitLabel:  function(a){ return IAPP.appointments.waitLabel(a); },
    subscribe:  function(o){ return IAPP.appointments.subscribe(o); }
  };

  // ══════════════════════════════════════════════════════
  // بيانات مرجعية مشتركة
  // ══════════════════════════════════════════════════════
  var refs = {
    _clinics:null, _doctors:null,
    async clinics(){
      if(refs._clinics) return refs._clinics;
      var r = await sb().from('clinics').select('*').eq('is_active',true).order('name_ar');
      refs._clinics = r.error?[]:(r.data||[]);
      return refs._clinics;
    },
    async doctors(){
      if(refs._doctors) return refs._doctors;
      var r = await sb().from('doctors').select('*').is('deleted_at',null).order('full_name_ar');
      refs._doctors = r.error?[]:(r.data||[]);
      return refs._doctors;
    },
    reset(){ refs._clinics=null; refs._doctors=null; prescriptions._meds=null; }
  };

  IAPP.svc = IAPP.svc || {};
  IAPP.svc.prescriptions = prescriptions;
  IAPP.svc.followups     = followups;
  IAPP.svc.appointments  = appointments;
  IAPP.svc.refs          = refs;
})(window);
