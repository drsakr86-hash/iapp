/**
 * I APP — نماذج البيانات (models.js)
 *
 * مصدر واحد لتعريف شكل كل كيان وقواعد التحقق منه.
 *
 * لماذا لا TypeScript؟ لأن GitHub Pages لا يشغّل خطوة بناء. البديل هنا:
 * تعريفات JSDoc (للمحرر) + دوال تحقق تعمل وقت التشغيل — وهي أهم،
 * لأن ما يحمي البيانات فعلاً هو التحقق لا التعريف.
 *
 * ⚠️ التحقق هنا لتحسين الرسائل فقط، وليس طبقة أمان.
 * الأمان الحقيقي في قيود قاعدة البيانات و RLS، ويظل يعمل حتى لو
 * تجاوز أحدهم هذا الملف بالكامل. لذلك كل قاعدة هنا تطابق قيداً حقيقياً.
 */
(function (global) {
  'use strict';
  var M = {};

  // ══════════════════════════════════════════════════════
  // قوائم القيم — مطابقة لأنواع enum في قاعدة البيانات
  // ══════════════════════════════════════════════════════
  M.GENDER   = { male:'ذكر', female:'أنثى', other:'آخر', unknown:'غير محدد' };
  M.EYE      = { OD:'اليمنى', OS:'اليسرى', OU:'كلتا العينين' };
  M.VISIT_TYPE = {
    routine:'فحص روتيني', follow_up:'متابعة', retina:'فحص شبكية',
    refraction:'قياس نظر', consultation:'استشارة', surgery:'عملية',
    emergency:'طوارئ', other:'أخرى'
  };
  M.DX_STATUS = { active:'نشط', resolved:'شُفي', chronic:'مزمن', ruled_out:'مستبعد' };
  M.FU_STATUS = { pending:'مستحق', notified:'أُبلغ', completed:'تم', missed:'فائت', cancelled:'ملغي' };
  M.BLOOD = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

  // ══════════════════════════════════════════════════════
  // قوائم الاقتراحات — منقولة من التطبيق السابق
  // ══════════════════════════════════════════════════════
  M.COMPLAINTS = ['ضعف النظر','التهاب العين','صداع','تغيير النظارة','صعوبة في القراءة',
    'مياه بيضاء','شبورة بالعين','ألم في العين','عين حمراء','إفرازات من العين',
    'رؤية مزدوجة','وميض أو بقع سوداء'];
  M.VA = ['1.00','0.9','0.8','0.7','0.6','0.5','0.4','0.3','0.2','0.1',
    '6/6','6/9','6/12','6/18','6/24','6/36','6/60','CF','HM','PL','NPL'];
  M.COLOR_VISION = ['طبيعي','غير طبيعي'];
  M.COVER_TEST   = ['طبيعي','إيجابي'];
  M.CONTRAST     = ['طبيعي','منخفض'];
  M.ANTERIOR = ['طبيعي','القرنية شفافة','التهاب الملتحمة','تليف بالقرنية',
    'عتامة القرنية','المياه البيضاء','ضيق الحجرة الأمامية','جفاف بالعين'];
  M.POSTERIOR = ['طبيعي','القرص البصري طبيعي','الشبكية سليمة','اعتلال شبكية سكري',
    'تنكس بقعي','انفصال شبكي','نزيف بالجسم الزجاجي','تجويف القرص البصري'];
  M.DIAGNOSES = ['قصر نظر','طول نظر','استجماتيزم','قصر النظر الشيخوخي',
    'المياه البيضاء','المياه الزرقاء','التهاب الملتحمة','جفاف العين',
    'اعتلال الشبكية السكري','تنكس البقعة الصفراء','الحول','كسل العين'];
  M.PLANS = ['نظارة طبية','عدسات لاصقة','قطرات','متابعة دورية',
    'عملية المياه البيضاء','ليزك','حقن داخل العين','ليزر شبكية','تحويل لأخصائي'];
  M.DOSE = ['نقطة','نقطتان','قرص','نصف قرص','مرهم','كبسولة'];
  M.FREQ = ['مرة يومياً','مرتين يومياً','ثلاث مرات يومياً','أربع مرات يومياً',
    'كل ساعة','عند اللزوم','قبل النوم'];
  M.DURATION = ['3 أيام','أسبوع','أسبوعان','شهر','3 شهور','مستمر'];
  M.TRIAGE = ['مكتمل','متابعة','طارئ'];

  // ══════════════════════════════════════════════════════
  // أدوات
  // ══════════════════════════════════════════════════════
  M.num = function(v){ if(v===''||v==null) return null;
    var x=parseFloat(v); return isNaN(x)?null:x; };
  M.int = function(v){ if(v===''||v==null) return null;
    var x=parseInt(v,10); return isNaN(x)?null:x; };
  M.str = function(v){ var t=(v==null)?'':String(v).trim(); return t===''?null:t; };

  /** تاريخ اليوم بالتقويم المحلي — toISOString يعطي UTC وهو أمس في مصر ليلاً */
  M.today = function(){
    var d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')
           +'-'+String(d.getDate()).padStart(2,'0');
  };

  M.isDate = function(v){
    if(!v||!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    var d=new Date(v+'T00:00:00');
    if(isNaN(d.getTime())) return false;
    // يرفض 2026-02-31: Date يحوّله لـ 3 مارس، فالمقارنة تكشفه
    return v === d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')
                 +'-'+String(d.getDate()).padStart(2,'0');
  };

  /** قوة العدسة تحمل إشارتها دائماً: +1.00 و-1.00 عدستان متضادتان */
  M.diopter = function(v){
    if(v==null||v==='') return '—';
    var n=parseFloat(v); if(isNaN(n)) return '—';
    return (n>0?'+':'')+n.toFixed(2);
  };

  /** خطوات الربع ديوبتر — قيمة خارجها تعني غالباً خطأ إدخال */
  M.isQuarter = function(v){
    if(v===''||v==null) return true;
    var n=parseFloat(v); if(isNaN(n)) return false;
    return Math.abs(Math.round(n*4)-n*4) < 1e-9;
  };

  M.normPhone = function(p){
    if(!p) return null;
    var s=String(p).replace(/[^\d]/g,'');
    if(/^20\d{10}$/.test(s)) return '0'+s.slice(2);
    if(/^\d{10}$/.test(s))   return '0'+s;
    return s||null;
  };
  M.waPhone = function(p){
    var s=String(p||'').replace(/[^\d]/g,'');
    if(!s) return null;
    if(s.indexOf('20')===0) return s;
    if(s.indexOf('0')===0)  return '20'+s.slice(1);
    return '20'+s;
  };

  M.fmtDay = function(iso){
    if(!M.isDate(iso)) return iso||'';
    var days=['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    return days[new Date(iso+'T00:00:00').getDay()]+' '+iso;
  };

  // ══════════════════════════════════════════════════════
  // التحقق — كل قاعدة تطابق قيداً في قاعدة البيانات
  // ══════════════════════════════════════════════════════
  function V(){ return { ok:true, errors:[] }; }
  function bad(r,msg){ r.ok=false; r.errors.push(msg); return r; }

  /** @typedef {{full_name:string, patient_code?:string, phone?:string}} Patient */
  M.validatePatient = function(p){
    var r=V();
    if(!M.str(p.full_name) || M.str(p.full_name).length<2)
      bad(r,'اسم المريض مطلوب (حرفان على الأقل)');
    if(p.patient_code && !/^P-\d{4,8}$/.test(p.patient_code))
      bad(r,'كود المريض يجب أن يكون بصيغة P-0001');
    var age=M.int(p.age_at_registration);
    if(age!=null && (age<0||age>130)) bad(r,'العمر بين 0 و130');
    if(p.blood_type && M.BLOOD.indexOf(p.blood_type)===-1)
      bad(r,'فصيلة دم غير معروفة');
    if(p.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email))
      bad(r,'البريد الإلكتروني غير صحيح');
    if(p.date_of_birth && !M.isDate(p.date_of_birth))
      bad(r,'تاريخ الميلاد غير صحيح');
    return r;
  };

  M.validateVisit = function(v){
    var r=V();
    if(!v.patient_id) bad(r,'المريض مطلوب');
    if(!M.isDate(v.visit_date)) bad(r,'تاريخ الزيارة غير صحيح');
    if(v.visit_type && !M.VISIT_TYPE[v.visit_type]) bad(r,'نوع زيارة غير معروف');
    return r;
  };

  M.validateExam = function(e){
    var r=V();
    if(!e.patient_id) bad(r,'المريض مطلوب');
    if(!M.isDate(e.exam_date)) bad(r,'تاريخ الفحص غير صحيح');
    // حدة الإبصار نص عمداً: CF و HM و PL قيم سريرية صحيحة لا رقمية
    ['iop_right','iop_left'].forEach(function(k){
      var x=M.num(e[k]);
      if(x!=null && (x<0||x>80)) bad(r,'ضغط العين بين 0 و80 mmHg');
    });
    return r;
  };

  M.validateRefraction = function(f){
    var r=V();
    var sph=M.num(f.sphere), cyl=M.num(f.cylinder), ax=M.int(f.axis);
    if(sph!=null && Math.abs(sph)>30) bad(r,'الكروي بين ±30');
    if(cyl!=null && Math.abs(cyl)>15) bad(r,'الأسطواني بين ±15 (موجب أو سالب)');
    if(ax!=null && (ax<0||ax>180))    bad(r,'المحور بين 0 و180');
    // أسطواني بلا محور قياس عديم المعنى — والقاعدة ترفضه أصلاً
    if(cyl!=null && cyl!==0 && ax==null) bad(r,'أدخل المحور مع الأسطواني');
    if(!M.isQuarter(f.sphere))   bad(r,'الكروي بخطوات 0.25');
    if(!M.isQuarter(f.cylinder)) bad(r,'الأسطواني بخطوات 0.25');
    var add=M.num(f.add_power);
    if(add!=null && (add<0||add>6)) bad(r,'قوة القراءة بين 0 و+6');
    var ipd=M.num(f.ipd_mm);
    if(ipd!=null && (ipd<40||ipd>85)) bad(r,'المسافة بين الحدقتين بين 40 و85');
    return r;
  };

  M.validateFollowUp = function(f){
    var r=V();
    if(!f.patient_id) bad(r,'المريض مطلوب');
    if(!M.isDate(f.due_date)) bad(r,'تاريخ المتابعة غير صحيح');
    return r;
  };

  M.validateAppointment = function(a){
    var r=V();
    if(!a.clinic_id) bad(r,'العيادة مطلوبة');
    if(!M.isDate(a.scheduled_date)) bad(r,'تاريخ الموعد غير صحيح');
    if(!a.scheduled_time) bad(r,'وقت الموعد مطلوب');
    if(!a.patient_id && !M.str(a.guest_name)) bad(r,'اختر مريضاً أو أدخل اسم زائر');
    return r;
  };

  global.IAPP = global.IAPP || {};
  global.IAPP.models = M;
})(window);
