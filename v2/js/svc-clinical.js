/**
 * I APP — خدمات السجل السريري
 *   svc.visits · svc.examinations · svc.diagnoses
 *
 * ملاحظة مهمة عن الفحص: نموذج الفحص الواحد في الواجهة يُنتج عدة سجلات
 * مترابطة (فحص + ضغط عين لكل عين + تشخيص + متابعة). الخدمة تخفي هذا
 * التعقيد عن الشاشة: تستدعي دالة واحدة، والخدمة تتولى الترتيب.
 */
(function (global) {
  'use strict';
  var IAPP = global.IAPP, M = IAPP.models;
  function sb(){ return IAPP.client(); }

  function err(e, ctx){
    var m=(e&&e.message)||String(e||'');
    if(/permission denied/i.test(m)) return new Error('لا تملك صلاحية '+(ctx||'هذه العملية'));
    if(/violates row-level security/i.test(m)) return new Error('لا تملك صلاحية '+(ctx||''));
    if(/value_mmhg/i.test(m))  return new Error('ضغط العين يجب أن يكون بين 0 و80');
    if(/chk_cyl_axis/i.test(m)) return new Error('لا يمكن إدخال أسطواني بلا محور');
    if(/sphere/i.test(m))      return new Error('الكروي خارج المدى المسموح (±30)');
    if(/cylinder/i.test(m))    return new Error('الأسطواني خارج المدى المسموح (±15)');
    if(/axis/i.test(m))        return new Error('المحور يجب أن يكون بين 0 و180');
    if(/patient_mismatch/i.test(m)) return new Error('عدم تطابق: السجل يخص مريضاً آخر');
    if(/JWT|not authenticated/i.test(m)) return new Error('انتهت الجلسة — سجّل الدخول مجدداً');
    return new Error(m);
  }

  // ══════════════════════════════════════════════════════
  // الزيارات
  // ══════════════════════════════════════════════════════
  var visits = {
    async listByPatient(pid, limit){
      var r = await sb().from('visits').select('*').eq('patient_id',pid)
              .is('deleted_at',null).order('visit_date',{ascending:false})
              .limit(limit||30);
      if(r.error) throw err(r.error,'قراءة الزيارات');
      return r.data||[];
    },

    async listByDate(date, clinicId){
      var q = sb().from('visits').select('*').eq('visit_date',date).is('deleted_at',null);
      if(clinicId) q = q.eq('clinic_id',clinicId);
      var r = await q.order('created_at',{ascending:false});
      if(r.error) throw err(r.error,'قراءة زيارات اليوم');
      return r.data||[];
    },

    async create(v){
      var chk = M.validateVisit(v);
      if(!chk.ok) throw new Error(chk.errors[0]);
      var r = await sb().from('visits').insert({
        patient_id: v.patient_id, clinic_id: v.clinic_id || null,
        doctor_id: v.doctor_id || null, appointment_id: v.appointment_id || null,
        visit_date: v.visit_date, visit_type: v.visit_type || 'routine',
        chief_complaint: M.str(v.chief_complaint),
        summary: M.str(v.summary), notes: M.str(v.notes)
      }).select('*').single();
      if(r.error) throw err(r.error,'حفظ الزيارة');
      return r.data;
    },

    async update(id, v){
      var r = await sb().from('visits').update({
        visit_date: v.visit_date, visit_type: v.visit_type || 'routine',
        chief_complaint: M.str(v.chief_complaint),
        summary: M.str(v.summary), notes: M.str(v.notes)
      }).eq('id',id).select('*').single();
      if(r.error) throw err(r.error,'تعديل الزيارة');
      return r.data;
    },

    async countToday(clinicId){
      var q = sb().from('visits').select('id',{count:'exact',head:true})
              .eq('visit_date',M.today()).is('deleted_at',null);
      if(clinicId) q = q.eq('clinic_id',clinicId);
      var r = await q;
      return r.error ? 0 : (r.count||0);
    }
  };

  // ══════════════════════════════════════════════════════
  // الفحوصات — مع ضغط العين والتشخيص والمتابعة
  // ══════════════════════════════════════════════════════
  var examinations = {
    async listByPatient(pid, limit){
      var r = await sb().from('examinations').select('*').eq('patient_id',pid)
              .is('deleted_at',null).order('exam_date',{ascending:false}).limit(limit||30);
      if(r.error) throw err(r.error,'قراءة الفحوصات');
      var exams = r.data||[];
      if(!exams.length) return [];
      var ids = exams.map(function(e){return e.id;});
      var iop = await sb().from('iop_measurements').select('*').in('examination_id',ids);
      var I = iop.error ? [] : (iop.data||[]);
      // نضم ضغط العين لكل فحص حتى لا تحتاج الشاشة استعلاماً ثانياً
      exams.forEach(function(e){
        e._iop_od = I.filter(function(x){return x.examination_id===e.id&&x.eye==='OD';})[0]||null;
        e._iop_os = I.filter(function(x){return x.examination_id===e.id&&x.eye==='OS';})[0]||null;
      });
      return exams;
    },

    /**
     * يحفظ الفحص وكل ما يتبعه.
     * ⚠️ ليست معاملة ذرّية: PostgREST لا يوفّرها عبر REST. لذلك يُحفظ
     * الفحص أولاً، وأي فشل لاحق يُبلَّغ عنه صراحة مع بقاء الفحص محفوظاً،
     * بدل أن نزعم نجاحاً كاملاً أو نفقد ما حُفظ.
     */
    async createFull(data){
      var chk = M.validateExam(data);
      if(!chk.ok) throw new Error(chk.errors[0]);

      var ex = await sb().from('examinations').insert({
        patient_id: data.patient_id, visit_id: data.visit_id || null,
        doctor_id: data.doctor_id || null, exam_date: data.exam_date,
        chief_complaint: M.str(data.chief_complaint),
        va_right: M.str(data.va_right), va_left: M.str(data.va_left),
        color_vision: M.str(data.color_vision),
        contrast_sensitivity: M.str(data.contrast_sensitivity),
        cover_test: M.str(data.cover_test),
        anterior_segment: M.str(data.anterior_segment),
        posterior_segment: M.str(data.posterior_segment),
        treatment_plan: M.str(data.treatment_plan), notes: M.str(data.notes)
      }).select('*').single();
      if(ex.error) throw err(ex.error,'حفظ الفحص');

      var warnings = [];

      var iops = [];
      [['iop_right','OD'],['iop_left','OS']].forEach(function(p){
        var val = M.num(data[p[0]]);
        if(val==null) return;
        if(val<0||val>80){ warnings.push('ضغط '+(p[1]==='OD'?'اليمنى':'اليسرى')+' خارج المدى — لم يُحفظ'); return; }
        iops.push({ patient_id:data.patient_id, examination_id:ex.data.id,
                    visit_id:data.visit_id||null, eye:p[1], value_mmhg:val });
      });
      if(iops.length){
        var ir = await sb().from('iop_measurements').insert(iops);
        if(ir.error) warnings.push('ضغط العين لم يُحفظ: '+ir.error.message);
      }

      if(M.str(data.diagnosis_text)){
        var dr = await sb().from('diagnoses').insert({
          patient_id:data.patient_id, visit_id:data.visit_id||null,
          examination_id:ex.data.id, doctor_id:data.doctor_id||null,
          diagnosis_text:M.str(data.diagnosis_text), eye:data.diagnosis_eye||null,
          is_primary:true, diagnosed_on:data.exam_date
        });
        if(dr.error) warnings.push('التشخيص لم يُحفظ: '+dr.error.message);
      }

      if(M.isDate(data.follow_up_date)){
        var fr = await sb().from('follow_ups').insert({
          patient_id:data.patient_id, visit_id:data.visit_id||null,
          examination_id:ex.data.id, clinic_id:data.clinic_id||null,
          due_date:data.follow_up_date, reason:M.str(data.follow_up_reason)||'متابعة'
        });
        if(fr.error) warnings.push('المتابعة لم تُحفظ: '+fr.error.message);
      }

      return { exam: ex.data, warnings: warnings };
    },

    async update(id, data){
      var r = await sb().from('examinations').update({
        exam_date: data.exam_date, chief_complaint: M.str(data.chief_complaint),
        va_right: M.str(data.va_right), va_left: M.str(data.va_left),
        color_vision: M.str(data.color_vision),
        contrast_sensitivity: M.str(data.contrast_sensitivity),
        cover_test: M.str(data.cover_test),
        anterior_segment: M.str(data.anterior_segment),
        posterior_segment: M.str(data.posterior_segment),
        treatment_plan: M.str(data.treatment_plan), notes: M.str(data.notes)
      }).eq('id',id).select('*').single();
      if(r.error) throw err(r.error,'تعديل الفحص');
      return r.data;
    },

    /** سجل ضغط العين لتتبّع الجلوكوما */
    async iopHistory(pid, limit){
      var r = await sb().from('iop_measurements').select('*').eq('patient_id',pid)
              .is('deleted_at',null).order('measured_at',{ascending:false}).limit(limit||24);
      if(r.error) throw err(r.error,'قراءة ضغط العين');
      return r.data||[];
    }
  };

  // ══════════════════════════════════════════════════════
  // التشخيصات
  // ══════════════════════════════════════════════════════
  var diagnoses = {
    async listByPatient(pid, limit){
      var r = await sb().from('diagnoses').select('*').eq('patient_id',pid)
              .is('deleted_at',null).order('diagnosed_on',{ascending:false}).limit(limit||30);
      if(r.error) throw err(r.error,'قراءة التشخيصات');
      return r.data||[];
    },

    async create(d){
      if(!d.patient_id) throw new Error('المريض مطلوب');
      if(!M.str(d.diagnosis_text)) throw new Error('نص التشخيص مطلوب');
      var r = await sb().from('diagnoses').insert({
        patient_id:d.patient_id, visit_id:d.visit_id||null,
        examination_id:d.examination_id||null, doctor_id:d.doctor_id||null,
        diagnosis_text:M.str(d.diagnosis_text), icd10_code:M.str(d.icd10_code),
        eye:d.eye||null, status:d.status||'active',
        is_primary:!!d.is_primary, diagnosed_on:d.diagnosed_on||M.today()
      }).select('*').single();
      if(r.error) throw err(r.error,'حفظ التشخيص');
      return r.data;
    },

    async setStatus(id, status){
      var patch = { status: status };
      if(status==='resolved') patch.resolved_on = M.today();
      var r = await sb().from('diagnoses').update(patch).eq('id',id);
      if(r.error) throw err(r.error,'تعديل حالة التشخيص');
      return true;
    },

    async remove(id){
      var r = await sb().from('diagnoses')
              .update({deleted_at:new Date().toISOString()}).eq('id',id);
      if(r.error) throw err(r.error,'حذف التشخيص');
      return true;
    }
  };

  IAPP.svc = IAPP.svc || {};
  IAPP.svc.visits = visits;
  IAPP.svc.examinations = examinations;
  IAPP.svc.diagnoses = diagnoses;
})(window);
