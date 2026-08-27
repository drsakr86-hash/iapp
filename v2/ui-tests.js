/**
 * اختبار الواجهة — المرحلة 5 · الدفعة 2
 * التشغيل:  npm i jsdom   ثم   node js/ui-tests.js
 * يُشغّل doctor.html فعلياً داخل jsdom فوق خدمات وهمية،
 * فيتحقق من التدفقات كما يراها المستخدم لا من النص فقط.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

/** يعمل سواء وُضع الملف بجوار doctor.html أو داخل مجلد js */
function find(name, dirs){
  for(const d of dirs){ const f=path.join(__dirname,d,name); if(fs.existsSync(f)) return f; }
  throw new Error('لم أجد '+name+' — ضع ui-tests.js بجوار doctor.html أو داخل js/');
}
const F_HTML   = find('doctor.html', ['.','..']);
const F_MODELS = find('models.js',   ['.','js','../js']);
// المرحلة 8: المحرّك الحقيقي يدخل الاختبار كما هو
const F_APTSVC = find('appointment-service.js', ['.','..','../..']);

let pass=0, fail=0, fails=[];
function ok(n,c,d){ if(c) pass++; else { fail++; fails.push(n+(d?' — '+d:'')); } }
const sleep = ms => new Promise(r=>setTimeout(r,ms));

// ── ما استقبلته الخدمات ──────────────────────────────────
const CALLS = { exam:null, visit:null, patient:null, fu:null, dx:null, listArgs:null };

const PATIENTS = [
  { id:'p1', patient_code:'P-0001', full_name:'أحمد محمود', phone:'01001112222',
    gender:'male', age_at_registration:44, is_active:true,
    allergies:'بنسلين', primary_condition:'جلوكوما', medical_history:'سكري',
    blood_type:'O+', city:'دمنهور' },
  { id:'p2', patient_code:'P-0002', full_name:'سارة علي', phone:'01115556666',
    gender:'female', date_of_birth:'1990-05-10', is_active:false }
];

const stub = `
window.IAPP = window.IAPP || {};
IAPP.ROLE_AR = { doctor:'طبيب', admin:'مدير', secretary:'سكرتير', patient:'مريض' };
IAPP.getSession = async () => ({ user:{id:'u1'} });
IAPP.getProfile = async () => ({ role:'doctor', email:'doctor@iapp.local', fullName:'د. عبده', id:'u1' });
IAPP.signOut = async () => true;
// المرحلة 8: لا ننسخ دوال المحرّك هنا. appointment-service.js الحقيقي محمَّل
// بالفعل، ونستبدل ما يلمس الشبكة فقط — وإلا صار ملف الاختبار نسخة سادسة
// من قواعد الحالات، وهو ما تمنعه هذه المرحلة أصلاً.
IAPP.appointments.actionsFor = async () => ([{to:'IN_CLINIC', label:'استدعاء', run:async()=>true}]);
IAPP.appointments.subscribe  = o => { window.__onChange = o.onChange;
  if(o.onReady) o.onReady('SUBSCRIBED'); return ()=>{}; };
IAPP.appointments.liveBoard  = async () => ([]);
IAPP.appointments.complete   = async (id,v) => { window.__calls.complete={id:id,visitId:v};
  if(window.__completeFails) throw new Error('الموعد أُنهي من جهاز آخر');
  return 'COMPLETED'; };
const P = ${JSON.stringify(PATIENTS)};
IAPP.svc = {
  refs: { clinics: async()=>([{id:'c1',name_ar:'دمنهور'},{id:'c2',name_ar:'الرحمانية'}]),
          doctors: async()=>([{id:'d1', email:'doctor@iapp.local'}]) },
  patients: {
    list: async o => { window.__calls.listArgs=o;
      return P.filter(x => o.includeArchived ? true : x.is_active!==false)
              .filter(x => !o.search || x.full_name.indexOf(o.search)>-1); },
    get: async id => P.filter(x=>x.id===id)[0],
    nextCode: async()=>'P-0003',
    count: async()=>12,
    create: async r => { window.__calls.patient={mode:'create',row:r};
      const n={id:'p9',is_active:true,...r}; P.push(n); return n; },
    update: async (id,r) => { window.__calls.patient={mode:'update',id,row:r}; return {id,...r}; },
    archive: async()=>true, unarchive: async()=>true
  },
  visits: {
    listByPatient: async()=>([{id:'v1', visit_date:'2026-08-27', visit_type:'follow_up',
      chief_complaint:'ضعف النظر', summary:'تحسن'}]),
    countToday: async()=>3,
    create: async r => { window.__calls.visit={mode:'create',row:r}; return {id:'v9'}; },
    update: async (id,r) => { window.__calls.visit={mode:'update',id,row:r}; return {id}; }
  },
  examinations: {
    listByPatient: async()=>([{id:'x1', exam_date:'2026-08-20', va_right:'6/9', va_left:'CF',
      anterior_segment:'طبيعي', treatment_plan:'نظارة طبية',
      _iop_od:{value_mmhg:26}, _iop_os:{value_mmhg:15}}]),
    createFull: async d => { window.__calls.exam=d;
      return { exam:{id:'x9'}, warnings:['المتابعة لم تُحفظ: خطأ اختبار'] }; },
    update: async (id,d) => { window.__calls.exam={_edit:id,...d}; return {id}; }
  },
  diagnoses: {
    listByPatient: async()=>([{id:'g1', diagnosis_text:'المياه الزرقاء', status:'chronic',
      eye:'OU', is_primary:true, diagnosed_on:'2026-08-20'}]),
    create: async d => { window.__calls.dx=d; return {id:'g9'}; },
    setStatus: async()=>true, remove: async()=>true
  },
  followups: {
    listByPatient: async()=>([{id:'f1', due_date:'2026-09-10', reason:'قياس ضغط', status:'pending'}]),
    due: async()=>([]),
    create: async f => { window.__calls.fu=f; return {id:'f9'}; },
    setStatus: async()=>true
  },
  appointments: {
    today: async()=>([{id:'a1', patient_id:'p1', display_name:'أحمد محمود',
      scheduled_date:'2026-08-27', scheduled_time:'10:00:00', status:'WAITING'},
      {id:'a2', patient_id:'p2', display_name:'سارة علي',
      scheduled_date:'2026-08-27', scheduled_time:'10:10:00', status:'IN_CLINIC'}]),
    complete: (id,v) => IAPP.appointments.complete(id,v),
    live: async()=>([]),
    actionsFor: (a,r) => IAPP.appointments.actionsFor(a,r),
    statusLabel: s => IAPP.appointments.statusLabel(s),
    waitLabel: a => IAPP.appointments.waitLabel(a),
    subscribe: o => IAPP.appointments.subscribe(o)
  },
  prescriptions: { listByPatient: async()=>([]) }
};
`;

(async function(){
  let html = fs.readFileSync(F_HTML,'utf8');
  html = html.replace(/<script src="[^"]*"><\/script>/g, '');
  const models = fs.readFileSync(F_MODELS,'utf8')
              + '\nwindow.IAPP=window.IAPP||{};window.IAPP.client=function(){return {};};\n'
              // تعليق داخل appointment-service.js يحتوي على وسم إغلاق سكربت،
              // وحقنه كما هو يُنهي الوسم مبكراً فينهار كل شيء بلا رسالة مفهومة.
              + fs.readFileSync(F_APTSVC,'utf8').replace(/<\/script/gi,'<\\/script');
  html = html.replace('<script>\n(function(){',
    '<script>'+models+'<\/script><script>'+stub+'<\/script><script>\n(function(){');

  const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/' });
  const w = dom.window, doc = w.document;
  w.__calls = CALLS;
  w.confirm = () => true;
  w.prompt = () => 'سبب';
  w.open = () => null;
  w.alert = () => {};

  const $  = s => doc.querySelector(s);
  const $$ = s => Array.from(doc.querySelectorAll(s));
  const byText = (sel,t) => $$(sel).filter(e => e.textContent.indexOf(t)>-1)[0];
  const set = (id,v) => { const e=doc.getElementById(id); e.value=v;
    e.dispatchEvent(new w.Event('input',{bubbles:true})); };
  const pick = (id,v) => { const s=doc.querySelector('[data-pick="'+id+'"]'); s.value=v;
    s.dispatchEvent(new w.Event('change',{bubbles:true})); };
  const click = el => el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));

  await sleep(120);

  // ── 1. الإقلاع ──────────────────────────────────────────
  console.log('\n\x1b[1m1. الإقلاع ولوحة اليوم\x1b[0m');
  ok('يعرض اسم الطبيب', doc.body.textContent.indexOf('د. عبده')>-1);
  ok('يعرض رقم الإصدار P8', doc.body.textContent.indexOf('P8')>-1);
  ok('التبويبات الأربعة موجودة', $$('[data-tab]').length===4);
  ok('تبويب المرضى مضاف', !!byText('.tab','المرضى'));
  ok('المؤشر المباشر يعمل', !!$('.dot.on'));
  ok('بطاقة موعد ظاهرة', !!$('.apt'));
  ok('إحصاء إجمالي المرضى = 12', doc.body.textContent.indexOf('12')>-1);
  await sleep(40);
  ok('أزرار حالة الموعد رُسمت من الخادم', $('.acts button')!==null);

  // ── 2. المرضى والبحث ───────────────────────────────────
  console.log('\x1b[1m2. المرضى والبحث\x1b[0m');
  click(byText('.tab','المرضى'));
  await sleep(60);
  ok('حقل البحث ظاهر', !!doc.getElementById('q'));
  ok('صف مريض واحد نشط', $$('#plist .prow').length===1);
  ok('يعرض الاسم والكود', $('#plist').textContent.indexOf('P-0001')>-1);
  ok('المؤرشف مخفي افتراضياً', $('#plist').textContent.indexOf('سارة')===-1);

  click(doc.getElementById('arch'));
  await sleep(60);
  ok('زر المؤرشفين يمرّر includeArchived', CALLS.listArgs.includeArchived===true);
  ok('المؤرشف ظهر معلَّماً', !!$('#plist .prow.off'));

  set('q','سارة');
  await sleep(420);
  ok('البحث يمرَّر للخدمة (بتأخير)', CALLS.listArgs.search==='سارة');
  ok('نتيجة البحث واحدة', $$('#plist .prow').length===1);

  // ── 3. ملف المريض ──────────────────────────────────────
  console.log('\x1b[1m3. ملف المريض\x1b[0m');
  set('q',''); await sleep(420);
  click($('#plist .prow'));
  await sleep(120);
  ok('فُتح الملف', doc.body.textContent.indexOf('أحمد محمود')>-1);
  ok('تنبيه الحساسية بارز', $('.alert') && $('.alert').textContent.indexOf('بنسلين')>-1);
  ok('الحالة الأساسية معروضة', doc.body.textContent.indexOf('جلوكوما')>-1);
  // خمسة منذ الدفعة 3 (أُضيف تبويب الوصفات) — كان التأكيد متخلّفاً عن الملف
  ok('تبويبات الملف الخمسة', $$('[data-pt]').length===5,
     $$('[data-pt]').length+'');
  ok('الزيارات محمَّلة تلقائياً', $('#ptbody').textContent.indexOf('ضعف النظر')>-1);
  ok('نوع الزيارة معرَّب', $('#ptbody').textContent.indexOf('متابعة')>-1);

  click(byText('[data-pt]','الفحوصات'));
  await sleep(80);
  ok('حدة الإبصار نصية تُعرض كما هي', $('#ptbody').textContent.indexOf('CF')>-1);
  ok('ضغط 26 مُعلَّم كمرتفع', !!$('#ptbody .hi'));
  ok('ضغط 15 غير مُعلَّم', $('#ptbody').textContent.indexOf('15 mmHg')>-1);

  click(byText('[data-pt]','التشخيصات'));
  await sleep(80);
  ok('التشخيص وحالته معروضان', $('#ptbody').textContent.indexOf('المياه الزرقاء')>-1
     && $('#ptbody').textContent.indexOf('مزمن')>-1);
  ok('زر تشخيص جديد موجود', !!doc.getElementById('newdx'));

  click(byText('[data-pt]','المتابعات'));
  await sleep(80);
  ok('المتابعة معروضة', $('#ptbody').textContent.indexOf('قياس ضغط')>-1);

  // ── 4. نموذج الفحص ─────────────────────────────────────
  console.log('\x1b[1m4. نموذج الفحص\x1b[0m');
  click(doc.getElementById('newexam'));
  await sleep(120);
  ok('فُتحت الطبقة', !!$('.sheet'));
  ok('تاريخ الفحص = اليوم', doc.getElementById('e_date').value === w.IAPP.models.today());
  ok('حقول ضغط العين موجودة في الجديد', !!doc.getElementById('e_iopd'));
  ok('حقل التشخيص موجود في الجديد', !!doc.getElementById('e_dx'));
  ok('لا datalist في النموذج', $$('datalist').length===0);
  ok('قوائم الاقتراح select حقيقي', $$('.combo select').length>0);

  pick('e_vad','6/9');
  ok('القائمة تكتب في الحقل (set)', doc.getElementById('e_vad').value==='6/9');
  pick('e_vad','CF');
  ok('set يستبدل ولا يكرّر', doc.getElementById('e_vad').value==='CF');
  pick('e_ant','طبيعي'); pick('e_ant','جفاف بالعين');
  ok('add يضيف بفاصلة',
     doc.getElementById('e_ant').value==='طبيعي، جفاف بالعين',
     doc.getElementById('e_ant').value);

  set('e_vas','PL'); set('e_iopd','26'); set('e_iops','15');
  doc.getElementById('e_dx').value='المياه الزرقاء';
  doc.getElementById('e_dxeye').value='OU';
  doc.getElementById('e_fudate').value='2026-09-15';
  doc.getElementById('e_plan').value='متابعة دورية';

  // التحديث المباشر أثناء فتح النموذج يجب ألا يمحوه
  if(w.__onChange) w.__onChange();
  await sleep(120);
  ok('🔴 التحديث المباشر لا يمحو النموذج المفتوح', !!$('.sheet') && !!doc.getElementById('e_dx'));
  ok('القيم المكتوبة بقيت', doc.getElementById('e_vas').value==='PL');

  click(doc.getElementById('save'));
  await sleep(150);
  ok('أُرسل للخدمة', !!CALLS.exam);
  ok('المريض مرفق', CALLS.exam.patient_id==='p1');
  ok('doctor_id مربوط من جدول الأطباء', CALLS.exam.doctor_id==='d1');
  ok('clinic_id مرفق', CALLS.exam.clinic_id==='c1');
  ok('حدة الإبصار نص', CALLS.exam.va_left==='PL');
  ok('ضغط العين مرفق', CALLS.exam.iop_right==='26' && CALLS.exam.iop_left==='15');
  ok('التشخيص والعين مرفقان',
     CALLS.exam.diagnosis_text==='المياه الزرقاء' && CALLS.exam.diagnosis_eye==='OU');
  ok('المتابعة مرفقة', CALLS.exam.follow_up_date==='2026-09-15');
  ok('الزيارة مرتبطة تلقائياً بزيارة اليوم', CALLS.exam.visit_id==='v1');
  ok('أُغلقت الطبقة بعد الحفظ', !$('.sheet'));
  ok('🔴 تحذير الخدمة عُرض ولم يُبتلع',
     (byText('.toast','لم تُحفظ')||{}).textContent!==undefined);

  // ── 5. رفض ما ترفضه القاعدة قبل الشبكة ─────────────────
  console.log('\x1b[1m5. التحقق قبل الإرسال\x1b[0m');
  CALLS.exam=null;
  click(doc.getElementById('newexam'));
  await sleep(120);
  doc.getElementById('e_date').value='';
  click(doc.getElementById('save'));
  await sleep(80);
  ok('فحص بلا تاريخ لا يُرسل', CALLS.exam===null);
  ok('النموذج يبقى مفتوحاً للتصحيح', !!$('.sheet'));
  click(doc.getElementById('mcancel'));
  await sleep(40);
  ok('زر الإلغاء يغلق', !$('.sheet'));

  // ── 6. الزيارة ─────────────────────────────────────────
  console.log('\x1b[1m6. الزيارة\x1b[0m');
  click(doc.getElementById('newvisit'));
  await sleep(100);
  ok('تاريخ الزيارة = اليوم', doc.getElementById('v_date').value===w.IAPP.models.today());
  ok('النوع الافتراضي routine', doc.getElementById('v_type').value==='routine');
  doc.getElementById('v_type').value='retina';
  pick('v_cc','صداع');
  click(doc.getElementById('save'));
  await sleep(120);
  ok('حُفظت الزيارة', CALLS.visit && CALLS.visit.mode==='create');
  ok('النوع مرسل', CALLS.visit.row.visit_type==='retina');
  ok('الشكوى مرسلة', CALLS.visit.row.chief_complaint==='صداع');
  ok('العيادة مرسلة', CALLS.visit.row.clinic_id==='c1');

  // ── 7. تعديل الفحص لا يدّعي ما لا يفعل ─────────────────
  console.log('\x1b[1m7. تعديل الفحص\x1b[0m');
  click(byText('[data-pt]','الفحوصات'));
  await sleep(100);
  click($('[data-eexam]'));
  await sleep(120);
  ok('لا حقول ضغط عين في التعديل', !doc.getElementById('e_iopd'));
  ok('لا حقل تشخيص في التعديل', !doc.getElementById('e_dx'));
  ok('🔴 يوضّح ذلك للطبيب بدل الصمت', !!$('.note'));
  ok('القيم القديمة محمَّلة', doc.getElementById('e_vad').value==='6/9');
  click(doc.getElementById('mcancel'));

  // ── 8. المريض: إضافة وتعديل ────────────────────────────
  console.log('\x1b[1m8. نموذج المريض\x1b[0m');
  click(doc.getElementById('pedit'));
  await sleep(120);
  ok('البيانات محمَّلة للتعديل', doc.getElementById('f_name').value==='أحمد محمود');
  ok('الحساسية محمَّلة', doc.getElementById('f_allergy').value==='بنسلين');
  doc.getElementById('f_phone').value='+20 100-111-2222';
  click(doc.getElementById('save'));
  await sleep(150);
  ok('وضع التعديل لا الإنشاء', CALLS.patient.mode==='update');
  ok('🔴 الهاتف يُوحَّد قبل الحفظ', CALLS.patient.row.phone==='01001112222',
     CALLS.patient.row.phone);

  CALLS.patient=null;
  ok('تبويبات الرأس مخفية داخل الملف', $$('[data-tab]').length===0);
  click(doc.getElementById('back'));
  await sleep(80);
  click(byText('.tab','المرضى'));
  await sleep(80);
  click(doc.getElementById('newp'));
  await sleep(150);
  ok('الكود التالي مُقترح تلقائياً', doc.getElementById('f_code').value==='P-0003');
  doc.getElementById('f_name').value='م';
  click(doc.getElementById('save'));
  await sleep(80);
  ok('اسم من حرف واحد مرفوض محلياً', CALLS.patient===null);
  doc.getElementById('f_name').value='مريم حسن';
  doc.getElementById('f_age').value='200';
  click(doc.getElementById('save'));
  await sleep(80);
  ok('عمر 200 مرفوض محلياً', CALLS.patient===null);
  doc.getElementById('f_age').value='31';
  click(doc.getElementById('save'));
  await sleep(150);
  ok('حُفظ المريض الجديد', CALLS.patient && CALLS.patient.mode==='create');
  ok('العيادة الأساسية مرفقة', CALLS.patient.row.primary_clinic_id==='c1');
  await sleep(150);
  ok('ينتقل لملف المريض بعد الإضافة', doc.body.textContent.indexOf('رجوع')>-1);

  // ── 9. الرجوع والتنقّل ─────────────────────────────────
  console.log('\x1b[1m9. التنقّل\x1b[0m');
  click(doc.getElementById('back'));
  await sleep(80);
  ok('الرجوع يعيد لقائمة المرضى', !!doc.getElementById('q'));
  click(byText('.tab','اليوم'));
  await sleep(60);
  click($('.apt'));
  await sleep(150);
  ok('🔴 فتح الملف من بطاقة الموعد', doc.body.textContent.indexOf('أحمد محمود')>-1
     && !!doc.getElementById('back'));


  // ── 11. المرحلة 8: الموعد والزيارة حدث واحد ────────────
  console.log('\x1b[1m11. المرحلة 8 — وصل الزيارة بالموعد\x1b[0m');

  /** يعود إلى لوحة اليوم من أي مكان — الملف يخفي شريط التبويبات */
  const goDay = async () => {
    const b=doc.getElementById('back'); if(b){ click(b); await sleep(100); }
    const t=byText('.tab','اليوم'); if(t){ click(t); await sleep(150); }
  };

  // لا قوائم حالات مكرّرة في الواجهة: المعنى من المحرّك وحده
  ok('المحرّك الحقيقي محمَّل لا نسخة منه', typeof w.IAPP.appointments.isQueued==='function');
  ok('QUEUED = وصل + ينتظر', w.IAPP.appointments.QUEUED.join()==='ARRIVED,WAITING');
  ok('IN_CLINIC ليست ضمن قائمة الانتظار', !w.IAPP.appointments.isQueued('IN_CLINIC'));
  ok('IN_CLINIC ضمن الحاضرين الآن', w.IAPP.appointments.isLive('IN_CLINIC'));
  ok('رمز التزامن الجديد مترجَم',
     w.IAPP.appointments.translateError({message:'already_in_state: x'}).code==='already_in_state');

  // مريض داخل العيادة الآن (a2 → p2): الزيارة يجب أن تحمل رقم الموعد وتُنهيه
  CALLS.visit=null; CALLS.complete=null;
  await goDay();
  click(doc.querySelector('[data-open="p2"]'));
  await sleep(150);
  click(doc.getElementById('newvisit'));
  await sleep(120);
  ok('النموذج يُنبّه أن الموعد سيُنهى', $('.sheet').textContent.indexOf('سيُنهى الموعد')>-1);
  click(doc.getElementById('save'));
  await sleep(150);
  ok('الزيارة تحمل رقم الموعد', CALLS.visit && CALLS.visit.row.appointment_id==='a2',
     CALLS.visit? String(CALLS.visit.row.appointment_id):'لا زيارة');
  ok('الموعد أُنهي تلقائياً', CALLS.complete && CALLS.complete.id==='a2');
  ok('الإنهاء يمرّر رقم الزيارة', CALLS.complete && CALLS.complete.visitId==='v9');

  // مريض بلا موعد داخل العيادة (p1 حالته WAITING): لا إنهاء ولا ربط
  CALLS.visit=null; CALLS.complete=null;
  await goDay();
  click(doc.querySelector('[data-open="p1"]')); await sleep(150);
  click(doc.getElementById('newvisit')); await sleep(120);
  // نفحص النموذج المفتوح نفسه لا كامل الصفحة: رسالة سابقة عالقة في مكان آخر
  // كانت تجعل التأكيد يفشل لسبب لا علاقة له بما نختبره.
  ok('لا تنبيه لمريض لم يُستدعَ بعد', $('.sheet').textContent.indexOf('سيُنهى الموعد')===-1);
  click(doc.getElementById('save')); await sleep(150);
  ok('لا ربط بموعد غير قائم', CALLS.visit && !CALLS.visit.row.appointment_id);
  ok('لا إنهاء موعد بلا سبب', CALLS.complete===null);

  // فشل الإنهاء لا يُلغي الزيارة ولا يُبتلَع
  w.__completeFails = true;
  CALLS.visit=null; CALLS.complete=null;
  await goDay();
  click(doc.querySelector('[data-open="p2"]')); await sleep(150);
  click(doc.getElementById('newvisit')); await sleep(120);
  click(doc.getElementById('save')); await sleep(200);
  ok('الزيارة تُحفظ رغم فشل الإنهاء', CALLS.visit && CALLS.visit.mode==='create');
  ok('الفشل يُقال للطبيب لا يُخفى', doc.body.textContent.indexOf('إنهاء الموعد تعذّر')>-1);
  w.__completeFails = false;

  // ── 10. لا معرّفات مكرّرة داخل النماذج ─────────────────
  console.log('\x1b[1m10. سلامة المعرّفات\x1b[0m');
  function dups(){ const seen={},d=[];
    Array.from(doc.querySelectorAll('[id]')).forEach(e=>{
      if(seen[e.id]) d.push(e.id); seen[e.id]=1; });
    return d; }
  click(doc.getElementById('back')); await sleep(80);
  click(byText('.tab','المرضى')); await sleep(80);
  click(doc.getElementById('newp')); await sleep(150);
  ok('نموذج المريض بلا تكرار', dups().length===0, dups().join(','));
  ok('حقل الفرز مرة واحدة', $$('#f_triage').length===1);
  ok('الرقم القومي يظهر للجديد فقط', !!doc.getElementById('f_nid'));
  click(doc.getElementById('mcancel')); await sleep(40);
  click($('#plist .prow')); await sleep(150);
  click(doc.getElementById('newexam')); await sleep(150);
  ok('نموذج الفحص بلا تكرار', dups().length===0, dups().join(','));
  click(doc.getElementById('mcancel')); await sleep(40);
  click(doc.getElementById('newvisit')); await sleep(120);
  ok('نموذج الزيارة بلا تكرار', dups().length===0, dups().join(','));
  click(doc.getElementById('mcancel')); await sleep(40);
  click(doc.getElementById('pedit')); await sleep(150);
  ok('نموذج التعديل بلا تكرار', dups().length===0, dups().join(','));
  ok('الرقم القومي مخفي في التعديل', !doc.getElementById('f_nid'));
  click(doc.getElementById('mcancel')); await sleep(40);

  console.log('\n'+'─'.repeat(58));
  if(fail===0) console.log('\x1b[32m✓ نجحت كل اختبارات الواجهة — '+pass+' تأكيداً\x1b[0m');
  else { console.log('\x1b[31m✗ فشل '+fail+'\x1b[0m / نجح '+pass);
         fails.forEach(f=>console.log('  ✗ '+f)); }
  console.log('─'.repeat(58));
  process.exit(fail===0?0:1);
})();
