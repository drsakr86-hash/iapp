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
    if(/chk_finding_field_section/i.test(m))
      return new Error('حقل فحص لا ينتمي لقطاعه — راجع النموذج');
    if(/uq_exam_findings_slot/i.test(m))
      return new Error('هذا الحقل مسجَّل مرتين لنفس العين في نفس الفحص');
    if(/chk_surgery_date/i.test(m))
      return new Error('عملية أُجريت بلا تاريخ — أدخل التاريخ أو اجعلها مخطَّطة');
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
  // موجودات القطاعين — المرحلة 9
  // ══════════════════════════════════════════════════════
  // الموجود صف لكل (فحص، عين، حقل). هذا ما يجعل «قارن القرنية بين
  // الزيارتين» استعلاماً، بدل تحليل فقرة نصّية كتبها الطبيب على عجل.
  var findings = {
    async byExam(examId){
      var r = await sb().from('exam_findings').select('*')
              .eq('examination_id',examId).is('deleted_at',null);
      if(r.error) throw err(r.error,'قراءة موجودات الفحص');
      return r.data||[];
    },

    async byExams(ids){
      if(!ids || !ids.length) return [];
      var r = await sb().from('exam_findings').select('*')
              .in('examination_id',ids).is('deleted_at',null);
      if(r.error) throw err(r.error,'قراءة الموجودات');
      return r.data||[];
    },

    /** map['OD']['cornea'] — الشكل الذي يقرأه النموذج والمقارنة مباشرة */
    toMap(rows){
      var m = { OD:{}, OS:{}, OU:{} };
      (rows||[]).forEach(function(f){ if(m[f.eye]) m[f.eye][f.field]=f.value; });
      return m;
    },

    /**
     * يستبدل موجودات فحص بالكامل. الحذف ناعم لا صلب: تصحيح الطبيب
     * لموجود سابق حدث سريري يستحق أثراً، لا سطراً يختفي بلا خبر.
     * يُعيد نصّ تحذير عند الفشل، ولا يرمي — الفحص نفسه محفوظ.
     */
    async replace(examId, patientId, list){
      if(!list) return null;
      var rows = [];
      for(var i=0;i<list.length;i++){
        var f = list[i];
        var val = M.str(f.value);
        if(val==null) continue;
        var chk = M.validateFinding(f);
        if(!chk.ok) return 'موجودات لم تُحفظ: '+chk.errors[0];
        rows.push({ examination_id:examId, patient_id:patientId, eye:f.eye,
                    section:M.FIELD_SECTION[f.field], field:f.field,
                    value:val, is_normal:(f.is_normal==null?null:!!f.is_normal) });
      }
      var d = await sb().from('exam_findings')
              .update({deleted_at:new Date().toISOString()})
              .eq('examination_id',examId).is('deleted_at',null);
      if(d.error) return 'تعذّر تحديث الموجودات السابقة: '+d.error.message;
      if(!rows.length) return null;
      var r = await sb().from('exam_findings').insert(rows);
      if(r.error) return 'الموجودات لم تُحفظ: '+r.error.message;
      return null;
    },

    /** قيمة حقل واحد عبر كل زيارات المريض — أساس تتبّع C/D مثلاً */
    async timeline(pid, field, eye, limit){
      var q = sb().from('exam_findings')
              .select('value,eye,created_at,examination_id')
              .eq('patient_id',pid).eq('field',field).is('deleted_at',null);
      if(eye) q = q.eq('eye',eye);
      var r = await q.order('created_at',{ascending:false}).limit(limit||24);
      if(r.error) throw err(r.error,'قراءة تطوّر الموجود');
      return r.data||[];
    }
  };

  /**
   * الانكسار المقاس أثناء الفحص. لا جدول جديد له: refractions موجود
   * ومستعمَل من نموذج النظارة، وازدواج المصدر أسوأ من الحقل الناقص.
   */
  async function saveExamRefraction(examId, data){
    var rows = [];
    [['od','OD'],['os','OS']].forEach(function(p){
      var k = p[0];
      var has = ['sph','cyl','axis','add'].some(function(x){
        var v = data['ref_'+k+'_'+x]; return v!=null && v!=='';
      });
      if(!has) return;
      rows.push({ patient_id:data.patient_id, examination_id:examId,
        visit_id:data.visit_id||null, eye:p[1],
        measured_on:data.exam_date, refraction_type:data.refraction_type||'final',
        sphere:M.num(data['ref_'+k+'_sph']), cylinder:M.num(data['ref_'+k+'_cyl']),
        axis:M.int(data['ref_'+k+'_axis']), add_power:M.num(data['ref_'+k+'_add']) });
    });
    if(!rows.length) return null;
    for(var i=0;i<rows.length;i++){
      var chk = M.validateRefraction(rows[i]);
      if(!chk.ok) return 'الانكسار لم يُحفظ: '+chk.errors[0];
    }
    var r = await sb().from('refractions').insert(rows);
    if(r.error) return 'الانكسار لم يُحفظ: '+r.error.message;
    return null;
  }

  // ══════════════════════════════════════════════════════
  // التاريخ الجراحي — المرحلة 9
  // ══════════════════════════════════════════════════════
  var surgeries = {
    async listByPatient(pid, limit){
      var r = await sb().from('surgeries').select('*').eq('patient_id',pid)
              .is('deleted_at',null)
              .order('performed_on',{ascending:false, nullsFirst:true})
              .limit(limit||40);
      if(r.error) throw err(r.error,'قراءة التاريخ الجراحي');
      return r.data||[];
    },

    async create(s){
      var chk = M.validateSurgery(s);
      if(!chk.ok) throw new Error(chk.errors[0]);
      var r = await sb().from('surgeries').insert({
        patient_id:s.patient_id, visit_id:s.visit_id||null,
        examination_id:s.examination_id||null, clinic_id:s.clinic_id||null,
        doctor_id:s.doctor_id||null, eye:s.eye,
        procedure_name:M.str(s.procedure_name), procedure_code:M.str(s.procedure_code),
        performed_on:s.performed_on||null,
        is_planned:!!s.is_planned, is_external:!!s.is_external,
        surgeon_name:M.str(s.surgeon_name), anesthesia:M.str(s.anesthesia),
        outcome:M.str(s.outcome), complications:M.str(s.complications),
        notes:M.str(s.notes)
      }).select('*').single();
      if(r.error) throw err(r.error,'حفظ العملية');
      return r.data;
    },

    async update(id, s){
      var chk = M.validateSurgery(s);
      if(!chk.ok) throw new Error(chk.errors[0]);
      var r = await sb().from('surgeries').update({
        eye:s.eye, procedure_name:M.str(s.procedure_name),
        procedure_code:M.str(s.procedure_code), performed_on:s.performed_on||null,
        is_planned:!!s.is_planned, is_external:!!s.is_external,
        surgeon_name:M.str(s.surgeon_name), anesthesia:M.str(s.anesthesia),
        outcome:M.str(s.outcome), complications:M.str(s.complications),
        notes:M.str(s.notes)
      }).eq('id',id).select('*').single();
      if(r.error) throw err(r.error,'تعديل العملية');
      return r.data;
    },

    async remove(id){
      var r = await sb().from('surgeries')
              .update({deleted_at:new Date().toISOString()}).eq('id',id);
      if(r.error) throw err(r.error,'حذف العملية');
      return true;
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
        va_right_corrected: M.str(data.va_right_corrected),
        va_left_corrected:  M.str(data.va_left_corrected),
        va_right_ph: M.str(data.va_right_ph), va_left_ph: M.str(data.va_left_ph),
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
        var row = { patient_id:data.patient_id, examination_id:ex.data.id,
                    visit_id:data.visit_id||null, eye:p[1], value_mmhg:val };
        // الطريقة والوقت جزء من القياس لا زينة: قراءتان بجهازين لا تُقارنان
        if(M.str(data.iop_method)) row.method = M.str(data.iop_method);
        if(data.iop_at) row.measured_at = data.iop_at;
        iops.push(row);
      });
      if(iops.length){
        var ir = await sb().from('iop_measurements').insert(iops);
        if(ir.error) warnings.push('ضغط العين لم يُحفظ: '+ir.error.message);
      }

      // موجودات القطاعين
      var fw = await findings.replace(ex.data.id, data.patient_id, data.findings);
      if(fw) warnings.push(fw);

      // الانكسار المقاس في هذا الفحص — يُحفظ في refractions لا في نسخة ثانية
      var rw = await saveExamRefraction(ex.data.id, data);
      if(rw) warnings.push(rw);

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
        va_right_corrected: M.str(data.va_right_corrected),
        va_left_corrected:  M.str(data.va_left_corrected),
        va_right_ph: M.str(data.va_right_ph), va_left_ph: M.str(data.va_left_ph),
        color_vision: M.str(data.color_vision),
        contrast_sensitivity: M.str(data.contrast_sensitivity),
        cover_test: M.str(data.cover_test),
        anterior_segment: M.str(data.anterior_segment),
        posterior_segment: M.str(data.posterior_segment),
        treatment_plan: M.str(data.treatment_plan), notes: M.str(data.notes)
      }).eq('id',id).select('*').single();
      if(r.error) throw err(r.error,'تعديل الفحص');
      // الموجودات تُستبدل بالكامل: النموذج يرسل الصورة النهائية للفحص
      if(data.findings){
        var w = await findings.replace(id, r.data.patient_id, data.findings);
        if(w) throw new Error(w);
      }
      return r.data;
    },

    /** الفحص كاملاً: الموجودات مبوّبة بالعين جاهزة للنموذج */
    async getFull(id){
      var r = await sb().from('examinations').select('*').eq('id',id).single();
      if(r.error) throw err(r.error,'قراءة الفحص');
      var e = r.data;
      e._findings = await findings.byExam(id);
      e._map = findings.toMap(e._findings);
      var iop = await sb().from('iop_measurements').select('*')
                .eq('examination_id',id).is('deleted_at',null);
      var I = iop.error?[]:(iop.data||[]);
      e._iop_od = I.filter(function(x){return x.eye==='OD';})[0]||null;
      e._iop_os = I.filter(function(x){return x.eye==='OS';})[0]||null;
      var rf = await sb().from('refractions').select('*')
               .eq('examination_id',id).is('deleted_at',null);
      var R = rf.error?[]:(rf.data||[]);
      e._ref_od = R.filter(function(x){return x.eye==='OD';})[0]||null;
      e._ref_os = R.filter(function(x){return x.eye==='OS';})[0]||null;
      return e;
    },

    /**
     * المقارنة الطولية. تقرأ من v_exam_full — والعرض يعمل بصلاحيات المستدعي
     * (security_invoker) فلا يفتح باباً خلفياً حول RLS.
     */
    async history(pid, limit){
      var r = await sb().from('v_exam_full').select('*').eq('patient_id',pid)
              .order('exam_date',{ascending:false})
              .order('created_at',{ascending:false})
              .limit(limit||12);
      if(r.error) throw err(r.error,'قراءة سجل الفحوصات');
      var rows = r.data||[];
      if(!rows.length) return [];
      var ids = rows.map(function(x){return x.id;});
      var F = await findings.byExams(ids);
      rows.forEach(function(x){
        x._map = findings.toMap(F.filter(function(f){return f.examination_id===x.id;}));
      });
      return rows;
    },

    /** فحصان متتاليان جاهزان للمقارنة: الحالي وسابقه مباشرة */
    async comparePair(pid, currentId){
      var h = await this.history(pid, 12);
      if(!h.length) return { cur:null, prev:null, all:h };
      var i = 0;
      if(currentId){
        for(var k=0;k<h.length;k++) if(h[k].id===currentId){ i=k; break; }
      }
      return { cur:h[i]||null, prev:h[i+1]||null, all:h };
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
  IAPP.svc.findings = findings;
  IAPP.svc.surgeries = surgeries;
})(window);
