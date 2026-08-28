/**
 * I APP — خدمة التصوير التشخيصي (svc-imaging.js) — المرحلة 10
 *
 * المكان الوحيد الذي يعرف اسم الحاوية ومسارات الملفات وكيفية إصدار
 * الروابط الموقّعة. الشاشات تنادي هذه الدوال ولا تعرف شيئاً عن Storage.
 *
 * ثلاث قواعد لا تُخالَف:
 *   ١. لا رابط عام لأي صورة طبية. الحاوية private وكل فتح يمرّ برابط
 *      موقّع عمره خمس دقائق. لو ظهر getPublicUrl في هذا الملف فهو خطأ.
 *   ٢. الطبيب يحذف حذفاً ناعماً. الملف لا يُمحى إلا بيد المدير.
 *   ٣. كل فتح وتنزيل يُسجَّل في iapp.audit_logs عبر iapp.log_event.
 *      الكتابة في سجل التدقيق ليست اختيارية ولا تُلغى من الواجهة.
 *
 * مسار الكائن:  p/<patient_id>/<study_id>/original.<ext>
 *               p/<patient_id>/<study_id>/thumb.jpg
 * الشكل مفروض بقيد في القاعدة وبسياسة على storage.objects معاً.
 */
(function (global) {
  'use strict';
  var IAPP = global.IAPP, M = IAPP.models;

  var BUCKET  = 'medical-imaging';
  var URL_TTL = 300;   // ثانية — عمر الرابط الموقّع

  function sb(){ return IAPP.client(); }
  function store(){ return sb().storage.from(BUCKET); }

  function err(e, ctx){
    var m = (e && e.message) || String(e || '');
    if(/imaging_future_date/i.test(m))      return new Error('تاريخ الدراسة في المستقبل');
    if(/imaging_report_required/i.test(m))  return new Error('لا يمكن اعتماد دراسة بلا تقرير');
    if(/patient_mismatch/i.test(m))         return new Error('الزيارة تخص مريضاً آخر');
    if(/chk_img_mime/i.test(m))             return new Error('نوع الملف غير مدعوم');
    if(/chk_img_size_max|exceeded the maximum allowed size|Payload too large/i.test(m))
                                            return new Error('حجم الملف أكبر من 25 م.بايت');
    if(/chk_img_path_shape|chk_img_no_public_url/i.test(m))
                                            return new Error('مسار تخزين غير صالح');
    if(/uq_image_storage|duplicate key/i.test(m)) return new Error('هذا الملف مرفوع بالفعل');
    if(/mime type .* is not supported/i.test(m))  return new Error('نوع الملف غير مدعوم');
    if(/row-level security|permission denied|Unauthorized|not authorized/i.test(m))
      return new Error('لا تملك صلاحية ' + (ctx || 'هذه العملية'));
    if(/Bucket not found/i.test(m))
      return new Error('حاوية الصور غير موجودة — شغّل 102_imaging_storage.sql');
    if(/JWT|not authenticated/i.test(m))    return new Error('انتهت الجلسة — سجّل الدخول مجدداً');
    if(/Failed to fetch|NetworkError/i.test(m)) return new Error('انقطع الاتصال أثناء الرفع');
    return new Error(m);
  }

  function uuid(){
    if(global.crypto && global.crypto.randomUUID) return global.crypto.randomUUID();
    var b = new Array(36), hex = '0123456789abcdef';
    for(var i=0;i<36;i++) b[i] = hex[Math.floor(Math.random()*16)];
    b[8]=b[13]=b[18]=b[23]='-'; b[14]='4';
    b[19] = hex[(parseInt(b[19],16) & 0x3) | 0x8];
    return b.join('');
  }

  function extOf(file){
    var t = String(file && file.type || '').toLowerCase();
    if(t === 'application/pdf') return 'pdf';
    if(t === 'image/png')  return 'png';
    if(t === 'image/webp') return 'webp';
    if(t === 'image/jpeg') return 'jpg';
    var n = String(file && file.name || '');
    var m = n.match(/\.([A-Za-z0-9]{2,5})$/);
    return m ? m[1].toLowerCase() : 'bin';
  }

  function isPdf(x){
    return String(x && (x.mime_type || x.type) || '').toLowerCase() === 'application/pdf';
  }

  /**
   * مصغّرة تُبنى في المتصفح قبل الرفع.
   * الغرض ليس الجمال: قائمة فيها عشرون دراسة UWF بحجمها الأصلي تعني
   * عشرات الميجابايت على خط العيادة. المصغّرة ~40 ك.بايت.
   * تفشل بهدوء: لا مصغّرة أهون من رفع لا يكتمل.
   */
  async function makeThumb(file, maxSide){
    maxSide = maxSide || 320;
    if(isPdf(file)) return null;
    if(typeof global.createImageBitmap !== 'function' || !global.document) return null;
    try{
      var bmp = await global.createImageBitmap(file);
      var scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
      var w = Math.max(1, Math.round(bmp.width * scale));
      var h = Math.max(1, Math.round(bmp.height * scale));
      var cv = global.document.createElement('canvas');
      cv.width = w; cv.height = h;
      var cx = cv.getContext('2d');
      if(!cx) return null;
      cx.drawImage(bmp, 0, 0, w, h);
      if(bmp.close) bmp.close();
      var blob = await new Promise(function(res){
        if(cv.toBlob) cv.toBlob(res, 'image/jpeg', 0.72); else res(null);
      });
      return blob ? { blob: blob, width: w, height: h,
                      srcWidth: bmp.width, srcHeight: bmp.height } : null;
    }catch(e){ return null; }
  }

  /** أبعاد الأصل — تُقرأ حتى لو تعذّرت المصغّرة */
  async function dimsOf(file){
    if(isPdf(file)) return {};
    if(typeof global.createImageBitmap !== 'function') return {};
    try{
      var bmp = await global.createImageBitmap(file);
      var d = { width: bmp.width, height: bmp.height };
      if(bmp.close) bmp.close();
      return d;
    }catch(e){ return {}; }
  }

  /** التدقيق لا يوقف العمل: فشل التسجيل يُسجَّل في الطرفية ولا يُفشل الإجراء */
  async function audit(action, study, extra){
    try{
      await sb().rpc('log_event', {
        p_resource:   'medical_images',
        p_action:     action,
        p_record_id:  study && study.id || null,
        p_patient_id: study && study.patient_id || null,
        p_outcome:    'allow',
        p_reason:     null,
        p_meta:       extra || null
      });
    }catch(e){ if(global.console) console.warn('audit ' + action + ':', e.message || e); }
  }

  var COLS = 'id,patient_id,visit_id,examination_id,modality,eye,study_date,captured_on,'
           + 'device,technician,clinical_indication,storage_provider,storage_path,'
           + 'thumbnail_path,legacy_url,file_name,mime_type,size_bytes,width,height,'
           + 'doctor_report,reported_by,reported_at,status,notes,created_at,created_by';

  var imaging = {

    BUCKET: BUCKET,

    // ══════════════════════════════════════════════════════
    // القراءة
    // ══════════════════════════════════════════════════════

    async listByPatient(pid, opts){
      opts = opts || {};
      var q = sb().from('medical_images').select(COLS)
              .eq('patient_id', pid).is('deleted_at', null);
      if(opts.modality) q = q.eq('modality', opts.modality);
      if(opts.eye)      q = q.eq('eye', opts.eye);
      if(opts.visitId)  q = q.eq('visit_id', opts.visitId);
      if(opts.status)   q = q.eq('status', opts.status);
      q = q.order('study_date', {ascending:false})
           .order('created_at', {ascending:false})
           .limit(opts.limit || 60);
      var r = await q;
      if(r.error) throw err(r.error, 'قراءة الصور');
      return r.data || [];
    },

    async get(id){
      var r = await sb().from('medical_images').select(COLS)
              .eq('id', id).is('deleted_at', null).maybeSingle();
      if(r.error) throw err(r.error, 'قراءة الدراسة');
      if(!r.data) throw new Error('الدراسة غير موجودة');
      return r.data;
    },

    /** الدراسات التي تنتظر تقرير الطبيب — للوحة الرئيسية لاحقاً */
    async pending(limit){
      var r = await sb().from('medical_images').select(COLS)
              .is('deleted_at', null).neq('status', 'reported')
              .order('study_date', {ascending:false}).limit(limit || 30);
      if(r.error) throw err(r.error, 'قراءة الدراسات المعلّقة');
      var rows = r.data || [];
      if(!rows.length) return rows;

      // الأسماء تُقرأ من v_patient_clinical: جدول patients لا يمنح SELECT
      var ids = rows.map(function(x){ return x.patient_id; })
                    .filter(function(v,i,a){ return v && a.indexOf(v)===i; });
      var p = await sb().from('v_patient_clinical')
              .select('id,full_name,patient_code,phone').in('id', ids);
      var by = {};
      (p.data || []).forEach(function(x){ by[x.id] = x; });
      rows.forEach(function(x){
        var d = by[x.patient_id] || {};
        x._name = d.full_name; x._code = d.patient_code; x._phone = d.phone;
      });
      return rows;
    },

    async countByPatient(pid){
      var r = await sb().from('medical_images')
              .select('id', {count:'exact', head:true})
              .eq('patient_id', pid).is('deleted_at', null);
      if(r.error) return 0;
      return r.count || 0;
    },

    // ══════════════════════════════════════════════════════
    // الروابط الموقّعة — لا رابط عام أبداً
    // ══════════════════════════════════════════════════════

    /**
     * رابط عرض قصير العمر.
     * thumb=true يعطي المصغّرة إن وُجدت وإلا يرجع للأصل.
     * silent=true للمصغّرات في الشبكة: عشرون مصغّرة لا تعني عشرين
     * سطر تدقيق «فتح ملف» — التدقيق للفتح الحقيقي.
     */
    async signedUrl(study, o){
      o = o || {};
      var path = o.thumb ? (study.thumbnail_path || study.storage_path) : study.storage_path;
      if(!path) throw new Error('لا ملف مخزَّن لهذه الدراسة');
      if(/^https?:\/\//i.test(path)){
        // صف قديم من Cloudinary — يُعرض كما هو ولا يُرفع مثله بعد اليوم
        return path;
      }
      var opts = {};
      if(o.download) opts.download = o.download === true
        ? (study.file_name || 'study') : o.download;
      var r = await store().createSignedUrl(path, o.ttl || URL_TTL, opts);
      if(r.error) throw err(r.error, 'فتح الصورة');
      if(!o.silent) await audit(o.download ? 'export' : 'read', study,
        { path: path, thumb: !!o.thumb });
      return r.data.signedUrl;
    },

    /** روابط المصغّرات دفعة واحدة — نداء شبكة واحد للشبكة كلها */
    async thumbUrls(list, ttl){
      var out = {};
      var paths = [], map = [];
      (list || []).forEach(function(s){
        var p = s.thumbnail_path || s.storage_path;
        if(!p) return;
        if(/^https?:\/\//i.test(p)){ out[s.id] = p; return; }
        if(isPdf(s) && !s.thumbnail_path) return;    // PDF بلا مصغّرة: أيقونة
        paths.push(p); map.push(s.id);
      });
      if(!paths.length) return out;
      try{
        var r = await store().createSignedUrls(paths, ttl || URL_TTL);
        if(r.error) return out;
        (r.data || []).forEach(function(x, i){
          if(x && x.signedUrl && !x.error) out[map[i]] = x.signedUrl;
        });
      }catch(e){ /* الشبكة تُعرض بأيقونات */ }
      return out;
    },

    async downloadUrl(study){
      return imaging.signedUrl(study, {
        download: study.file_name || ('study-' + (study.id || '').slice(0,8)),
        ttl: 120
      });
    },

    // ══════════════════════════════════════════════════════
    // الرفع
    // ══════════════════════════════════════════════════════

    /**
     * الترتيب مقصود: الملف أولاً ثم الصف.
     * لو فشل إدراج الصف نحذف ما رُفع، فلا يبقى ملف يتيم بلا سجل.
     * العكس (الصف أولاً) يترك سجلاً يشير إلى ملف غير موجود، وهو
     * أسوأ الاحتمالين في سجل طبي.
     */
    async upload(o){
      var chk = M.validateImagingStudy(o);
      if(!chk.ok) throw new Error(chk.errors[0]);
      if(!o.file) throw new Error('اختر ملفاً');

      var id      = uuid();
      var base    = 'p/' + o.patient_id + '/' + id + '/';
      var path    = base + 'original.' + extOf(o.file);
      var tPath   = base + 'thumb.jpg';
      var uploaded = [];

      if(o.onProgress) o.onProgress('جارٍ تجهيز الصورة…');
      var thumb = await makeThumb(o.file);
      var dims  = thumb ? { width: thumb.srcWidth, height: thumb.srcHeight }
                        : await dimsOf(o.file);

      try{
        if(o.onProgress) o.onProgress('جارٍ رفع الملف…');
        var up = await store().upload(path, o.file, {
          contentType: o.file.type || 'application/octet-stream',
          cacheControl: '3600', upsert: false
        });
        if(up.error) throw up.error;
        uploaded.push(path);

        if(thumb){
          if(o.onProgress) o.onProgress('جارٍ رفع المصغّرة…');
          var ut = await store().upload(tPath, thumb.blob, {
            contentType: 'image/jpeg', cacheControl: '3600', upsert: true
          });
          if(!ut.error) uploaded.push(tPath); else thumb = null;
        }

        if(o.onProgress) o.onProgress('جارٍ حفظ السجل…');
        var row = {
          id: id,
          patient_id: o.patient_id,
          visit_id: o.visit_id || null,
          examination_id: o.examination_id || null,
          modality: o.modality,
          eye: o.eye,
          study_date: o.study_date,
          device: M.str(o.device) || null,
          technician: M.str(o.technician) || null,
          clinical_indication: M.str(o.clinical_indication) || null,
          storage_provider: 'supabase',
          storage_path: path,
          thumbnail_path: thumb ? tPath : null,
          file_name: M.str(o.file.name) || ('study.' + extOf(o.file)),
          mime_type: o.file.type || null,
          size_bytes: o.file.size || null,
          width: dims.width || null,
          height: dims.height || null,
          notes: M.str(o.notes) || null,
          status: 'pending_report'
        };
        var r = await sb().from('medical_images').insert(row).select(COLS).single();
        if(r.error) throw r.error;
        return r.data;

      }catch(e){
        // تنظيف ما رُفع — وإلا بقيت ملفات لا يعرفها أحد داخل الحاوية
        if(uploaded.length){
          try{ await store().remove(uploaded); }catch(e2){}
        }
        throw err(e, 'رفع الصورة');
      }
    },

    // ══════════════════════════════════════════════════════
    // التقرير والحالة
    // ══════════════════════════════════════════════════════

    /** finalize=true يعني اعتماد التقرير — والقاعدة ترفض اعتماداً بلا نص */
    async saveReport(id, text, finalize){
      if(finalize){
        var chk = M.validateImagingReport(text);
        if(!chk.ok) throw new Error(chk.errors[0]);
      }
      var patch = { doctor_report: M.str(text) || null };
      if(finalize){
        patch.status = 'reported';
        patch.reported_at = new Date().toISOString();
      }else if(M.str(text)){
        patch.status = 'pending_report';
      }
      var r = await sb().from('medical_images').update(patch)
              .eq('id', id).select(COLS).single();
      if(r.error) throw err(r.error, 'حفظ التقرير');
      return r.data;
    },

    async setStatus(id, status){
      if(!M.IMAGING_STATUS[status]) throw new Error('حالة غير معروفة');
      var r = await sb().from('medical_images').update({status:status})
              .eq('id', id).select(COLS).single();
      if(r.error) throw err(r.error, 'تعديل الحالة');
      return r.data;
    },

    async update(id, o){
      var patch = {};
      ['modality','eye','study_date','device','technician',
       'clinical_indication','notes','visit_id'].forEach(function(k){
        if(o[k] !== undefined) patch[k] = (o[k] === '' ? null : o[k]);
      });
      var r = await sb().from('medical_images').update(patch)
              .eq('id', id).select(COLS).single();
      if(r.error) throw err(r.error, 'تعديل الدراسة');
      return r.data;
    },

    // ══════════════════════════════════════════════════════
    // الحذف
    // ══════════════════════════════════════════════════════

    /**
     * حذف ناعم. الصف يبقى، الملف يبقى، والزناد يسجّله حذفاً في التدقيق.
     * سياسة DELETE على الجدول تمنع الطبيب من الحذف الحقيقي أصلاً،
     * فحتى لو نودي غير هذا المسار فالقاعدة ترفض.
     */
    async remove(id, reason){
      var r = await sb().from('medical_images')
              .update({ deleted_at: new Date().toISOString() })
              .eq('id', id).select('id,patient_id').single();
      if(r.error) throw err(r.error, 'حذف الدراسة');
      if(reason) await audit('delete', r.data, { reason: reason, mode:'soft' });
      return true;
    },

    async restore(id){
      var r = await sb().from('medical_images').update({deleted_at:null})
              .eq('id', id).select('id,patient_id').single();
      if(r.error) throw err(r.error, 'استعادة الدراسة');
      return true;
    },

    /** حذف نهائي — للمدير وحده. الملف والمصغّرة والصف. لا تراجع. */
    async purge(id){
      var g = await sb().from('medical_images')
              .select('id,patient_id,storage_path,thumbnail_path,storage_provider')
              .eq('id', id).maybeSingle();
      if(g.error) throw err(g.error, 'الحذف النهائي');
      if(!g.data) throw new Error('الدراسة غير موجودة');

      await audit('delete', g.data, { mode:'purge', path:g.data.storage_path });

      if(g.data.storage_provider === 'supabase'){
        var paths = [g.data.storage_path];
        if(g.data.thumbnail_path) paths.push(g.data.thumbnail_path);
        var rm = await store().remove(paths);
        if(rm.error) throw err(rm.error, 'حذف الملف');
      }
      var d = await sb().from('medical_images').delete().eq('id', id);
      if(d.error) throw err(d.error, 'الحذف النهائي');
      return true;
    },

    // أدوات مكشوفة للاختبار وللشاشات
    _makeThumb: makeThumb,
    _uuid: uuid,
    _ext: extOf,
    isPdf: isPdf,
    audit: audit
  };

  IAPP.svc = IAPP.svc || {};
  IAPP.svc.imaging = imaging;
})(window);
