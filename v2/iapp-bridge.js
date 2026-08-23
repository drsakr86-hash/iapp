/**
 * I APP — الطبقة الوسيطة (iapp-bridge.js)
 *
 * الغرض: تشغيل واجهة التطبيق القديمة كما هي — بكل شاشاتها ونماذجها
 * وقوائمها المنسدلة وطباعتها — فوق قاعدة البيانات الجديدة.
 *
 * الواجهة القديمة تتعامل مع "مفاتيح" ومصفوفات JSON:
 *     sbGet("iapp_patients")  →  [ {id, name, age, ...}, ... ]
 *     sbSet("iapp_patients", arr)
 *
 * هذا الملف يوفّر نفس الدالتين بنفس التوقيع بالضبط، لكنه يقرأ ويكتب
 * في الجداول العلائقية الجديدة ويترجم أسماء الحقول في الاتجاهين.
 *
 * النتيجة: لا سطر واحد يتغيّر في أي شاشة أو نموذج.
 *
 * ⚠️ ملاحظة معمارية: هذه طبقة توافق مؤقتة الغرض منها عدم إعادة بناء
 * واجهة مجرَّبة وناجحة. الشاشات الجديدة يُفضَّل أن تستدعي الجداول مباشرة.
 */
(function (global) {
  'use strict';

  var IAPP = global.IAPP || (global.IAPP = {});
  var BRIDGE_VERSION = 'B1';

  function sb(){ return IAPP.client(); }
  function role(){ return (IAPP._profile && IAPP._profile.role) || 'doctor'; }

  // ── أدوات ترجمة ──────────────────────────────────────────
  var G_TO_NEW = { 'ذكر':'male', 'أنثى':'female', 'انثى':'female' };
  var G_TO_OLD = { male:'ذكر', female:'أنثى', other:'', unknown:'' };

  var VT_TO_NEW = { 'فحص روتيني':'routine','متابعة':'follow_up','فحص شبكية':'retina',
    'قياس نظر':'refraction','استشارة':'consultation','عملية':'surgery','طوارئ':'emergency' };
  var VT_TO_OLD = { routine:'فحص روتيني', follow_up:'متابعة', retina:'فحص شبكية',
    refraction:'قياس نظر', consultation:'استشارة', surgery:'عملية',
    emergency:'طوارئ', other:'أخرى' };

  var EYE_TO_NEW = { 'كلتا العينين':'OU','اليمنى':'OD','اليسرى':'OS',
    'العين اليمنى':'OD','العين اليسرى':'OS' };
  var EYE_TO_OLD = { OU:'كلتا العينين', OD:'اليمنى', OS:'اليسرى' };

  function n(v){ if(v===''||v===null||v===undefined) return null;
    var x=parseFloat(v); return isNaN(x)?null:x; }
  function i(v){ if(v===''||v===null||v===undefined) return null;
    var x=parseInt(v,10); return isNaN(x)?null:x; }
  function s(v){ var t=(v===null||v===undefined)?'':String(v).trim(); return t===''?null:t; }
  function today(){ return IAPP.todayLocal(); }

  /** "زوجته - 0501234568" → { name, phone } */
  function splitContact(v){
    var t=String(v||'');
    if(!t) return {name:null, phone:null};
    var digits=(t.match(/[0-9][0-9\s-]{5,}/)||[''])[0].replace(/[^0-9]/g,'');
    var name=t.replace(/[-–]?\s*[0-9][0-9\s-]{5,}/,'').replace(/[-–]\s*$/,'').trim();
    return { name:name||null, phone:digits||null };
  }
  function joinContact(nm, ph){
    if(!nm && !ph) return '';
    return nm && ph ? nm+' - '+ph : (nm||ph);
  }

  // ── حالة الموعد: تسع حالات ↔ حقلَي القديم ────────────────
  function statusToOld(st){
    return {
      confirmed: ['CONFIRMED','ARRIVED','WAITING','IN_CLINIC','COMPLETED'].indexOf(st)>-1,
      waitStatus: st==='WAITING' ? 'waiting'
                : st==='IN_CLINIC' ? 'in'
                : st==='COMPLETED' ? 'done'
                : st==='ARRIVED' ? 'waiting' : '',
      fromPatient: false,
      _status: st
    };
  }

  // ════════════════════════════════════════════════════════
  // القراءة
  // ════════════════════════════════════════════════════════

  var READERS = {

    iapp_patients: async function(){
      // الطبيب يقرأ الحقول السريرية عبر العرض المخصص، لأن حجب الأعمدة
      // على جدول patients يطبَّق على كل الأدوار بلا تمييز.
      var r = await sb().from('v_patient_clinical').select('*')
              .order('created_at',{ascending:false});
      if(r.error){
        // احتياط: قراءة الأعمدة غير السريرية فقط
        r = await sb().from('patients')
             .select('id,patient_code,full_name,age_at_registration,gender,phone,address,occupation,primary_clinic_id')
             .order('created_at',{ascending:false});
        if(r.error) return undefined;
      }
      return (r.data||[]).map(function(p){
        var ec = joinContact(p.emergency_contact_name, p.emergency_contact_phone);
        return {
          id: p.id,
          patientCode: p.patient_code || '',
          name: p.full_name || '',
          age: p.age_at_registration || '',
          phone: p.phone || '',
          lastVisit: p.last_visit || '',
          condition: p.primary_condition || '',
          status: p.triage_status || '',
          gender: G_TO_OLD[p.gender] || '',
          bloodType: p.blood_type || '',
          address: p.address || '',
          history: p.medical_history || '',
          allergies: p.allergies || '',
          occupation: p.occupation || '',
          emergencyContact: ec
        };
      });
    },

    iapp_visits: async function(){
      var r = await sb().from('visits').select('*').order('visit_date',{ascending:false});
      if(r.error) return undefined;
      var pay = await sb().from('payments').select('visit_id,amount,amount_paid,status');
      var fu  = await sb().from('follow_ups').select('visit_id,due_date');
      var docs= await sb().from('doctors').select('id,short_name,full_name_ar');
      var P=(pay.data||[]), F=(fu.data||[]), D=(docs.data||[]);
      return (r.data||[]).map(function(v){
        var p=P.filter(function(x){return x.visit_id===v.id;})[0]||{};
        var f=F.filter(function(x){return x.visit_id===v.id;})[0]||{};
        var d=D.filter(function(x){return x.id===v.doctor_id;})[0]||{};
        return {
          id: v.id, patientId: v.patient_id, date: v.visit_date||'',
          type: VT_TO_OLD[v.visit_type]||'أخرى',
          doctor: d.short_name||d.full_name_ar||'',
          complaint: v.chief_complaint||'', result: v.summary||'',
          cost: p.amount!=null?String(p.amount):'',
          paid: p.status==='paid',
          nextVisit: f.due_date||'', notes: v.notes||'', rated:false
        };
      });
    },

    iapp_exams: async function(){
      var r = await sb().from('examinations').select('*').order('exam_date',{ascending:false});
      if(r.error) return undefined;
      var iop = await sb().from('iop_measurements').select('examination_id,eye,value_mmhg');
      var dx  = await sb().from('diagnoses').select('examination_id,diagnosis_text');
      var fu  = await sb().from('follow_ups').select('examination_id,due_date');
      var docs= await sb().from('doctors').select('id,short_name,full_name_ar');
      var I=(iop.data||[]), X=(dx.data||[]), F=(fu.data||[]), D=(docs.data||[]);
      return (r.data||[]).map(function(e){
        var od=I.filter(function(x){return x.examination_id===e.id&&x.eye==='OD';})[0]||{};
        var os=I.filter(function(x){return x.examination_id===e.id&&x.eye==='OS';})[0]||{};
        var g =X.filter(function(x){return x.examination_id===e.id;})[0]||{};
        var f =F.filter(function(x){return x.examination_id===e.id;})[0]||{};
        var d =D.filter(function(x){return x.id===e.doctor_id;})[0]||{};
        return {
          id:e.id, patientId:e.patient_id, date:e.exam_date||'',
          doctor:d.short_name||d.full_name_ar||'',
          chiefComplaint:e.chief_complaint||'',
          visualAcuityR:e.va_right||'', visualAcuityL:e.va_left||'',
          iopR:od.value_mmhg!=null?String(od.value_mmhg):'',
          iopL:os.value_mmhg!=null?String(os.value_mmhg):'',
          colorVision:e.color_vision||'', contrast:e.contrast_sensitivity||'',
          coverTest:e.cover_test||'',
          anteriorSegment:e.anterior_segment||'', posteriorSegment:e.posterior_segment||'',
          diagnosis:g.diagnosis_text||'', treatmentPlan:e.treatment_plan||'',
          followUp:f.due_date||'', notes:e.notes||''
        };
      });
    },

    iapp_prescriptions: async function(){
      var r = await sb().from('prescriptions').select('*').order('prescribed_on',{ascending:false});
      if(r.error) return undefined;
      var rf = await sb().from('refractions').select('*');
      var it = await sb().from('prescription_items').select('*');
      var pt = await sb().from('patients').select('id,full_name');
      var R=(rf.data||[]), T=(it.data||[]), PT=(pt.data||[]);
      return (r.data||[]).map(function(x){
        var od=R.filter(function(z){return z.prescription_id===x.id&&z.eye==='OD';})[0]||{};
        var os=R.filter(function(z){return z.prescription_id===x.id&&z.eye==='OS';})[0]||{};
        var meds=T.filter(function(z){return z.prescription_id===x.id;})
          .sort(function(a,b){return (a.sort_order||0)-(b.sort_order||0);})
          .map(function(z){
            return [z.free_text||'', z.dose||'', z.frequency||'', z.duration||'']
              .filter(Boolean).join(' - ');
          }).join('\n');
        var p=PT.filter(function(z){return z.id===x.patient_id;})[0]||{};
        var f=function(v){ return v==null?'':String(v); };
        return {
          id:x.id, patientId:x.patient_id, patient:p.full_name||'',
          date:x.prescribed_on||'', eye:EYE_TO_OLD[x.eye]||'كلتا العينين',
          sphR:f(od.sphere), cylR:f(od.cylinder), axisR:f(od.axis),
          sphL:f(os.sphere), cylL:f(os.cylinder), axisL:f(os.axis),
          add:f(od.add_power||os.add_power), ipd:f(od.ipd_mm||os.ipd_mm),
          medicines:meds||x.legacy_medicines_text||'', notes:x.notes||''
        };
      });
    },

    iapp_appointments: async function(){
      var r = await sb().from('v_appointment_board').select('*')
              .order('scheduled_date',{ascending:false});
      if(r.error) return undefined;
      return (r.data||[]).map(function(a){
        var o=statusToOld(a.status);
        return {
          id:a.id, patientId:a.patient_id, patient:a.display_name||'',
          phone:a.display_phone||'', date:a.scheduled_date||'',
          time:(a.scheduled_time||'').slice(0,5),
          type:a.appointment_type||'', doctor:a.doctor_short||a.doctor_name||'',
          room:a.room||'', clinic:a.clinic_name||'',
          confirmed:o.confirmed, waitStatus:o.waitStatus,
          fromPatient:(a.source==='patient_portal'||a.source==='guest'),
          _status:a.status, _clinicId:a.clinic_id, _doctorId:a.doctor_id
        };
      });
    },

    iapp_doctors: async function(){
      var r = await sb().from('doctors').select('*').order('full_name_ar');
      if(r.error) return undefined;
      return (r.data||[]).map(function(d){
        return { id:d.id, name:d.full_name_ar||'', short:d.short_name||d.full_name_ar||'',
                 title:d.title_ar||'', initial:d.initial||'', isPrimary:!!d.is_primary };
      });
    },

    iapp_prices: async function(){
      var r = await sb().from('services').select('*')
              .neq('category','imaging').order('name_ar');
      if(r.error) return undefined;
      return (r.data||[]).map(function(x){
        return { id:x.id, name:x.name_ar||'', price:String(x.default_price||0), icon:x.icon||'💠' };
      });
    },

    iapp_custom_tests: async function(){
      var r = await sb().from('services').select('*')
              .eq('category','imaging').order('name_ar');
      if(r.error) return undefined;
      return (r.data||[]).map(function(x){
        return { id:x.code||x.id, name:x.name_en||x.name_ar||'', name_ar:x.name_ar||'' };
      });
    },

    iapp_clinic: async function(){
      var r = await sb().from('clinics').select('*').eq('is_active',true).order('name_ar');
      if(r.error) return undefined;
      var c=(r.data||[]);
      return {
        address: c.map(function(x){return x.name_ar+' - '+(x.address||'');}).join(' | '),
        phone:   c.map(function(x){return x.name_ar+': '+(x.phone||'');}).join(' | '),
        _list:   c
      };
    }
  };

  // ════════════════════════════════════════════════════════
  // الكتابة — تُقارن بالحالة الحالية وتكتب الفرق فقط
  // ════════════════════════════════════════════════════════

  var CACHE = {};

  function diff(oldArr, newArr){
    var byId={}, res={added:[], changed:[], removed:[]};
    (oldArr||[]).forEach(function(x){ byId[x.id]=x; });
    (newArr||[]).forEach(function(x){
      if(!byId[x.id]) res.added.push(x);
      else if(JSON.stringify(byId[x.id])!==JSON.stringify(x)) res.changed.push(x);
      delete byId[x.id];
    });
    for(var k in byId) res.removed.push(byId[k]);
    return res;
  }

  var WRITERS = {

    iapp_patients: async function(arr){
      var d=diff(CACHE.iapp_patients, arr);
      for(var k=0;k<d.added.length;k++){
        var p=d.added[k], ec=splitContact(p.emergencyContact);
        var ins = await sb().from('patients').insert({
          patient_code: s(p.patientCode) || await nextCode(),
          full_name: s(p.name), age_at_registration: i(p.age),
          gender: G_TO_NEW[p.gender]||'unknown', phone: s(p.phone),
          address: s(p.address), occupation: s(p.occupation),
          blood_type: s(p.bloodType), allergies: s(p.allergies),
          medical_history: s(p.history),
          emergency_contact_name: ec.name, emergency_contact_phone: ec.phone
        }).select('id').single();
        if(ins.error) throw new Error('حفظ المريض: '+ins.error.message);
        p.id = ins.data.id;   // نعيد المعرف الحقيقي للواجهة
      }
      for(var j=0;j<d.changed.length;j++){
        var c=d.changed[j], ec2=splitContact(c.emergencyContact);
        var up = await sb().from('patients').update({
          patient_code: s(c.patientCode), full_name: s(c.name),
          age_at_registration: i(c.age), gender: G_TO_NEW[c.gender]||'unknown',
          phone: s(c.phone), address: s(c.address), occupation: s(c.occupation),
          blood_type: s(c.bloodType), allergies: s(c.allergies),
          medical_history: s(c.history),
          emergency_contact_name: ec2.name, emergency_contact_phone: ec2.phone
        }).eq('id', c.id);
        if(up.error) throw new Error('تعديل المريض: '+up.error.message);
      }
      for(var m=0;m<d.removed.length;m++){
        // حذف ناعم: السجل الطبي لا يُمحى نهائياً
        await sb().from('patients').update({deleted_at:new Date().toISOString()})
              .eq('id', d.removed[m].id);
      }
      return true;
    },

    iapp_visits: async function(arr){
      var d=diff(CACHE.iapp_visits, arr);
      for(var k=0;k<d.added.length;k++){
        var v=d.added[k];
        var ins = await sb().from('visits').insert({
          patient_id: v.patientId, visit_date: v.date||today(),
          visit_type: VT_TO_NEW[v.type]||'other',
          chief_complaint: s(v.complaint), summary: s(v.result), notes: s(v.notes),
          doctor_id: await doctorId(v.doctor)
        }).select('id').single();
        if(ins.error) throw new Error('حفظ الزيارة: '+ins.error.message);
        v.id = ins.data.id;
        if(n(v.cost)!=null){
          await sb().from('payments').insert({
            patient_id:v.patientId, visit_id:ins.data.id, amount:n(v.cost),
            amount_paid: v.paid?n(v.cost):0, status: v.paid?'paid':'unpaid'
          });
        }
        if(s(v.nextVisit)){
          await sb().from('follow_ups').insert({
            patient_id:v.patientId, visit_id:ins.data.id,
            due_date:v.nextVisit, reason:'متابعة'
          });
        }
      }
      for(var j=0;j<d.changed.length;j++){
        var c=d.changed[j];
        await sb().from('visits').update({
          visit_date:c.date||today(), visit_type:VT_TO_NEW[c.type]||'other',
          chief_complaint:s(c.complaint), summary:s(c.result), notes:s(c.notes)
        }).eq('id', c.id);
      }
      for(var m=0;m<d.removed.length;m++)
        await sb().from('visits').delete().eq('id', d.removed[m].id);
      return true;
    },

    iapp_exams: async function(arr){
      var d=diff(CACHE.iapp_exams, arr);
      for(var k=0;k<d.added.length;k++){
        var e=d.added[k];
        var ins = await sb().from('examinations').insert({
          patient_id:e.patientId, exam_date:e.date||today(),
          doctor_id: await doctorId(e.doctor),
          chief_complaint:s(e.chiefComplaint),
          va_right:s(e.visualAcuityR), va_left:s(e.visualAcuityL),
          color_vision:s(e.colorVision), contrast_sensitivity:s(e.contrast),
          cover_test:s(e.coverTest),
          anterior_segment:s(e.anteriorSegment), posterior_segment:s(e.posteriorSegment),
          treatment_plan:s(e.treatmentPlan), notes:s(e.notes)
        }).select('id').single();
        if(ins.error) throw new Error('حفظ الفحص: '+ins.error.message);
        e.id = ins.data.id;

        var iops=[];
        // القيم خارج المدى تُتجاهل بدل إفشال الحفظ كاملاً
        if(n(e.iopR)!=null && n(e.iopR)>=0 && n(e.iopR)<=80)
          iops.push({patient_id:e.patientId, examination_id:ins.data.id, eye:'OD', value_mmhg:n(e.iopR)});
        if(n(e.iopL)!=null && n(e.iopL)>=0 && n(e.iopL)<=80)
          iops.push({patient_id:e.patientId, examination_id:ins.data.id, eye:'OS', value_mmhg:n(e.iopL)});
        if(iops.length) await sb().from('iop_measurements').insert(iops);

        if(s(e.diagnosis))
          await sb().from('diagnoses').insert({
            patient_id:e.patientId, examination_id:ins.data.id,
            diagnosis_text:e.diagnosis, is_primary:true, diagnosed_on:e.date||today()
          });
        if(s(e.followUp))
          await sb().from('follow_ups').insert({
            patient_id:e.patientId, examination_id:ins.data.id,
            due_date:e.followUp, reason:'متابعة بعد فحص'
          });
      }
      for(var j=0;j<d.changed.length;j++){
        var c=d.changed[j];
        await sb().from('examinations').update({
          exam_date:c.date||today(), chief_complaint:s(c.chiefComplaint),
          va_right:s(c.visualAcuityR), va_left:s(c.visualAcuityL),
          color_vision:s(c.colorVision), contrast_sensitivity:s(c.contrast),
          cover_test:s(c.coverTest),
          anterior_segment:s(c.anteriorSegment), posterior_segment:s(c.posteriorSegment),
          treatment_plan:s(c.treatmentPlan), notes:s(c.notes)
        }).eq('id', c.id);
      }
      for(var m=0;m<d.removed.length;m++)
        await sb().from('examinations').delete().eq('id', d.removed[m].id);
      return true;
    },

    iapp_prescriptions: async function(arr){
      var d=diff(CACHE.iapp_prescriptions, arr);
      for(var k=0;k<d.added.length;k++){
        var x=d.added[k];
        var glasses = !!(s(x.sphR)||s(x.sphL)||s(x.cylR)||s(x.cylL));
        var ins = await sb().from('prescriptions').insert({
          patient_id:x.patientId, prescribed_on:x.date||today(),
          eye: EYE_TO_NEW[x.eye]||'OU', is_glasses:glasses,
          notes:s(x.notes), legacy_medicines_text:s(x.medicines)
        }).select('id').single();
        if(ins.error) throw new Error('حفظ الوصفة: '+ins.error.message);
        x.id = ins.data.id;

        var rows=[];
        function addRef(eye, sp, cy, ax){
          if(n(sp)==null && n(cy)==null && n(x.add)==null) return;
          var cyl=n(cy), axis=i(ax);
          // الأسطواني بلا محور مرفوض في قاعدة البيانات — نُسقط الأسطواني
          if(cyl!=null && cyl!==0 && axis==null) cyl=null;
          rows.push({ patient_id:x.patientId, prescription_id:ins.data.id,
            measured_on:x.date||today(), refraction_type:'final', eye:eye,
            sphere:n(sp), cylinder:cyl, axis:axis,
            add_power:n(x.add), ipd_mm:n(x.ipd) });
        }
        addRef('OD', x.sphR, x.cylR, x.axisR);
        addRef('OS', x.sphL, x.cylL, x.axisL);
        if(rows.length){
          var rr = await sb().from('refractions').insert(rows);
          if(rr.error) throw new Error('قياسات النظارة: '+rr.error.message);
        }

        if(s(x.medicines)){
          var items=String(x.medicines).split('\n').filter(function(l){return l.trim();})
            .map(function(l,idx){ return { prescription_id:ins.data.id,
              free_text:l.trim(), sort_order:idx, is_parsed:false }; });
          if(items.length) await sb().from('prescription_items').insert(items);
        }
      }
      for(var m=0;m<d.removed.length;m++)
        await sb().from('prescriptions').delete().eq('id', d.removed[m].id);
      return true;
    },

    iapp_appointments: async function(arr){
      var A = IAPP.appointments;
      var d = diff(CACHE.iapp_appointments, arr);

      for(var k=0;k<d.added.length;k++){
        var a=d.added[k];
        if(!a.date) throw new Error('تاريخ الموعد مطلوب');
        var cl = await clinicId(a.clinic);
        var res = await A.book({
          clinicId: cl, date: a.date, time: (a.time||'09:00')+':00',
          patientId: a.patientId || null,
          guestName: a.patientId ? null : (a.patient||null),
          guestPhone: a.patientId ? null : (a.phone||null),
          doctorId: await doctorId(a.doctor),
          type: s(a.type), room: s(a.room)
        });
        a.id = res.id;
      }

      // تغيّر الحالة يمرّ عبر أفعال المحرك، لا بكتابة مباشرة
      for(var j=0;j<d.changed.length;j++){
        var c=d.changed[j];
        var before=(CACHE.iapp_appointments||[]).filter(function(z){return z.id===c.id;})[0]||{};
        var want = c.waitStatus==='done' ? 'COMPLETED'
                 : c.waitStatus==='in'   ? 'IN_CLINIC'
                 : c.waitStatus==='waiting' ? 'WAITING'
                 : c.confirmed ? 'CONFIRMED' : null;
        if(want && want !== before._status){
          try{
            if(want==='CONFIRMED') await A.confirm(c.id);
            else if(want==='WAITING'){
              if(before._status==='CONFIRMED') await A.arrive(c.id);
              await A.wait(c.id);
            }
            else if(want==='IN_CLINIC') await A.call(c.id);
            else if(want==='COMPLETED') await A.complete(c.id);
          }catch(e){ throw new Error(e.message); }
        }
      }

      for(var m=0;m<d.removed.length;m++){
        try{ await A.cancel(d.removed[m].id, 'حُذف من تطبيق الطبيب'); }catch(e){}
      }
      return true;
    },

    iapp_doctors: async function(arr){
      var d=diff(CACHE.iapp_doctors, arr);
      for(var k=0;k<d.added.length;k++){
        var x=d.added[k];
        var ins=await sb().from('doctors').insert({
          full_name_ar:s(x.name), short_name:s(x.short)||s(x.name),
          title_ar:s(x.title), initial:s(x.initial), is_primary:!!x.isPrimary
        }).select('id').single();
        if(ins.error) throw new Error('حفظ الطبيب: '+ins.error.message);
        x.id=ins.data.id;
      }
      for(var j=0;j<d.changed.length;j++){
        var c=d.changed[j];
        await sb().from('doctors').update({
          full_name_ar:s(c.name), short_name:s(c.short)||s(c.name),
          title_ar:s(c.title), initial:s(c.initial), is_primary:!!c.isPrimary
        }).eq('id', c.id);
      }
      for(var m=0;m<d.removed.length;m++)
        await sb().from('doctors').update({deleted_at:new Date().toISOString()})
              .eq('id', d.removed[m].id);
      return true;
    },

    iapp_prices: async function(arr){
      var d=diff(CACHE.iapp_prices, arr);
      for(var k=0;k<d.added.length;k++){
        var x=d.added[k];
        var ins=await sb().from('services').insert({
          name_ar:s(x.name), default_price:n(x.price)||0,
          icon:s(x.icon), category:'consultation'
        }).select('id').single();
        if(ins.error) throw new Error('حفظ الخدمة: '+ins.error.message);
        x.id=ins.data.id;
      }
      for(var j=0;j<d.changed.length;j++){
        var c=d.changed[j];
        await sb().from('services').update({
          name_ar:s(c.name), default_price:n(c.price)||0, icon:s(c.icon)
        }).eq('id', c.id);
      }
      for(var m=0;m<d.removed.length;m++)
        await sb().from('services').update({is_active:false}).eq('id', d.removed[m].id);
      return true;
    },

    iapp_custom_tests: async function(arr){
      var d=diff(CACHE.iapp_custom_tests, arr);
      for(var k=0;k<d.added.length;k++){
        var x=d.added[k];
        await sb().from('services').insert({
          code:s(x.id)||('t_'+Date.now()), name_en:s(x.name), name_ar:s(x.name_ar)||s(x.name),
          default_price:0, category:'imaging'
        });
      }
      return true;
    },

    iapp_clinic: async function(){ return true; }   // تُدار من الإعدادات
  };

  // ── مساعدات ──────────────────────────────────────────────
  var _docs=null, _clinics=null;
  async function doctorId(shortName){
    if(!shortName) return null;
    if(!_docs){ var r=await sb().from('doctors').select('id,short_name,full_name_ar');
                _docs=r.error?[]:(r.data||[]); }
    var d=_docs.filter(function(x){
      return x.short_name===shortName || x.full_name_ar===shortName; })[0];
    return d?d.id:null;
  }
  async function clinicId(name){
    if(!_clinics){ var r=await sb().from('clinics').select('id,name_ar,code');
                   _clinics=r.error?[]:(r.data||[]); }
    if(!name) return _clinics.length?_clinics[0].id:null;
    var c=_clinics.filter(function(x){
      return x.name_ar===name || x.code===name ||
             (x.name_ar||'').indexOf(name)>-1; })[0];
    return c ? c.id : (_clinics.length?_clinics[0].id:null);
  }
  async function nextCode(){
    var r=await sb().from('patients').select('patient_code')
          .order('patient_code',{ascending:false}).limit(1);
    var num=1;
    if(!r.error && r.data && r.data.length){
      var m=String(r.data[0].patient_code||'').match(/(\d+)$/);
      if(m) num=parseInt(m[1],10)+1;
    }
    return 'P-'+String(num).padStart(4,'0');
  }

  // ════════════════════════════════════════════════════════
  // الواجهة المتوافقة مع الكود القديم
  // ════════════════════════════════════════════════════════

  /**
   * نفس عقد sbGet القديم بالضبط:
   *   undefined → تعذّر الوصول (تبقى النسخة المحلية)
   *   null      → لا بيانات
   *   قيمة      → البيانات
   */
  async function sbGet(key){
    var fn = READERS[key];
    if(!fn){ console.warn('[bridge] مفتاح غير مدعوم:', key); return null; }
    try{
      var v = await fn();
      if(v===undefined) return undefined;
      CACHE[key] = JSON.parse(JSON.stringify(v));
      return v;
    }catch(e){
      console.error('[bridge] قراءة '+key+':', e.message);
      return undefined;
    }
  }

  async function sbSet(key, value){
    var fn = WRITERS[key];
    if(!fn){ console.warn('[bridge] كتابة غير مدعومة:', key); return false; }
    try{
      await fn(value);
      CACHE[key] = JSON.parse(JSON.stringify(value));
      return true;
    }catch(e){
      console.error('[bridge] كتابة '+key+':', e.message);
      if(global.__iappToast) global.__iappToast(e.message);
      else alert('تعذّر الحفظ: '+e.message);
      return false;
    }
  }

  IAPP.bridge = {
    version: BRIDGE_VERSION,
    sbGet: sbGet, sbSet: sbSet,
    clinicId: clinicId, doctorId: doctorId,
    resetCache: function(){ CACHE={}; _docs=null; _clinics=null; }
  };
})(window);
