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
  // المرحلة 9 — السجل السريري المبنيّ
  // ══════════════════════════════════════════════════════

  /** حدة الإبصار ثلاث قراءات لا واحدة: بلا تصحيح، بأفضل تصحيح، بالثقب.
   *  الثقب هو ما يفرّق بين ضعف انكساري وضعف عضوي — وبدونه القراءتان
   *  الأخريان لا تُفسَّران. */
  M.VA_KIND = { ucva:'بلا تصحيح UCVA', bcva:'بأفضل تصحيح BCVA', ph:'بالثقب PH' };

  /** رقمان بجهازين مختلفين ليسا قابلين للمقارنة، فالطريقة جزء من القياس. */
  M.IOP_METHOD = ['Goldmann','NCT (هوائي)','Tonopen','iCare','Perkins','بالإصبع'];

  /**
   * حقول القطاعين. المفتاح إنجليزي ثابت لأنه يُخزَّن في قاعدة البيانات،
   * والتسمية عربية لأنها تُعرض. القائمة اقتراح لا حصر: الحقل نصّ حرّ.
   */
  M.ANT_FIELDS = [
    ['lids','الجفون',
      ['طبيعية','تورم','احمرار','التهاب الجفن','شحاذ العين','إسدال الجفن',
       'انقلاب للخارج','انقلاب للداخل']],
    ['conjunctiva','الملتحمة',
      ['طبيعية','احتقان','التهاب','ظفرة','نزيف تحت الملتحمة','إفراز صديدي','حليمات']],
    ['cornea','القرنية',
      ['شفافة','عتامة','تليف','وذمة','ترقق','قرحة','صبغة فلوريسين إيجابية',
       'ندبة','رواسب خلف القرنية']],
    ['ac','الحجرة الأمامية',
      ['عميقة وهادئة','ضحلة','خلايا','توهج','تجمع صديدي','تجمع دموي']],
    ['iris','القزحية',
      ['طبيعية','ضمور','التصاقات خلفية','تكوّن أوعية','عيب في نقل الضوء']],
    ['pupil','الحدقة',
      ['مستديرة متفاعلة','غير منتظمة','عيب حدقي وارد RAPD','ثابتة','متوسعة','مضيّقة']],
    ['lens','العدسة',
      ['صافية','مياه بيضاء نووية','تحت المحفظة الخلفية','قشرية','ناضجة',
       'عدسة صناعية','عتامة المحفظة الخلفية']]
  ];

  M.POST_FIELDS = [
    ['vitreous','الجسم الزجاجي',
      ['صافٍ','انفصال زجاجي خلفي','عتامات','نزيف','خلايا']],
    ['disc','القرص البصري',
      ['طبيعي، الحواف واضحة','شحوب','وذمة','تجويف','حواف غير واضحة']],
    ['cd_ratio','نسبة التجويف C/D',
      ['0.1','0.2','0.3','0.4','0.5','0.6','0.7','0.8','0.9']],
    ['macula','البقعة الصفراء',
      ['المنعكس البقعي موجود','منعكس باهت','وذمة','تنكس','ثقب بقعي','دروزن','نزيف']],
    ['vessels','الأوعية',
      ['طبيعية','تضيّق شرياني','تعرّج','انضغاط شرياني وريدي','انسداد وريدي',
       'تكوّن أوعية جديدة']],
    ['periphery','الشبكية الطرفية',
      ['سليمة','تنكس شبكي','ثقب','تمزق','انفصال','أثر ليزر سابق']]
  ];

  /** كل الحقول في خريطة واحدة — تُستعمل لتسمية أي حقل قادم من القاعدة */
  M.FIELD_LABEL = {};
  M.FIELD_SECTION = {};
  M.ANT_FIELDS.forEach(function(f){ M.FIELD_LABEL[f[0]]=f[1]; M.FIELD_SECTION[f[0]]='anterior'; });
  M.POST_FIELDS.forEach(function(f){ M.FIELD_LABEL[f[0]]=f[1]; M.FIELD_SECTION[f[0]]='posterior'; });

  /** القيمة الطبيعية لكل حقل — زرّ «الكل طبيعي» يملأ منها.
   *  C/D استثناء: لا «طبيعي» فيها بل رقم، و0.3 هو الشائع. */
  M.FIELD_NORMAL = {};
  M.ANT_FIELDS.concat(M.POST_FIELDS).forEach(function(f){ M.FIELD_NORMAL[f[0]] = f[2][0]; });
  M.FIELD_NORMAL.cd_ratio = '0.3';

  M.fieldList = function(key){
    var all = M.ANT_FIELDS.concat(M.POST_FIELDS);
    for(var i=0;i<all.length;i++) if(all[i][0]===key) return all[i][2];
    return [];
  };

  M.SURGERY = ['المياه البيضاء بالفاكو + عدسة','استخراج المياه البيضاء ECCE',
    'ترشيح للمياه الزرقاء','زرع صمام للمياه الزرقاء','ليزك LASIK','PRK',
    'حقن داخل العين','استئصال الجسم الزجاجي','ليزر شبكية بانورامي',
    'كبسولوتومي YAG','عملية حول','استئصال ظفرة','زراعة قرنية',
    'تسليك القناة الدمعية','إزالة شحاذ العين'];
  M.ANESTHESIA = ['موضعي بالقطرة','حول المقلة','خلف المقلة','تحت التينون','كلي'];
  M.SURGERY_OUTCOME = ['ناجحة بلا مضاعفات','ناجحة مع تحفّظ','مضاعفات','تحتاج إعادة'];


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
  /** العمر بالسنوات من تاريخ ميلاد، أو null إن كان التاريخ غير صالح. */
  M.ageFrom = function(dob){
    if(!M.isDate(dob)) return null;
    var d=new Date(dob+'T00:00:00'), n=new Date();
    var y=n.getFullYear()-d.getFullYear();
    var m=n.getMonth()-d.getMonth();
    if(m<0 || (m===0 && n.getDate()<d.getDate())) y--;
    return y;
  };

  /**
   * يحوّل خطأ PostgreSQL إلى جملة عربية مفيدة.
   * بدونها تصل للطبيب رسائل مثل:
   *   new row for relation "patients" violates check constraint
   *   "patients_date_of_birth_check"
   * وهي صحيحة تماماً ولا تقول له ماذا يفعل.
   */
  var DB_ERRORS = {
    patients_date_of_birth_check : 'تاريخ الميلاد في المستقبل — راجع السنة',
    patients_patient_code_check  : 'كود المريض يجب أن يكون بصيغة P-0001',
    patients_patient_code_key    : 'كود المريض مستعمل لمريض آخر',
    patients_national_id_key     : 'الرقم القومي مسجَّل لمريض آخر',
    patients_full_name_check     : 'اسم المريض قصير جداً',
    patients_email_check         : 'البريد الإلكتروني غير صحيح',
    patients_blood_type_check    : 'فصيلة دم غير معروفة',
    patients_age_at_registration_check : 'العمر يجب أن يكون بين 0 و130',
    refractions_cylinder_check   : 'قوة الاسطوانة خارج المدى (±15)',
    refractions_sphere_check     : 'القوة الكروية خارج المدى (±30)',
    refractions_axis_check       : 'المحور يجب أن يكون بين 0 و180',
    refractions_ipd_mm_check     : 'المسافة بين الحدقتين خارج المدى (40–85)',
    chk_cyl_axis                 : 'أدخل المحور مع قوة الاسطوانة',
    chk_visit_date_sane          : 'تاريخ الزيارة غير منطقي',
    slot_taken                   : 'هذا الوقت محجوز بالفعل',
    already_in_state             : 'نُفِّذ هذا الإجراء بالفعل — حدّث الشاشة',
    invalid_transition           : 'هذا الانتقال غير مسموح في دورة الموعد',
    forbidden_transition         : 'دورك لا يسمح بهذا الإجراء',
    no_identity                  : 'يجب تسجيل الدخول أولاً'
  };

  M.dbError = function(err){
    var raw = (err && (err.message || err.details)) || String(err || '');
    for (var k in DB_ERRORS) if (raw.indexOf(k) !== -1) return DB_ERRORS[k];
    return raw;
  };

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
    // قاعدة البيانات ترفض تاريخ ميلاد في المستقبل، وكان التحقق هنا يفحص
    // الصيغة فقط. النتيجة: سنة مكتوبة بالخطأ في منتقي التاريخ تمرّ من
    // المتصفح ثم ترتد برسالة إنجليزية عن check constraint لا يفهمها أحد.
    else if(p.date_of_birth && p.date_of_birth > M.today())
      bad(r,'تاريخ الميلاد في المستقبل — راجع السنة');
    // العمر وتاريخ الميلاد حقلان منفصلان، وتناقضهما يفسد الحسابات لاحقاً
    if(p.date_of_birth && M.isDate(p.date_of_birth) && age!=null){
      var y=M.ageFrom(p.date_of_birth);
      if(y!=null && Math.abs(y-age)>1)
        bad(r,'العمر ('+age+') لا يطابق تاريخ الميلاد ('+y+' سنة)');
    }
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
    // الثقب لا يُحسّن ما هو أصلاً أفضل تصحيح — قراءة كهذه غالباً خطأ خانة
    if(e.findings){
      for(var i=0;i<e.findings.length;i++){
        var fc = M.validateFinding(e.findings[i]);
        if(!fc.ok){ bad(r, fc.errors[0]); break; }
      }
    }
    return r;
  };

  /**
   * المقارنة بين فحصين. تُعيد صفوفاً جاهزة للعرض بدل أن تبني الشاشة منطقها،
   * فالمقارنة قاعدة سريرية تُختبَر لا تنسيق.
   * changed=true فقط عند اختلاف قيمتين موجودتين — الغياب ليس تغيّراً.
   */
  M.compareRows = function(cur, prev, rows){
    return rows.map(function(row){
      var a = row.get(cur), b = prev ? row.get(prev) : null;
      var A = (a==null||a==='')?null:String(a), B = (b==null||b==='')?null:String(b);
      return { key:row.key, label:row.label, cur:A, prev:B,
               changed: !!(A!=null && B!=null && A!==B),
               isNew:   !!(A!=null && B==null && prev) };
    });
  };

  /** ارتفاع ضغط العين فوق 21 علامة يجب ألّا تُدفن وسط بقية الأرقام */
  M.iopHigh = function(v){ var n=M.num(v); return n!=null && n>21; };

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

  /**
   * نسبة التجويف رقم بين 0 و1. تُكتب أحياناً «0.3-0.4» عند الشك،
   * فنقبل الصيغتين ونرفض ما هو خارج المدى — 1.5 خطأ إدخال لا قراءة.
   */
  M.validateCD = function(v){
    if(v==null || String(v).trim()==='') return true;
    var parts = String(v).split(/[-\/]/);
    for(var i=0;i<parts.length;i++){
      var n = parseFloat(parts[i]);
      if(isNaN(n) || n<0 || n>1) return false;
    }
    return true;
  };

  M.validateFinding = function(f){
    var r=V();
    if(!f.field || !M.FIELD_LABEL[f.field]) bad(r,'حقل فحص غير معروف: '+(f.field||''));
    if(!f.eye || !M.EYE[f.eye]) bad(r,'العين مطلوبة');
    if(f.field==='cd_ratio' && !M.validateCD(f.value)) bad(r,'نسبة التجويف بين 0 و1');
    return r;
  };

  M.validateSurgery = function(s){
    var r=V();
    if(!s.patient_id) bad(r,'المريض مطلوب');
    if(!M.str(s.procedure_name)) bad(r,'اسم العملية مطلوب');
    if(!s.eye || !M.EYE[s.eye]) bad(r,'حدّد العين');
    // القيد في القاعدة: مخطَّطة بلا تاريخ مقبولة، مُجراة بلا تاريخ لا
    if(!s.is_planned && !M.isDate(s.performed_on)) bad(r,'تاريخ إجراء العملية مطلوب');
    if(s.performed_on && M.isDate(s.performed_on) && !s.is_planned
       && s.performed_on > M.today()) bad(r,'تاريخ العملية في المستقبل — اجعلها مخطَّطة');
    if(s.is_planned && s.performed_on && M.isDate(s.performed_on)
       && s.performed_on < M.today()) bad(r,'عملية مخطَّطة بتاريخ ماضٍ');
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

  // ══════════════════════════════════════════════════════
  // المرحلة 10 — التصوير التشخيصي
  // ══════════════════════════════════════════════════════

  /** الأنواع المعتمدة في الواجهة — مطابقة لقيم iapp.image_modality */
  M.MODALITY = {
    fundus:       'قاع العين — Fundus',
    oct:          'مقطعية — OCT',
    octa:         'أوعية مقطعية — OCTA',
    ffa:          'صبغة الفلوريسين — FFA',
    pentacam:     'بنتاكام — Pentacam',
    visual_field: 'مجال الإبصار — Visual Field',
    uwf_fundus:   'قاع عين واسع — UWF Fundus',
    uwf_oct:      'مقطعية واسعة — UWF OCT',
    uwf_octa:     'أوعية واسعة — UWF OCTA',
    b_scan:       'موجات صوتية — B-scan',
    other:        'أخرى'
  };

  /** قيم قديمة في القاعدة لا تُعرض للاختيار لكنها تُقرأ ولا تُخفى */
  M.MODALITY_LEGACY = {
    optos:'Optos (قديم)', topography:'طبوغرافيا (قديم)',
    biometry:'قياسات حيوية (قديم)', anterior_segment:'المقطع الأمامي (قديم)',
    xray:'أشعة (قديم)', unknown:'غير محدد'
  };

  M.modalityLabel = function(v){
    return M.MODALITY[v] || M.MODALITY_LEGACY[v] || v || '—';
  };

  M.IMAGING_STATUS = {
    uploaded:'مرفوعة', pending_report:'بانتظار التقرير',
    reported:'مُعتمدة', archived:'مؤرشفة'
  };

  M.IMAGING_STATUS_COLOR = {
    uploaded:'muted', pending_report:'gold', reported:'success', archived:'muted'
  };

  M.DEVICES = ['Topcon','Zeiss Cirrus','Zeiss Clarus','Nidek','Optovue',
    'Heidelberg Spectralis','Optos Daytona','Oculus Pentacam','Humphrey HFA',
    'Canon','Quantel B-scan','جهاز خارجي'];

  M.IMAGING_INDICATION = ['متابعة اعتلال شبكية سكري','تقييم تنكس البقعة',
    'متابعة الجلوكوما','وذمة بقعية','تقييم قبل الحقن','تقييم قبل الليزك',
    'تقييم قبل عملية المياه البيضاء','انفصال شبكي مشتبه','نزيف زجاجي',
    'إعتام يمنع فحص القاع','تقييم القرنية','فحص روتيني'];

  M.IMG_MIME      = ['image/jpeg','image/png','image/webp','application/pdf'];
  M.IMG_MAX_BYTES = 26214400;   // 25 ميجابايت — نفس حدّ الحاوية

  M.fmtBytes = function(n){
    n = Number(n)||0;
    if(n < 1024) return n+' بايت';
    if(n < 1048576) return (n/1024).toFixed(0)+' ك.بايت';
    return (n/1048576).toFixed(1)+' م.بايت';
  };

  /**
   * التحقق قبل الرفع. الرسائل هنا لتحسين التجربة فقط —
   * الحاوية نفسها ترفض النوع والحجم، والقاعدة ترفض التاريخ المستقبلي.
   */
  M.validateImagingStudy = function(s){
    var r = V();
    if(!s.patient_id) bad(r,'المريض مطلوب');
    if(!s.modality || !M.MODALITY[s.modality]) bad(r,'اختر نوع التصوير');
    if(!s.eye || !M.EYE[s.eye]) bad(r,'حدّد العين');
    if(!M.isDate(s.study_date)) bad(r,'تاريخ الدراسة غير صحيح');
    else if(s.study_date > M.today()) bad(r,'تاريخ الدراسة في المستقبل');
    if(s.file){
      if(!s.file.size) bad(r,'الملف فارغ');
      else if(s.file.size > M.IMG_MAX_BYTES)
        bad(r,'حجم الملف '+M.fmtBytes(s.file.size)+' — الحدّ 25 م.بايت');
      var t = String(s.file.type||'').toLowerCase();
      if(t && M.IMG_MIME.indexOf(t) === -1)
        bad(r,'نوع الملف غير مدعوم — JPG أو PNG أو WEBP أو PDF');
    }
    return r;
  };

  M.URGENCY = { routine:'عادي', urgent:'عاجل', stat:'فوري' };

  M.ORDER_STATUS = { requested:'مطلوب', scheduled:'محجوز',
                     completed:'تم', cancelled:'ملغى' };

  /**
   * طلب أشعة: ترويسة + بنود.
   * الشرط الجوهري أن يكون فيه بند واحد على الأقل — ورقة طلب بلا
   * دراسة مطلوبة ورقة بيضاء.
   */
  M.validateImagingOrder = function(o){
    var r = V();
    if(!o.patient_id) bad(r,'المريض مطلوب');
    if(!M.isDate(o.ordered_on)) bad(r,'تاريخ الطلب غير صحيح');
    else if(o.ordered_on > M.today()) bad(r,'تاريخ الطلب في المستقبل');
    if(o.urgency && !M.URGENCY[o.urgency]) bad(r,'درجة الاستعجال غير معروفة');

    var items = (o.items || []).filter(function(it){ return it && it.modality; });
    if(!items.length) bad(r,'أضف دراسة واحدة على الأقل');
    if(items.length > 12) bad(r,'الحد اثنتا عشرة دراسة في الطلب الواحد');
    items.forEach(function(it, i){
      if(!M.MODALITY[it.modality]) bad(r,'نوع التصوير في البند '+(i+1)+' غير معروف');
      if(!it.eye || !M.EYE[it.eye]) bad(r,'حدّد العين في البند '+(i+1));
    });
    return r;
  };

  M.validateImagingReport = function(txt){
    var r = V();
    if(!M.str(txt)) bad(r,'التقرير فارغ');
    else if(M.str(txt).length < 3) bad(r,'التقرير قصير جداً');
    return r;
  };

  global.IAPP = global.IAPP || {};
  global.IAPP.models = M;
})(window);
