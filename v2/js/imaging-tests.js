/**
 * اختبار المرحلة 10 — التصوير التشخيصي
 *   npm i jsdom   ثم   node js/imaging-tests.js
 *
 * يشغّل doctor.html وsvc-imaging.js الحقيقيين داخل jsdom فوق عميل
 * Supabase وهمي. الوهمي هنا هو الشبكة فقط — منطق الخدمة والواجهة
 * يُختبر كما هو، فما ينجح هنا هو ما سيعمل في المتصفح.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

function find(name, dirs){
  for(const d of dirs){ const f = path.join(__dirname, d, name); if(fs.existsSync(f)) return f; }
  throw new Error('لم أجد ' + name);
}
const F_HTML    = find('doctor.html', ['.','..']);
const F_MODELS  = find('models.js',   ['.','js','../js']);
const F_IMAGING = find('svc-imaging.js', ['.','js','../js']);
const F_APTSVC  = find('appointment-service.js', ['.','..','../..']);

let pass = 0, fail = 0; const fails = [];
function ok(n, c, d){ if(c) pass++; else { fail++; fails.push(n + (d ? ' — ' + d : '')); } }
const sleep = ms => new Promise(r => setTimeout(r, ms));

const PATIENTS = [
  { id:'11111111-1111-4111-8111-111111111111', patient_code:'P-0001',
    full_name:'أحمد محمود', phone:'01001112222', gender:'male',
    age_at_registration:44, is_active:true }
];

const IMAGES = [
  { id:'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
    patient_id:PATIENTS[0].id, visit_id:null, modality:'oct', eye:'OD',
    study_date:'2026-08-20', captured_on:'2026-08-20',
    device:'Zeiss Cirrus', technician:'م. هدى',
    clinical_indication:'وذمة بقعية',
    storage_provider:'supabase',
    storage_path:'p/'+PATIENTS[0].id+'/aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa/original.jpg',
    thumbnail_path:'p/'+PATIENTS[0].id+'/aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa/thumb.jpg',
    file_name:'oct-od.jpg', mime_type:'image/jpeg', size_bytes:2400000,
    doctor_report:null, status:'pending_report', deleted_at:null,
    created_at:'2026-08-20T09:00:00Z' },
  { id:'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb',
    patient_id:PATIENTS[0].id, modality:'visual_field', eye:'OS',
    study_date:'2026-08-18', captured_on:'2026-08-18',
    device:'Humphrey HFA', storage_provider:'supabase',
    storage_path:'p/'+PATIENTS[0].id+'/bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb/report.pdf',
    thumbnail_path:null, file_name:'hfa.pdf', mime_type:'application/pdf',
    size_bytes:410000, doctor_report:'تضيّق مجال أنفي علوي.',
    status:'reported', deleted_at:null, created_at:'2026-08-18T09:00:00Z' }
];

// ── عميل Supabase وهمي: الشبكة فقط ────────────────────────
const fake = `
window.__net = { uploads:[], signed:[], removed:[], rpc:[], writes:[], objects:{} };
window.__failInsert = false;
window.__failUpload = false;

const DB = { medical_images: ${JSON.stringify(IMAGES)},
             v_patient_clinical: ${JSON.stringify(PATIENTS)},
             imaging_orders: [], imaging_order_items: [] };
window.__seq = 0;
window.__DB = DB;

function match(row, f){
  return f.every(function(c){
    var k=c[0], op=c[1], v=c[2];
    if(op==='eq')  return String(row[k]) === String(v);
    if(op==='neq') return String(row[k]) !== String(v);
    if(op==='is')  return v===null ? (row[k]===null || row[k]===undefined) : row[k]===v;
    if(op==='in')  return v.indexOf(row[k]) > -1;
    return true;
  });
}

function Q(table){ this.t=table; this.f=[]; this.op='select'; this.body=null;
                   this._one=false; this._maybe=false; this._head=false; }
Q.prototype.select=function(c,o){ if(o&&o.head) this._head=true; return this; };
Q.prototype.eq =function(k,v){ this.f.push([k,'eq',v]);  return this; };
Q.prototype.neq=function(k,v){ this.f.push([k,'neq',v]); return this; };
Q.prototype.is =function(k,v){ this.f.push([k,'is',v]);  return this; };
Q.prototype.in =function(k,v){ this.f.push([k,'in',v]);  return this; };
Q.prototype.or =function(){ return this; };
Q.prototype.order=function(){ return this; };
Q.prototype.limit=function(){ return this; };
Q.prototype.insert=function(r){ this.op='insert'; this.body=r; return this; };
Q.prototype.update=function(p){ this.op='update'; this.body=p; return this; };
Q.prototype.delete=function(){ this.op='delete'; return this; };
Q.prototype.single=function(){ this._one=true; return this; };
Q.prototype.maybeSingle=function(){ this._maybe=true; return this; };
Q.prototype.then=function(res, rej){
  var out, self=this, rows=DB[this.t]||[];
  try{
    if(this.op==='insert'){
      if(window.__failInsert) throw new Error('violates row-level security policy');
      if(this.t==='imaging_order_items' && window.__failItems)
        throw new Error('violates row-level security policy');
      var body=this.body, arr=Array.isArray(body)?body:[body];
      arr.forEach(function(rw){
        var c=JSON.parse(JSON.stringify(rw));
        if(self.t==='imaging_orders'){
          window.__seq++;
          c.id = c.id || ('ord-'+window.__seq);
          c.order_no = c.order_no || ('IMG-2026-'+String(window.__seq).padStart(5,'0'));
          c.status = c.status || 'requested';
          c.printed_count = 0; c.deleted_at = null;
        }
        if(self.t==='imaging_order_items') c.id = c.id || ('it-'+Math.random());
        rows.push(c); rw.id=c.id; rw.order_no=c.order_no;
        rw.status=c.status; rw.printed_count=c.printed_count;
      });
      window.__net.writes.push({op:'insert', table:this.t, row:body});
      out={ data: Array.isArray(body)?body:body, error:null };
    } else if(this.op==='update'){
      var hit=rows.filter(function(r){ return match(r,self.f); });
      hit.forEach(function(r){ Object.keys(self.body).forEach(function(k){ r[k]=self.body[k]; }); });
      window.__net.writes.push({op:'update', table:this.t, patch:this.body, n:hit.length});
      out={ data: hit[0]||null, error: hit.length?null:{message:'no rows'} };
    } else if(this.op==='delete'){
      var keep=[], gone=[];
      rows.forEach(function(r){ (match(r,self.f)?gone:keep).push(r); });
      DB[this.t]=keep;
      window.__net.writes.push({op:'delete', table:this.t, n:gone.length});
      out={ data:gone, error:null };
    } else {
      var d=rows.filter(function(r){ return match(r,self.f); });
      if(this._head) out={ data:null, count:d.length, error:null };
      else if(this._one)   out={ data:d[0]||null, error:d.length?null:{message:'no rows'} };
      else if(this._maybe) out={ data:d[0]||null, error:null };
      else out={ data:d, error:null };
    }
  }catch(e){ out={ data:null, error:{message:e.message} }; }
  return Promise.resolve(out).then(res, rej);
};

const FAKE = {
  from: function(t){ return new Q(t); },
  rpc: async function(name, args){
    window.__net.rpc.push({name:name, args:args});
    if(name==='mark_order_printed'){
      var o=(DB.imaging_orders||[]).filter(function(r){ return r.id===args.p_id; })[0];
      if(!o) return { data:null, error:{message:'order_not_found'} };
      o.printed_count=(o.printed_count||0)+1; o.printed_at=new Date().toISOString();
      return { data:o, error:null };
    }
    return { data:null, error:null }; },
  storage: { from: function(bucket){ return {
    upload: async function(p, file, opts){
      window.__net.uploads.push({bucket:bucket, path:p, opts:opts,
                                 size:(file&&file.size)||0});
      if(window.__failUpload) return { data:null, error:{message:'network down'} };
      window.__net.objects[p]=true;
      return { data:{path:p}, error:null };
    },
    createSignedUrl: async function(p, ttl, opts){
      window.__net.signed.push({path:p, ttl:ttl, opts:opts||null});
      return { data:{ signedUrl:'https://sb.test/object/sign/'+p+'?token=t' }, error:null };
    },
    createSignedUrls: async function(paths, ttl){
      paths.forEach(function(p){ window.__net.signed.push({path:p, ttl:ttl, batch:true}); });
      return { data: paths.map(function(p){
        return { path:p, signedUrl:'https://sb.test/object/sign/'+p+'?token=t' }; }), error:null };
    },
    remove: async function(paths){
      window.__net.removed.push(paths);
      paths.forEach(function(p){ delete window.__net.objects[p]; });
      return { data:[], error:null };
    }
  };} }
};

window.IAPP = window.IAPP || {};
IAPP.client = function(){ return FAKE; };
`;

// ── بقية IAPP: هوية وخدمات لا تخص المرحلة 10 ──────────────
const stub = `
IAPP.ROLE_AR = { doctor:'طبيب', admin:'مدير', secretary:'سكرتير', patient:'مريض' };
IAPP.C = { accent:'#00C2FF' };
IAPP.getSession = async () => ({ user:{ id:'u1' } });
IAPP.getProfile = async () => ({ role: window.__role || 'doctor',
  email:'doctor@iapp.local', fullName:'د. عبده', userId:'u1' });
IAPP.signOut = async () => true;
IAPP.todayLocal = () => '2026-08-28';
IAPP.appointments.actionsFor = async () => ([]);
IAPP.appointments.subscribe  = o => { if(o.onReady) o.onReady('SUBSCRIBED'); return ()=>{}; };
IAPP.appointments.liveBoard  = async () => ([]);

const P = ${JSON.stringify(PATIENTS)};
IAPP.svc = IAPP.svc || {};
IAPP.svc.refs = { clinics: async()=>([{id:'c1',name_ar:'دمنهور'}]),
                  doctors: async()=>([{id:'d1', email:'doctor@iapp.local'}]) };
IAPP.svc.patients = {
  list: async()=>P, get: async id => P.filter(x=>x.id===id)[0],
  nextCode: async()=>'P-0002', count: async()=>1,
  create: async r=>r, update: async (i,r)=>r, archive: async()=>true, unarchive: async()=>true
};
IAPP.svc.visits = { listByPatient: async()=>([
  { id:'v1', visit_date:'2026-08-20', visit_type:'follow_up' }]), create: async r=>r };
IAPP.svc.examinations = { listByPatient: async()=>([]) };
IAPP.svc.diagnoses    = { listByPatient: async()=>([]) };
IAPP.svc.surgeries    = { listByPatient: async()=>([]) };
IAPP.svc.followups    = { listByPatient: async()=>([]), due: async()=>([]),
                          setStatus: async()=>true };
IAPP.svc.prescriptions= { listByPatient: async()=>([]), meds: async()=>([]) };
IAPP.svc.appointments = {
  today: async()=>([]), live: async()=>([]), liveBoard: async()=>([]),
  subscribe: o => { if(o.onReady) o.onReady('SUBSCRIBED'); return ()=>{}; },
  actionsFor: async()=>([]), complete: async()=>'COMPLETED',
  statusLabel: s=>s, waitLabel: ()=>''
};
IAPP.svc.visits.countToday = async()=>0;
IAPP.svc.followups.due = async()=>([]);
IAPP.svc.examinations.comparePair = async()=>({});
IAPP.svc.prescriptions.medications = async()=>([]);
`;

function makeDom(role){
  let html = fs.readFileSync(F_HTML, 'utf8');
  html = html.replace(/<script src="[^"]*"><\/script>/g, '');

  const libs = fs.readFileSync(F_MODELS, 'utf8')
    + '\nwindow.__role=' + JSON.stringify(role || 'doctor') + ';\n'
    + fake
    + '\n' + fs.readFileSync(F_APTSVC, 'utf8').replace(/<\/script/gi, '<\\/script')
    + '\n' + fs.readFileSync(F_IMAGING, 'utf8');

  html = html.replace('<script>\n(function(){',
    '<script>' + libs + '<\/script><script>' + stub + '<\/script><script>\n(function(){');

  return new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true,
                           url:'https://x.test/' });
}

(async function(){
  const dom = makeDom('doctor');
  const w = dom.window, doc = w.document;
  w.confirm = () => true;
  w.alert = () => {};
  let opened = [];
  w.open = (u) => { opened.push(u); return null; };

  const $  = s => doc.querySelector(s);
  const $$ = s => Array.from(doc.querySelectorAll(s));
  const byText = (sel,t) => $$(sel).filter(e => e.textContent.indexOf(t) > -1)[0];
  const click = el => el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  const M   = () => w.IAPP.models;
  const SVC = () => w.IAPP.svc.imaging;

  await sleep(150);

  // ── 1. النماذج ─────────────────────────────────────────
  console.log('\n\x1b[1m1. النماذج والقوائم\x1b[0m');
  const mods = Object.keys(M().MODALITY);
  ok('أحد عشر نوع تصوير', mods.length === 11, String(mods.length));
  ['fundus','oct','octa','ffa','pentacam','visual_field',
   'uwf_fundus','uwf_oct','uwf_octa','b_scan','other'].forEach(k => {
    ok('النوع ' + k + ' موجود', mods.indexOf(k) > -1);
  });
  ok('وسم النوع القديم يُقرأ', M().modalityLabel('optos').indexOf('Optos') > -1);
  ok('نوع مجهول يُعرض كما هو', M().modalityLabel('zzz') === 'zzz');
  ok('أربع حالات للدراسة', Object.keys(M().IMAGING_STATUS).length === 4);

  const PID = PATIENTS[0].id;
  const good = { patient_id:PID, modality:'oct', eye:'OD', study_date:'2026-08-20' };
  ok('دراسة صحيحة تمر', M().validateImagingStudy(good).ok);
  ok('يرفض بلا نوع', !M().validateImagingStudy({...good, modality:''}).ok);
  ok('يرفض بلا عين',  !M().validateImagingStudy({...good, eye:''}).ok);
  ok('يرفض تاريخاً مستقبلياً',
     !M().validateImagingStudy({...good, study_date:'2099-01-01'}).ok);
  ok('يرفض ملفاً أكبر من 25 م.بايت',
     !M().validateImagingStudy({...good, file:{size:30*1024*1024, type:'image/jpeg'}}).ok);
  ok('يرفض نوع ملف غير مدعوم',
     !M().validateImagingStudy({...good, file:{size:1000, type:'image/tiff'}}).ok);
  ok('يقبل PDF',
     M().validateImagingStudy({...good, file:{size:1000, type:'application/pdf'}}).ok);
  ok('يرفض تقريراً فارغاً', !M().validateImagingReport('   ').ok);

  // ── 2. الخدمة: القراءة والروابط ────────────────────────
  console.log('\x1b[1m2. الخدمة: القراءة والروابط الموقّعة\x1b[0m');
  const list = await SVC().listByPatient(PID, {});
  ok('يقرأ دراستين', list.length === 2, String(list.length));

  w.__net.signed = []; w.__net.rpc = [];
  const url = await SVC().signedUrl(list[0]);
  ok('يصدر رابطاً موقّعاً', /object\/sign/.test(url));
  ok('الرابط ليس عاماً', url.indexOf('/public/') === -1);
  ok('عمر الرابط 300 ثانية', w.__net.signed[0].ttl === 300, String(w.__net.signed[0].ttl));
  ok('الفتح يُسجَّل تدقيقاً', w.__net.rpc.length === 1 &&
     w.__net.rpc[0].args.p_action === 'read', JSON.stringify(w.__net.rpc[0] || {}));
  ok('التدقيق يحمل المريض والسجل',
     w.__net.rpc[0].args.p_patient_id === PID &&
     w.__net.rpc[0].args.p_record_id === list[0].id);

  w.__net.rpc = [];
  await SVC().signedUrl(list[0], { thumb:true, silent:true });
  ok('المصغّرة الصامتة لا تُسجَّل', w.__net.rpc.length === 0);
  ok('المصغّرة تستخدم مسار المصغّرة',
     w.__net.signed[w.__net.signed.length-1].path.indexOf('thumb.jpg') > -1);

  w.__net.rpc = [];
  const dl = await SVC().downloadUrl(list[0]);
  ok('رابط التنزيل يمرّ بالتوقيع', /object\/sign/.test(dl));
  ok('التنزيل يُسجَّل export', w.__net.rpc[0].args.p_action === 'export');
  ok('التنزيل يطلب اسم الملف',
     !!(w.__net.signed[w.__net.signed.length-1].opts || {}).download);

  const thumbs = await SVC().thumbUrls(list);
  ok('مصغّرة للصورة', !!thumbs[list[0].id]);
  ok('لا مصغّرة لـ PDF بلا مصغّرة', !thumbs[list[1].id]);

  // ── 3. الخدمة: الرفع ───────────────────────────────────
  console.log('\x1b[1m3. الخدمة: الرفع والتنظيف\x1b[0m');
  const file = { name:'fundus.jpg', type:'image/jpeg', size:1500000 };
  w.__net.uploads = [];
  const created = await SVC().upload({ patient_id:PID, modality:'uwf_fundus', eye:'OU',
    study_date:'2026-08-25', device:'Optos Daytona', technician:'م. سارة',
    clinical_indication:'متابعة اعتلال شبكية سكري', file:file });

  ok('الدراسة أُنشئت', !!created && !!created.id);
  ok('المزوّد supabase', created.storage_provider === 'supabase');
  ok('المسار بالشكل الصحيح',
     /^p\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/original\.jpg$/i.test(created.storage_path),
     created.storage_path);
  ok('المسار يبدأ بمعرّف المريض', created.storage_path.indexOf('p/'+PID+'/') === 0);
  ok('لا رابط عام في السجل', !/^https?:/i.test(created.storage_path));
  ok('الحالة بانتظار التقرير', created.status === 'pending_report');
  ok('البيانات السريرية محفوظة',
     created.device === 'Optos Daytona' &&
     created.clinical_indication === 'متابعة اعتلال شبكية سكري' &&
     created.technician === 'م. سارة');
  ok('اسم الملف وحجمه محفوظان',
     created.file_name === 'fundus.jpg' && created.size_bytes === 1500000);

  // الملف أولاً ثم الصف — وإن فشل الصف يُنظَّف الملف
  w.__net.uploads = []; w.__net.removed = []; w.__failInsert = true;
  let threw = false;
  try{ await SVC().upload({ patient_id:PID, modality:'oct', eye:'OD',
        study_date:'2026-08-25', file:{name:'x.png', type:'image/png', size:900} }); }
  catch(e){ threw = true; }
  w.__failInsert = false;
  ok('فشل السجل يرفع خطأ', threw);
  ok('فشل السجل يحذف الملف المرفوع', w.__net.removed.length === 1,
     JSON.stringify(w.__net.removed));

  w.__failUpload = true; threw = false;
  try{ await SVC().upload({ patient_id:PID, modality:'oct', eye:'OD',
        study_date:'2026-08-25', file:{name:'x.png', type:'image/png', size:900} }); }
  catch(e){ threw = true; }
  w.__failUpload = false;
  ok('فشل الرفع يرفع خطأ ولا يُنشئ سجلاً', threw);

  threw = false;
  try{ await SVC().upload({ patient_id:PID, modality:'oct', eye:'OD',
        study_date:'2026-08-25' }); }
  catch(e){ threw = true; }
  ok('رفع بلا ملف مرفوض', threw);

  // ── 4. الخدمة: التقرير والحذف ──────────────────────────
  console.log('\x1b[1m4. الخدمة: التقرير والحذف\x1b[0m');
  threw = false;
  try{ await SVC().saveReport(list[0].id, '   ', true); }catch(e){ threw = true; }
  ok('اعتماد بلا نص مرفوض', threw);

  const rep = await SVC().saveReport(list[0].id, 'سماكة بقعية 340 ميكرون.', true);
  ok('الاعتماد يحفظ النص', rep.doctor_report.indexOf('340') > -1);
  ok('الاعتماد يغيّر الحالة', rep.status === 'reported');

  const draft = await SVC().saveReport(list[0].id, 'مسودة أولية', false);
  ok('المسودة لا تعتمد', draft.status === 'pending_report');

  w.__net.writes = [];
  await SVC().remove(created.id, 'اختبار');
  const lastW = w.__net.writes[0];
  ok('الحذف ناعم لا حقيقي', lastW.op === 'update' && !!lastW.patch.deleted_at,
     JSON.stringify(lastW));
  ok('المحذوف يختفي من القائمة',
     (await SVC().listByPatient(PID, {})).filter(x => x.id === created.id).length === 0);

  w.__net.removed = []; w.__net.writes = [];
  await SVC().purge(list[0].id);
  ok('الحذف النهائي يمسح الملف والمصغّرة',
     w.__net.removed.length === 1 && w.__net.removed[0].length === 2,
     JSON.stringify(w.__net.removed));
  ok('الحذف النهائي يمسح الصف',
     w.__net.writes.filter(x => x.op === 'delete').length === 1);

  // ── 5. الواجهة ─────────────────────────────────────────
  console.log('\x1b[1m5. الواجهة داخل ملف المريض\x1b[0m');
  // اختبارات الخدمة أعلاه حذفت ما أنشأته. نعيد بذر دراسة نظيفة للواجهة.
  const FRESH = 'cccccccc-3333-4333-8333-cccccccccccc';
  w.__DB.medical_images.push({ id:FRESH, patient_id:PID, modality:'oct', eye:'OD',
    study_date:'2026-08-26', captured_on:'2026-08-26', device:'Zeiss Cirrus',
    technician:'م. هدى', clinical_indication:'وذمة بقعية',
    storage_provider:'supabase',
    storage_path:'p/'+PID+'/'+FRESH+'/original.jpg',
    thumbnail_path:'p/'+PID+'/'+FRESH+'/thumb.jpg',
    file_name:'oct.jpg', mime_type:'image/jpeg', size_bytes:1200000,
    doctor_report:null, status:'pending_report', deleted_at:null,
    created_at:'2026-08-26T09:00:00Z' });
  ok('رقم الإصدار P10', doc.body.textContent.indexOf('P10') > -1);
  click(byText('.tab','المرضى'));  await sleep(80);
  click($('#plist .prow'));        await sleep(160);
  const imgTab = byText('.tab','الصور');
  ok('تبويب الصور موجود', !!imgTab);
  click(imgTab); await sleep(200);

  ok('شبكة الصور ظهرت', !!$('.igrid'));
  ok('بطاقة لكل دراسة', $$('.icard').length === (await SVC().listByPatient(PID,{})).length,
     String($$('.icard').length));
  ok('اسم النوع بالعربية', $('#ptbody').textContent.indexOf('مجال الإبصار') > -1);
  ok('الحالة معروضة', $('#ptbody').textContent.indexOf('مُعتمدة') > -1);
  ok('زر الرفع موجود', !!doc.getElementById('newimg'));
  ok('الطبيب لا يرى الحذف النهائي', $$('[data-ipurge]').length === 0);

  // نموذج الرفع
  click(doc.getElementById('newimg')); await sleep(200);
  ok('نموذج الرفع فتح', !!doc.getElementById('i_file'));
  ok('حقل النوع فيه 11 خياراً + العنصر الفارغ',
     doc.getElementById('i_mod').options.length === 12,
     String(doc.getElementById('i_mod').options.length));
  ok('لا datalist في النموذج', $$('#mroot datalist').length === 0);
  const ids = $$('#mroot [id]').map(e => e.id);
  ok('لا معرّف مكرر', ids.length === new Set(ids).size);
  ok('حقل التاريخ مملوء باليوم', !!doc.getElementById('i_date').value);
  ok('المدخل يقبل PDF',
     doc.getElementById('i_file').getAttribute('accept').indexOf('pdf') > -1);

  click(doc.getElementById('save')); await sleep(120);
  ok('الحفظ بلا ملف يعطي تنبيهاً', !!$('.toast.bad'));
  ok('النموذج ما زال مفتوحاً', !!doc.getElementById('i_file'));
  click(doc.getElementById('mcancel')); await sleep(60);
  ok('الإلغاء يغلق النموذج', !doc.getElementById('i_file'));

  // العارض
  await sleep(60);
  const octCard = $$('.icard').filter(c => c.textContent.indexOf('مقطعية — OCT') > -1)[0];
  ok('بطاقة OCT موجودة', !!octCard);
  const oct = octCard.querySelector('[data-view]');
  click(oct); await sleep(220);
  ok('العارض فتح', !!$('.viewer'));
  ok('الصورة محمّلة برابط موقّع',
     ($('#vimg') || {}).src && /object\/sign/.test($('#vimg').src));
  ok('أزرار التكبير موجودة',
     !!doc.getElementById('vin') && !!doc.getElementById('vout') &&
     !!doc.getElementById('vfit') && !!doc.getElementById('vrot'));
  const t0 = $('#vimg').style.transform;
  click(doc.getElementById('vin')); await sleep(40);
  ok('التكبير يغيّر التحويل', $('#vimg').style.transform !== t0,
     $('#vimg').style.transform);
  ok('نسبة التكبير معروضة', doc.getElementById('vzl').textContent.indexOf('%') > -1);
  click(doc.getElementById('vrot')); await sleep(30);
  ok('التدوير يعمل', $('#vimg').style.transform.indexOf('rotate(90deg)') > -1);
  click(doc.getElementById('vfit')); await sleep(30);
  ok('ملء الشاشة يعيد 100%', doc.getElementById('vzl').textContent === '100%');
  click(doc.getElementById('vclose')); await sleep(60);
  ok('إغلاق العارض ينظّف الطبقة', !$('.viewer'));

  // PDF يفتح في تبويب لا في العارض
  const pdfCard = $$('.icard').filter(c => c.textContent.indexOf('مجال الإبصار') > -1)[0];
  opened = [];
  click(pdfCard.querySelector('[data-view]')); await sleep(200);
  ok('PDF لا يفتح داخل العارض', !$('.viewer'));
  ok('PDF يُفتح برابط موقّع', opened.length === 1 && /object\/sign/.test(opened[0]),
     JSON.stringify(opened));

  // التقرير من الواجهة
  click(octCard.querySelector('[data-irep]')); await sleep(200);
  ok('نموذج التقرير فتح', !!doc.getElementById('r_txt'));
  ok('فيه زر مسودة وزر اعتماد',
     !!doc.getElementById('draft') && !!doc.getElementById('save'));
  doc.getElementById('r_txt').value = 'لا وذمة. المتابعة بعد ثلاثة أشهر.';
  click(doc.getElementById('save')); await sleep(220);
  ok('الاعتماد يغلق النموذج ويحفظ', !doc.getElementById('r_txt'));

  // الحذف من الواجهة
  await sleep(120);
  const before = $$('.icard').length;
  click($$('.icard').filter(c => c.textContent.indexOf('مقطعية — OCT') > -1)[0]
        .querySelector('[data-idel]')); await sleep(260);
  ok('الحذف ينقص البطاقات', $$('.icard').length === before - 1,
     before + ' → ' + $$('.icard').length);

  // ── 6. المدير: الحذف النهائي يظهر له وحده ──────────────
  console.log('\x1b[1m6. صلاحية المدير\x1b[0m');
  const dom2 = makeDom('admin');
  const w2 = dom2.window, doc2 = w2.document;
  w2.confirm = () => true; w2.alert = () => {}; w2.open = () => null;
  const $a  = s2 => doc2.querySelector(s2);
  const $$a = s2 => Array.from(doc2.querySelectorAll(s2));
  const clickA = el => el.dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  const byTextA = (sel,t) => $$a(sel).filter(e => e.textContent.indexOf(t) > -1)[0];
  await sleep(200);
  clickA(byTextA('.tab','المرضى'));  await sleep(90);
  clickA($a('#plist .prow'));        await sleep(180);
  clickA(byTextA('.tab','الصور'));   await sleep(240);
  ok('شبكة الصور تظهر للمدير', !!$a('.igrid'));
  ok('المدير يرى زر الحذف النهائي', $$a('[data-ipurge]').length > 0,
     String($$a('[data-ipurge]').length));

  const nBefore = $$a('.icard').length;
  clickA($$a('[data-ipurge]')[0]); await sleep(300);
  ok('الحذف النهائي ينقص البطاقات', $$a('.icard').length === nBefore - 1,
     nBefore + ' → ' + $$a('.icard').length);
  ok('الحذف النهائي يمسح الملف من التخزين', w2.__net.removed.length > 0);
  ok('الحذف النهائي يمسح الصف',
     w2.__net.writes.filter(x => x.op === 'delete').length === 1);

  // ── 7. طلب الأشعة: الخدمة ──────────────────────────────
  console.log('\x1b[1m7. طلب الأشعة — الخدمة\x1b[0m');
  const ORD = () => SVC().orders;

  const badOrder = { patient_id:PID, ordered_on:'2026-08-26', items:[] };
  ok('طلب بلا بنود مرفوض', !M().validateImagingOrder(badOrder).ok);
  ok('بند بلا عين مرفوض', !M().validateImagingOrder(
     {...badOrder, items:[{modality:'oct'}]}).ok);
  ok('تاريخ مستقبلي مرفوض', !M().validateImagingOrder(
     {...badOrder, ordered_on:'2099-01-01', items:[{modality:'oct',eye:'OD'}]}).ok);
  ok('طلب صحيح يمر', M().validateImagingOrder(
     {...badOrder, items:[{modality:'oct',eye:'OD'}]}).ok);
  ok('ثلاث درجات استعجال', Object.keys(M().URGENCY).length === 3);

  const ord = await ORD().create({
    patient_id:PID, ordered_on:'2026-08-26', urgency:'urgent',
    clinical_indication:'وذمة بقعية', clinical_notes:'مقارنة بالفحص السابق',
    items:[ {modality:'oct', eye:'OD', notes:'مقاطع البقعة'},
            {modality:'ffa', eye:'OU'} ] });
  ok('الطلب أُنشئ', !!ord && !!ord.id);
  ok('رقم الطلب من القاعدة', /^IMG-\d{4}-\d{5}$/.test(ord.order_no||''), ord.order_no);
  ok('حالته «مطلوب»', ord.status === 'requested');
  ok('بندان محفوظان', (ord.items||[]).length === 2);
  ok('ترقيم البنود متسلسل',
     ord.items[0].seq === 1 && ord.items[1].seq === 2);

  let threwO = false;
  try{ await ORD().create({ patient_id:PID, ordered_on:'2026-08-26', items:[] }); }
  catch(e){ threwO = true; }
  ok('إنشاء بلا بنود مرفوض', threwO);

  // فشل البنود يحذف الترويسة حذفاً ناعماً فلا تبقى ورقة فارغة
  w.__failItems = true; threwO = false;
  const nOrdersBefore = w.__DB.imaging_orders.filter(o => !o.deleted_at).length;
  try{ await ORD().create({ patient_id:PID, ordered_on:'2026-08-26',
        items:[{modality:'oct', eye:'OD'}] }); }
  catch(e){ threwO = true; }
  w.__failItems = false;
  ok('فشل البنود يرفع خطأ', threwO);
  ok('فشل البنود لا يترك ترويسة حيّة',
     w.__DB.imaging_orders.filter(o => !o.deleted_at).length === nOrdersBefore,
     String(w.__DB.imaging_orders.filter(o => !o.deleted_at).length));

  const listed = await ORD().listByPatient(PID, 25);
  ok('الطلب يظهر في القائمة', listed.length === 1, String(listed.length));
  ok('البنود مرفقة بالقائمة', (listed[0].items||[]).length === 2);

  await ORD().setStatus(ord.id, 'completed');
  ok('تغيير الحالة يعمل',
     (await ORD().listByPatient(PID,25))[0].status === 'completed');
  let threwS = false;
  try{ await ORD().setStatus(ord.id, 'zzz'); }catch(e){ threwS = true; }
  ok('حالة غير معروفة مرفوضة', threwS);

  w.__net.rpc = [];
  await ORD().markPrinted(ord.id);
  ok('الطباعة تُسجَّل في القاعدة',
     w.__net.rpc.length === 1 && w.__net.rpc[0].name === 'mark_order_printed');
  ok('عدّاد الطباعة يزيد',
     (await ORD().listByPatient(PID,25))[0].printed_count === 1);

  await ORD().remove(ord.id);
  ok('حذف الطلب ناعم',
     (await ORD().listByPatient(PID,25)).length === 0 &&
     w.__DB.imaging_orders.filter(o => o.id === ord.id).length === 1);

  // ── 8. طلب الأشعة: الواجهة والطباعة ────────────────────
  console.log('\x1b[1m8. طلب الأشعة — الواجهة والطباعة\x1b[0m');
  const dom3 = makeDom('doctor');
  const w3 = dom3.window, doc3 = w3.document;
  w3.confirm = () => true; w3.alert = () => {};
  let printed = 0;
  w3.print = () => { printed++; };
  const $3  = q => doc3.querySelector(q);
  const $$3 = q => Array.from(doc3.querySelectorAll(q));
  const c3  = el => el.dispatchEvent(new w3.MouseEvent('click',{bubbles:true}));
  const t3  = (sel,t) => $$3(sel).filter(e => e.textContent.indexOf(t) > -1)[0];

  await sleep(200);
  c3(t3('.tab','المرضى'));  await sleep(90);
  c3($3('#plist .prow'));   await sleep(180);
  c3(t3('.tab','الصور'));   await sleep(240);

  ok('زر طلب الأشعة موجود', !!doc3.getElementById('neword'));
  c3(doc3.getElementById('neword')); await sleep(240);
  ok('نموذج الطلب فتح', !!doc3.getElementById('o_date'));
  ok('بند واحد ابتداءً', !!doc3.getElementById('ord0_mod') &&
     !doc3.getElementById('ord1_mod'));
  ok('حقل الاستعجال فيه ثلاث درجات',
     doc3.getElementById('o_urg').options.length === 4);

  c3(doc3.getElementById('addord')); await sleep(80);
  ok('إضافة بند ثانٍ', !!doc3.getElementById('ord1_mod'));
  const ids3 = $$3('#mroot [id]').map(e => e.id);
  ok('لا معرّف مكرر في نموذج الطلب', ids3.length === new Set(ids3).size);

  // حفظ بلا نوع مختار
  c3(doc3.getElementById('save')); await sleep(120);
  ok('الحفظ بلا دراسة يعطي تنبيهاً', !!$3('.toast.bad'));

  doc3.getElementById('ord0_mod').value = 'oct';
  doc3.getElementById('ord0_eye').value = 'OD';
  doc3.getElementById('ord1_mod').value = 'visual_field';
  doc3.getElementById('ord1_eye').value = 'OU';
  doc3.getElementById('o_urg').value = 'urgent';
  doc3.getElementById('o_ind').value = 'متابعة الجلوكوما';
  c3(doc3.getElementById('save')); await sleep(400);

  ok('الحفظ يغلق النموذج', !doc3.getElementById('o_date'));
  ok('الطباعة انطلقت بعد الحفظ', printed === 1, String(printed));

  const pr = doc3.getElementById('print').innerHTML;
  ok('الورقة تحمل رقم الطلب', /IMG-\d{4}-\d{5}/.test(pr));
  ok('الورقة تحمل اسم المريض', pr.indexOf('أحمد محمود') > -1);
  ok('الورقة تحمل كود المريض', pr.indexOf('P-0001') > -1);
  ok('الورقة تحمل الدراستين',
     pr.indexOf('مقطعية — OCT') > -1 && pr.indexOf('مجال الإبصار') > -1);
  ok('الورقة تحمل العين لكل بند',
     pr.indexOf('اليمنى') > -1 && pr.indexOf('كلتا العينين') > -1);
  ok('الورقة تُبرز الاستعجال', pr.indexOf('عاجل') > -1);
  ok('الورقة تحمل الدواعي', pr.indexOf('متابعة الجلوكوما') > -1);
  ok('الورقة فيها سطر توقيع', pr.indexOf('توقيع الطبيب') > -1);
  ok('الطباعة سُجّلت في القاعدة',
     w3.__net.rpc.filter(r => r.name === 'mark_order_printed').length === 1);

  await sleep(220);
  ok('الطلب ظهر في التبويب', $$3('[data-oprint]').length === 1,
     String($$3('[data-oprint]').length));
  ok('بطاقة الطلب تعرض الحالة', $3('#ptbody').textContent.indexOf('مطلوب') > -1);

  c3($$3('[data-oprint]')[0]); await sleep(300);
  ok('إعادة الطباعة تعمل', printed === 2, String(printed));
  ok('العدّاد يظهر للطبيب',
     $3('#ptbody').textContent.indexOf('طُبع') > -1);

  c3($$3('[data-odone]')[0]); await sleep(300);
  ok('تسجيل التنفيذ يغيّر الحالة',
     $3('#ptbody').textContent.indexOf('تم') > -1);

  c3($$3('[data-odel]')[0]); await sleep(300);
  ok('حذف الطلب يزيله من الشاشة', $$3('[data-oprint]').length === 0);

  console.log('\n' + '─'.repeat(58));
  if(fail === 0) console.log('\x1b[32m✓ نجحت كل اختبارات المرحلة 10 — ' + pass + ' تأكيداً\x1b[0m');
  else { console.log('\x1b[31m✗ فشل ' + fail + '\x1b[0m / نجح ' + pass);
         fails.forEach(f => console.log('  ✗ ' + f)); }
  console.log('─'.repeat(58));
  process.exit(fail === 0 ? 0 : 1);
})();
