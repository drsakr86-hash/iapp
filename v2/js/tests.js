/**
 * اختبارات المرحلة 5 — الدفعة الأولى
 * تشغيل: node js/tests.js
 *
 * تختبر منطق التحقق والتنسيق الذي تعتمد عليه كل الشاشات.
 * كل قاعدة هنا تطابق قيداً حقيقياً في قاعدة البيانات — فالفشل هنا
 * يعني رسالة غامضة للمستخدم، لا ثغرة أمنية.
 */
const fs = require('fs');
const path = require('path');

global.window = {};
const load = f => eval(fs.readFileSync(path.join(__dirname, f), 'utf8'));
load('models.js');
const M = global.window.IAPP.models;

let pass = 0, fail = 0;
const failures = [];
function ok(name, cond, detail){
  if(cond) pass++; else { fail++; failures.push({name, detail}); }
}
function sec(t){ console.log('\n\x1b[1m'+t+'\x1b[0m'); }

// ═══════════════════════════════════════════════════════
sec('1. التواريخ');
ok('اليوم صالح', M.isDate(M.today()));
ok('اليوم بالتقويم المحلي',
   M.today() === new Date().getFullYear()+'-'
     +String(new Date().getMonth()+1).padStart(2,'0')+'-'
     +String(new Date().getDate()).padStart(2,'0'));
ok('رفض فارغ', !M.isDate(''));
ok('رفض null', !M.isDate(null));
ok('رفض نص', !M.isDate('غير تاريخ'));
ok('رفض 2026-13-01', !M.isDate('2026-13-01'));
ok('رفض 2026-02-31 (يتدحرج)', !M.isDate('2026-02-31'));
ok('رفض 2026-04-31', !M.isDate('2026-04-31'));
ok('رفض 2026-02-29 (ليست كبيسة)', !M.isDate('2026-02-29'));
ok('قبول 2024-02-29 (كبيسة)', M.isDate('2024-02-29'));
ok('رفض صيغة بشرطات مائلة', !M.isDate('2026/04/08'));
ok('قبول 2026-12-31', M.isDate('2026-12-31'));

// ═══════════════════════════════════════════════════════
sec('2. قوة العدسة — الإشارة إلزامية سريرياً');
ok('موجب يحمل +', M.diopter(1) === '+1.00');
ok('سالب يحمل -', M.diopter(-2.5) === '-2.50');
ok('صفر', M.diopter(0) === '0.00');
ok('فارغ يعطي شرطة', M.diopter(null)==='—' && M.diopter('')==='—');
ok('نص غير رقمي', M.diopter('abc') === '—');
ok('نص رقمي يُقبل', M.diopter('-1.25') === '-1.25');

sec('3. خطوات الربع ديوبتر');
ok('-2.00 مقبول', M.isQuarter('-2.00'));
ok('-0.25 مقبول', M.isQuarter('-0.25'));
ok('+1.75 مقبول', M.isQuarter('1.75'));
ok('-2.10 مرفوض', !M.isQuarter('-2.10'));
ok('0.33 مرفوض', !M.isQuarter('0.33'));
ok('فارغ مقبول', M.isQuarter(''));

// ═══════════════════════════════════════════════════════
sec('4. تحقق المريض');
ok('اسم صالح', M.validatePatient({full_name:'أحمد محمد'}).ok);
ok('اسم فارغ مرفوض', !M.validatePatient({full_name:''}).ok);
ok('حرف واحد مرفوض', !M.validatePatient({full_name:'أ'}).ok);
ok('كود صحيح', M.validatePatient({full_name:'أحمد',patient_code:'P-0001'}).ok);
ok('كود خاطئ مرفوض', !M.validatePatient({full_name:'أحمد',patient_code:'X1'}).ok);
ok('عمر 200 مرفوض', !M.validatePatient({full_name:'أحمد',age_at_registration:200}).ok);
ok('عمر 45 مقبول', M.validatePatient({full_name:'أحمد',age_at_registration:45}).ok);
ok('فصيلة ZZ مرفوضة', !M.validatePatient({full_name:'أحمد',blood_type:'ZZ'}).ok);
ok('فصيلة A+ مقبولة', M.validatePatient({full_name:'أحمد',blood_type:'A+'}).ok);
ok('بريد خاطئ مرفوض', !M.validatePatient({full_name:'أحمد',email:'abc'}).ok);

// ═══════════════════════════════════════════════════════
sec('5. تحقق الانكسار — يطابق قيود قاعدة البيانات');
ok('قياس سليم', M.validateRefraction({sphere:'-2.00',cylinder:'-0.50',axis:'180'}).ok);
ok('🔴 أسطواني موجب مقبول', M.validateRefraction({sphere:'-2.00',cylinder:'0.50',axis:'90'}).ok);
ok('أسطواني +3.00 مقبول', M.validateRefraction({cylinder:'3.00',axis:'90'}).ok);
ok('كروي -99 مرفوض', !M.validateRefraction({sphere:'-99'}).ok);
ok('كروي +31 مرفوض', !M.validateRefraction({sphere:'31'}).ok);
ok('كروي ±30 مقبول', M.validateRefraction({sphere:'30'}).ok);
ok('أسطواني ±16 مرفوض', !M.validateRefraction({cylinder:'16',axis:'90'}).ok);
ok('محور 200 مرفوض', !M.validateRefraction({axis:'200'}).ok);
ok('محور 180 مقبول', M.validateRefraction({axis:'180'}).ok);
ok('أسطواني بلا محور مرفوض', !M.validateRefraction({cylinder:'-1.5'}).ok);
ok('أسطواني صفر بلا محور مقبول', M.validateRefraction({cylinder:'0'}).ok);
ok('ADD 10 مرفوض', !M.validateRefraction({add_power:'10'}).ok);
ok('ADD +2.00 مقبول', M.validateRefraction({add_power:'2.00'}).ok);
ok('IPD 100 مرفوض', !M.validateRefraction({ipd_mm:'100'}).ok);
ok('IPD 62 مقبول', M.validateRefraction({ipd_mm:'62'}).ok);

// ═══════════════════════════════════════════════════════
sec('6. تحقق الفحص');
ok('فحص سليم', M.validateExam({patient_id:'x',exam_date:M.today()}).ok);
ok('بلا مريض مرفوض', !M.validateExam({exam_date:M.today()}).ok);
ok('تاريخ خاطئ مرفوض', !M.validateExam({patient_id:'x',exam_date:'xx'}).ok);
ok('ضغط 999 مرفوض', !M.validateExam({patient_id:'x',exam_date:M.today(),iop_right:'999'}).ok);
ok('ضغط 14 مقبول', M.validateExam({patient_id:'x',exam_date:M.today(),iop_right:'14'}).ok);
ok('ضغط 80 مقبول (الحد)', M.validateExam({patient_id:'x',exam_date:M.today(),iop_left:'80'}).ok);

sec('7. تحقق الزيارة والموعد والمتابعة');
ok('زيارة سليمة', M.validateVisit({patient_id:'x',visit_date:M.today()}).ok);
ok('نوع زيارة مجهول مرفوض',
   !M.validateVisit({patient_id:'x',visit_date:M.today(),visit_type:'zzz'}).ok);
ok('نوع routine مقبول',
   M.validateVisit({patient_id:'x',visit_date:M.today(),visit_type:'routine'}).ok);
ok('موعد بلا تاريخ مرفوض',
   !M.validateAppointment({clinic_id:'c',scheduled_time:'09:00',patient_id:'p'}).ok);
ok('موعد بلا مريض ولا زائر مرفوض',
   !M.validateAppointment({clinic_id:'c',scheduled_date:M.today(),scheduled_time:'09:00'}).ok);
ok('موعد بزائر مقبول',
   M.validateAppointment({clinic_id:'c',scheduled_date:M.today(),
     scheduled_time:'09:00',guest_name:'زائر'}).ok);
ok('متابعة بتاريخ خاطئ مرفوضة', !M.validateFollowUp({patient_id:'x',due_date:'zz'}).ok);

// ═══════════════════════════════════════════════════════
sec('8. الهواتف');
ok('01xxxxxxxxx يبقى', M.normPhone('01001112222')==='01001112222');
ok('+20 يتحول لصفر', M.normPhone('+201001112222')==='01001112222');
ok('مسافات وشرطات تُزال', M.normPhone('010 0111-2222')==='01001112222');
ok('واتساب يضيف 20', M.waPhone('01001112222')==='201001112222');
ok('واتساب لا يكرر 20', M.waPhone('201001112222')==='201001112222');
ok('فارغ يعطي null', M.normPhone('')===null);

sec('9. القوائم المرجعية');
ok('الشكاوى 12', M.COMPLAINTS.length===12);
ok('حدة الإبصار تشمل CF وHM وPL',
   ['CF','HM','PL','NPL'].every(v=>M.VA.indexOf(v)>-1));
ok('القطاع الأمامي 8', M.ANTERIOR.length===8);
ok('القطاع الخلفي 8', M.POSTERIOR.length===8);
ok('التشخيصات 12', M.DIAGNOSES.length===12);
ok('الخطط 9', M.PLANS.length===9);
ok('أنواع الزيارة 8', Object.keys(M.VISIT_TYPE).length===8);
ok('فصائل الدم 8', M.BLOOD.length===8);

// ═══════════════════════════════════════════════════════
sec('10. المرحلة 9 — السجل السريري المبنيّ');

// ── القوائم ──────────────────────────────────────────────
ok('القطاع الأمامي سبعة حقول', M.ANT_FIELDS.length===7);
ok('القطاع الخلفي ستة حقول',  M.POST_FIELDS.length===6);
ok('كل حقل: مفتاح وتسمية وقائمة',
   M.ANT_FIELDS.concat(M.POST_FIELDS).every(f=>
     typeof f[0]==='string' && typeof f[1]==='string' && Array.isArray(f[2]) && f[2].length));
ok('المفاتيح إنجليزية ثابتة لأنها تُخزَّن',
   M.ANT_FIELDS.concat(M.POST_FIELDS).every(f=>/^[a-z_]+$/.test(f[0])));
ok('لا مفتاح مكرر بين القطاعين',
   new Set(M.ANT_FIELDS.concat(M.POST_FIELDS).map(f=>f[0])).size===13);
ok('كل حقل يعرف قطاعه',
   M.FIELD_SECTION.cornea==='anterior' && M.FIELD_SECTION.macula==='posterior'
   && M.FIELD_SECTION.cd_ratio==='posterior');
ok('كل حقل له قيمة طبيعية',
   Object.keys(M.FIELD_LABEL).every(k=>!!M.FIELD_NORMAL[k]));
ok('C/D الطبيعية 0.3 لا أول عنصر في القائمة', M.FIELD_NORMAL.cd_ratio==='0.3');
ok('fieldList يعيد اقتراحات القرنية', M.fieldList('cornea').indexOf('شفافة')>-1);
ok('fieldList لحقل مجهول يعيد فارغاً', M.fieldList('nope').length===0);
ok('طرق قياس الضغط ست', M.IOP_METHOD.length===6);
ok('Goldmann ضمنها', M.IOP_METHOD.indexOf('Goldmann')>-1);
ok('قراءات الإبصار ثلاث', Object.keys(M.VA_KIND).length===3);

// ── نسبة التجويف ─────────────────────────────────────────
ok('C/D فارغة مقبولة', M.validateCD(''));
ok('C/D 0.0 مقبولة', M.validateCD('0'));
ok('C/D 1.0 مقبولة', M.validateCD('1'));
ok('C/D 1.5 مرفوضة', !M.validateCD('1.5'));
ok('C/D سالبة مرفوضة', !M.validateCD('-0.2'));
ok('C/D بصيغة مدى مقبولة', M.validateCD('0.3-0.4'));
ok('C/D بمدى خارج الحد مرفوضة', !M.validateCD('0.3-1.4'));
ok('C/D نصّ غير رقمي مرفوض', !M.validateCD('كبير'));

// ── الموجود الواحد ───────────────────────────────────────
ok('موجود بحقل مجهول مرفوض',
   !M.validateFinding({field:'zzz',eye:'OD',value:'x'}).ok);
ok('موجود بلا عين مرفوض',
   !M.validateFinding({field:'cornea',value:'x'}).ok);
ok('OU عين صحيحة',
   M.validateFinding({field:'cornea',eye:'OU',value:'x'}).ok);
ok('C/D خارج المدى تُرفض على مستوى الموجود',
   !M.validateFinding({field:'cd_ratio',eye:'OD',value:'2'}).ok);

// ── العمليات ─────────────────────────────────────────────
const S0 = {patient_id:'p1', procedure_name:'فاكو', eye:'OD'};
ok('عملية بلا مريض مرفوضة',
   !M.validateSurgery({procedure_name:'فاكو',eye:'OD',performed_on:M.today()}).ok);
ok('عملية بلا اسم مرفوضة',
   !M.validateSurgery({patient_id:'p1',eye:'OD',performed_on:M.today()}).ok);
ok('عملية بلا عين مرفوضة',
   !M.validateSurgery({patient_id:'p1',procedure_name:'فاكو',performed_on:M.today()}).ok);
ok('عملية بعين مجهولة مرفوضة',
   !M.validateSurgery({...S0, eye:'XX', performed_on:M.today()}).ok);
// نفس قيد chk_surgery_date في القاعدة — القاعدة هي الحارس والتحقق يحسّن الرسالة
ok('🔴 أُجريت بلا تاريخ مرفوضة', !M.validateSurgery(S0).ok);
ok('مخطَّطة بلا تاريخ مقبولة', M.validateSurgery({...S0, is_planned:true}).ok);
ok('أُجريت بتاريخ اليوم مقبولة',
   M.validateSurgery({...S0, performed_on:M.today()}).ok);
const FUT = new Date(Date.now()+30*864e5).toISOString().slice(0,10);
const PAST= new Date(Date.now()-30*864e5).toISOString().slice(0,10);
ok('أُجريت بتاريخ مستقبلي مرفوضة',
   !M.validateSurgery({...S0, performed_on:FUT}).ok);
ok('مخطَّطة بتاريخ مستقبلي مقبولة',
   M.validateSurgery({...S0, is_planned:true, performed_on:FUT}).ok);
ok('مخطَّطة بتاريخ ماضٍ مرفوضة',
   !M.validateSurgery({...S0, is_planned:true, performed_on:PAST}).ok);

// ── المقارنة ─────────────────────────────────────────────
const ROWS = [{key:'a',label:'أ',get:o=>o.a},{key:'b',label:'ب',get:o=>o.b}];
let C = M.compareRows({a:'x',b:'1'}, {a:'y',b:'1'}, ROWS);
ok('اختلاف قيمتين موجودتين تغيّر', C[0].changed===true);
ok('تطابق قيمتين ليس تغيّراً', C[1].changed===false);
ok('المقارنة تحمل القيمتين', C[0].cur==='x' && C[0].prev==='y');
C = M.compareRows({a:'x'}, {}, ROWS);
ok('🔴 غياب السابق ليس تغيّراً', C[0].changed===false);
ok('غياب السابق بند جديد', C[0].isNew===true);
C = M.compareRows({}, {a:'y'}, ROWS);
ok('اختفاء بند ليس تغيّراً ولا جديداً',
   C[0].changed===false && C[0].isNew===false);
C = M.compareRows({a:'x'}, null, ROWS);
ok('بلا زيارة سابقة لا شيء «جديد»', C[0].isNew===false);
ok('الفراغ يُعامل كغياب',
   M.compareRows({a:''},{a:'y'},ROWS)[0].changed===false);
ok('الرقم والنص المتطابقان ليسا اختلافاً',
   M.compareRows({a:6},{a:'6'},ROWS)[0].changed===false);

// ── الضغط المرتفع ────────────────────────────────────────
ok('22 مرتفع', M.iopHigh(22));
ok('21 ليس مرتفعاً', !M.iopHigh(21));
ok('الفارغ ليس مرتفعاً', !M.iopHigh(''));

// ── الفحص الكامل يرفض موجوداً فاسداً ─────────────────────
ok('🔴 فحص بموجود فاسد يُرفض قبل الشبكة',
   !M.validateExam({patient_id:'p1', exam_date:M.today(),
     findings:[{field:'cd_ratio',eye:'OD',value:'9'}]}).ok);
ok('فحص بموجودات سليمة يُقبل',
   M.validateExam({patient_id:'p1', exam_date:M.today(),
     findings:[{field:'cornea',eye:'OD',value:'شفافة'}]}).ok);

// ═══════════════════════════════════════════════════════
console.log('\n'+'─'.repeat(58));
if(fail===0) console.log('\x1b[32m✓ نجحت كل الاختبارات — '+pass+' تأكيداً\x1b[0m');
else{
  console.log('\x1b[31m✗ فشل '+fail+'\x1b[0m / نجح '+pass);
  failures.forEach(f=>console.log('  ✗ '+f.name+(f.detail?'\n     '+f.detail:'')));
}
console.log('─'.repeat(58));
process.exit(fail===0?0:1);
