/**
 * I APP — خدمة المساعد الذكي (svc-ai.js) — المرحلة 11
 *
 * الحدود التي يحرسها هذا الملف:
 *   ١. لا مفتاح ذكاء اصطناعي هنا ولا اسم مزوّد ولا رابط API. النداء
 *      الوحيد للخارج يمرّ عبر Edge Function باسم ai-analyze، والمفتاح
 *      يعيش في أسرار المشروع. أي مفتاح مزوّد يظهر في ملف واجهة فهو خطأ
 *      أمني لا خطأ أسلوب.
 *   ٢. هذا الملف لا يكتب في final_report إلا عبر ai_to_final_report،
 *      والقاعدة تتحقق من وجود مراجعة طبيب قبل القبول. لو نودي بغير
 *      ذلك تُرفع رسالة «لم يُراجَع بعد» من القاعدة لا من هنا.
 *   ٣. الشاشات لا تعرف أسماء الجداول. كل شيء عبر هذه الدوال.
 */
(function (global) {
  'use strict';
  var IAPP = global.IAPP, M = IAPP.models;

  var FN = 'ai-analyze';

  function sb(){ return IAPP.client(); }

  /** رسائل الخطأ التي ترفعها القاعدة والدالة — مترجمة كما هي مفهومة للطبيب */
  function err(e, ctx){
    var m = (e && e.message) || String(e || '');
    if(/ai_key_missing/i.test(m))        return new Error('مفتاح المزوّد غير مضبوط على الخادم — راجع أسرار المشروع');
    if(/quota_exceeded/i.test(m))        return new Error('تجاوزت حدّ التحليلات في هذه الساعة — انتظر قليلاً');
    if(/role_not_allowed/i.test(m))      return new Error('التحليل متاح للطبيب والمدير فقط');
    if(/image_not_found|image_read_failed/i.test(m)) return new Error('الصورة غير متاحة لك');
    if(/modality_not_supported/i.test(m))return new Error('هذا النوع من التصوير غير مدعوم في التحليل');
    if(/file_too_large/i.test(m))        return new Error('الملف أكبر من أن يُرسل للتحليل');
    if(/unsupported_mime/i.test(m))      return new Error('نوع الملف غير مدعوم للتحليل');
    if(/storage_denied|storage_fetch_failed/i.test(m)) return new Error('تعذّر فتح ملف الدراسة');
    if(/bad_model_json/i.test(m))        return new Error('ردّ النموذج غير مقروء — أعد التوليد');
    if(/provider_429/i.test(m))          return new Error('المزوّد مشغول — أعد المحاولة بعد قليل');
    if(/provider_401|provider_403/i.test(m)) return new Error('مفتاح المزوّد مرفوض — راجع الإعدادات');
    if(/provider_5\d\d/i.test(m))        return new Error('عطل مؤقت لدى المزوّد — أعد المحاولة');
    if(/ai_not_reviewed/i.test(m))       return new Error('لا يمكن استعمال التحليل قبل مراجعته');
    if(/ai_review_not_approved/i.test(m))return new Error('التحليل مرفوض — لا يدخل التقرير النهائي');
    if(/ai_review_on_failed_run/i.test(m))return new Error('لا تُراجَع محاولة فاشلة');
    if(/final_report_cannot_be_ai_sourced|final_report_needs_human_author/i.test(m))
                                         return new Error('التقرير النهائي يجب أن يكون بتأليف الطبيب');
    if(/final_report_empty|chk_final_text/i.test(m)) return new Error('نص التقرير قصير جداً للاعتماد');
    if(/chk_rev_edit_has_text/i.test(m)) return new Error('اكتب النص المعدَّل');
    if(/chk_rev_reject_has_reason/i.test(m)) return new Error('اذكر سبب الرفض');
    if(/ai_unknown_category/i.test(m))   return new Error('بند غير معروف في نتيجة التحليل');
    if(/uq_ai_active_run|duplicate key/i.test(m)) return new Error('يوجد تحليل حالي لهذه الصورة');
    if(/row-level security|permission denied|not authorized/i.test(m))
      return new Error('لا تملك صلاحية ' + (ctx || 'هذه العملية'));
    if(/JWT|not authenticated|no_session/i.test(m)) return new Error('انتهت الجلسة — سجّل الدخول مجدداً');
    if(/Failed to fetch|NetworkError|Failed to send/i.test(m)) return new Error('انقطع الاتصال بالخادم');
    if(/Function not found|404/i.test(m)) return new Error('دالة التحليل غير منشورة على الخادم');
    return new Error(m);
  }

  /**
   * supabase-js يخفي جسم الخطأ داخل context. بدون فتحه تصير كل
   * أعطال الدالة رسالة واحدة مبهمة، فيضيع الفرق بين «لا مفتاح»
   * و«تجاوزت الحدّ» و«الملف كبير».
   */
  async function detail(e){
    try{
      if(e && e.context && typeof e.context.json === 'function'){
        var b = await e.context.json();
        if(b && (b.detail || b.error)) return String(b.detail || b.error);
      }
    }catch(x){}
    return (e && e.message) || String(e || '');
  }

  var A_COLS = 'id,image_id,patient_id,visit_id,modality,eye,status,attempt,parent_id,'
             + 'provider,model,prompt_version,latency_ms,tokens_in,tokens_out,'
             + 'error_code,error_message,raw_response,created_at,finished_at,created_by';

  var F_COLS = 'id,analysis_id,modality,category,eye,seq,present,value_text,value_num,'
             + 'unit,severity,confidence,detail';

  var R_COLS = 'id,analysis_id,image_id,patient_id,action,edited_impression,'
             + 'edited_findings,reject_reason,comment,reviewer_id,reviewed_at,superseded_at';

  var FR_COLS = 'id,image_id,patient_id,visit_id,report_text,impression,findings,status,'
              + 'source,ai_assisted,ai_analysis_id,authored_by,finalized_at,created_at,updated_at';

  var _cat = {};   // ذاكرة مؤقتة للفهرس — لا يتغيّر أثناء الجلسة

  var ai = {

    FN: FN,

    // ══════════════════════════════════════════════════════
    // الفهرس المرجعي
    // ══════════════════════════════════════════════════════

    /** بنود الفحص كما تعرّفها القاعدة — لا قائمة مكتوبة في الواجهة */
    async catalog(modality){
      if(_cat[modality]) return _cat[modality];
      var r = await sb().from('ai_finding_catalog')
        .select('modality,category,seq,label_ar,label_en,value_kind,unit')
        .eq('modality', modality).eq('is_active', true)
        .order('seq', {ascending:true});
      if(r.error) throw err(r.error, 'قراءة بنود التحليل');
      _cat[modality] = r.data || [];
      return _cat[modality];
    },

    /** هل هذا الفحص مدعوم أصلاً؟ يُستعمل لإظهار الزر أو إخفائه */
    async supported(modality){
      try{ return (await ai.catalog(modality)).length > 0; }
      catch(e){ return false; }
    },

    // ══════════════════════════════════════════════════════
    // التشغيل
    // ══════════════════════════════════════════════════════

    /**
     * لا يُرسَل إلا معرّف الصورة. الفحص والمريض والمسار تُقرأ في
     * الخادم من القاعدة — أي حقل يرسله المتصفح عن الصورة يُتجاهل،
     * وإلا صار بالإمكان تحليل صورة مريض باسم مريض آخر.
     */
    async analyze(imageId, o){
      o = o || {};
      if(!imageId) throw new Error('لا توجد صورة');
      var r;
      try{
        r = await sb().functions.invoke(FN, {
          body: { image_id: imageId, force: !!o.force }
        });
      }catch(e){ throw err(e, 'التحليل'); }
      if(r.error) throw err(new Error(await detail(r.error)), 'التحليل');
      if(r.data && r.data.error) throw err(new Error(r.data.detail || r.data.error), 'التحليل');
      return r.data;
    },

    /** إعادة التوليد: تشغيل جديد. السابق يُحفظ ويُنزل إلى superseded */
    async regenerate(imageId){
      return ai.analyze(imageId, { force:true });
    },

    async quotaUsed(hours){
      var r = await sb().rpc('ai_quota_used', { p_hours: hours || 1 });
      if(r.error) return 0;
      return Number(r.data || 0);
    },

    // ══════════════════════════════════════════════════════
    // القراءة
    // ══════════════════════════════════════════════════════

    /** آخر تشغيل لهذه الصورة أياً كانت حالته — قد يكون فاشلاً وهذا مقصود */
    async latest(imageId){
      var r = await sb().from('v_ai_latest').select('*')
        .eq('image_id', imageId)
        .order('created_at', {ascending:false}).limit(1);
      if(r.error) throw err(r.error, 'قراءة التحليل');
      return (r.data && r.data[0]) || null;
    },

    /** خريطة image_id → آخر تحليل، لرسم الشارات على الشبكة بنداء واحد */
    async latestFor(imageIds){
      var out = {};
      var ids = (imageIds || []).filter(Boolean);
      if(!ids.length) return out;
      var r = await sb().from('v_ai_latest').select('*')
        .in('image_id', ids).order('created_at', {ascending:false});
      if(r.error) return out;
      (r.data || []).forEach(function(x){ if(!out[x.image_id]) out[x.image_id] = x; });
      return out;
    },

    async history(imageId, limit){
      var r = await sb().from('ai_analysis').select(A_COLS)
        .eq('image_id', imageId).is('deleted_at', null)
        .order('created_at', {ascending:false}).limit(limit || 10);
      if(r.error) throw err(r.error, 'قراءة سجل التحليلات');
      return r.data || [];
    },

    async findings(analysisId){
      var r = await sb().from('ai_findings').select(F_COLS)
        .eq('analysis_id', analysisId).order('seq', {ascending:true});
      if(r.error) throw err(r.error, 'قراءة الموجودات');
      return r.data || [];
    },

    async impression(analysisId){
      var r = await sb().from('ai_impression')
        .select('id,analysis_id,impression_text,differentials,recommendations,'
              + 'urgency,confidence,limitations,is_final,created_at')
        .eq('analysis_id', analysisId).maybeSingle();
      if(r.error) throw err(r.error, 'قراءة الانطباع');
      return r.data || null;
    },

    async review(analysisId){
      var r = await sb().from('doctor_review').select(R_COLS)
        .eq('analysis_id', analysisId).is('superseded_at', null).maybeSingle();
      if(r.error) throw err(r.error, 'قراءة المراجعة');
      return r.data || null;
    },

    /** كل ما تحتاجه لوحة التحليل في نداء منطقي واحد */
    async bundle(analysisId){
      var a = await sb().from('ai_analysis').select(A_COLS)
              .eq('id', analysisId).maybeSingle();
      if(a.error) throw err(a.error, 'قراءة التحليل');
      if(!a.data) throw new Error('التحليل غير موجود');
      var parts = await Promise.all([
        ai.findings(analysisId), ai.impression(analysisId), ai.review(analysisId)
      ]);
      return {
        analysis: a.data,
        findings: parts[0],
        impression: parts[1],
        review: parts[2]
      };
    },

    // ══════════════════════════════════════════════════════
    // قرار الطبيب
    // ══════════════════════════════════════════════════════

    /**
     * أربعة قرارات لا خامس لها. القرار السابق لا يُمحى بل يُؤرشف،
     * فيبقى في السجل الطبي أن الطبيب قبل ثم عدّل رأيه.
     * image_id و patient_id لا يُرسلان: الزناد يشتقّهما من التحليل.
     */
    async decide(analysisId, action, o){
      o = o || {};
      var chk = M.validateAiReview(action, o);
      if(!chk.ok) throw new Error(chk.errors[0]);

      var row = {
        analysis_id: analysisId,
        action: action,
        comment: M.str(o.comment) || null
      };
      if(action === 'edit'){
        row.edited_impression = M.str(o.text);
        if(o.findings) row.edited_findings = o.findings;
      }
      if(action === 'reject') row.reject_reason = M.str(o.reason);

      var r = await sb().from('doctor_review').insert(row).select(R_COLS).single();
      if(r.error) throw err(r.error, 'تسجيل القرار');
      return r.data;
    },

    accept:  function(id, o){ return ai.decide(id, 'accept', o); },
    reject:  function(id, o){ return ai.decide(id, 'reject', o); },
    edit:    function(id, o){ return ai.decide(id, 'edit',   o); },

    /**
     * إعادة التوليد قرار أيضاً: يُسجَّل أولاً ثم يُشغَّل التحليل.
     * لو أُعيد التوليد بلا تسجيل ضاعت المعلومة الأهم — أن الطبيب
     * لم يقتنع بالنتيجة الأولى.
     */
    async redo(analysisId, imageId, o){
      await ai.decide(analysisId, 'regenerate', o || {});
      return ai.regenerate(imageId);
    },

    // ══════════════════════════════════════════════════════
    // التقرير النهائي — بشري التأليف حصراً
    // ══════════════════════════════════════════════════════
    final: {

      async get(imageId){
        var r = await sb().from('final_report').select(FR_COLS)
          .eq('image_id', imageId).is('deleted_at', null).maybeSingle();
        if(r.error) throw err(r.error, 'قراءة التقرير');
        return r.data || null;
      },

      async listByPatient(pid, limit){
        var r = await sb().from('final_report').select(FR_COLS)
          .eq('patient_id', pid).is('deleted_at', null)
          .order('created_at', {ascending:false}).limit(limit || 30);
        if(r.error) throw err(r.error, 'قراءة التقارير');
        return r.data || [];
      },

      /**
       * نقل الانطباع المُراجَع إلى التقرير. الدالة في القاعدة تتحقق
       * من المراجعة مرة أخرى — فالحماية لا تعتمد على أن هذا الملف
       * نادى الدالة الصحيحة.
       */
      async fromAi(analysisId, text, finalize){
        var r = await sb().rpc('ai_to_final_report', {
          p_analysis_id: analysisId,
          p_text: M.str(text) || null,
          p_finalize: !!finalize
        });
        if(r.error) throw err(r.error, 'حفظ التقرير النهائي');
        return Array.isArray(r.data) ? r.data[0] : r.data;
      },

      /**
       * تقرير بلا ذكاء اصطناعي — الطبيب يكتبه من الصفر.
       * قراءة ثم إدراج أو تحديث، لا upsert: الفهرس الفريد على الصور
       * جزئي (deleted_at is null)، و onConflict لا يستنتج فهرساً جزئياً
       * بموثوقية عبر PostgREST. الطريق الأطول هنا هو الطريق الذي يعمل.
       */
      async save(o){
        var chk = M.validateFinalReport(o);
        if(!chk.ok) throw new Error(chk.errors[0]);
        var row = {
          image_id: o.image_id,
          patient_id: o.patient_id,
          visit_id: o.visit_id || null,
          report_text: M.str(o.report_text),
          impression: M.str(o.impression) || null,
          status: o.finalize ? 'final' : 'draft',
          source: 'doctor'
        };
        var cur = await ai.final.get(o.image_id);
        var r;
        if(cur){
          delete row.image_id; delete row.patient_id;
          r = await sb().from('final_report').update(row)
                .eq('id', cur.id).select(FR_COLS).single();
        }else{
          row.ai_assisted = false;
          r = await sb().from('final_report').insert(row).select(FR_COLS).single();
        }
        if(r.error) throw err(r.error, 'حفظ التقرير');
        return r.data;
      },

      async finalize(id, text){
        var patch = { status:'final' };
        if(M.str(text)) patch.report_text = M.str(text);
        var r = await sb().from('final_report').update(patch)
          .eq('id', id).select(FR_COLS).single();
        if(r.error) throw err(r.error, 'اعتماد التقرير');
        return r.data;
      },

      async reopen(id){
        var r = await sb().from('final_report')
          .update({ status:'draft', finalized_at:null })
          .eq('id', id).select(FR_COLS).single();
        if(r.error) throw err(r.error, 'إعادة فتح التقرير');
        return r.data;
      },

      async remove(id){
        var r = await sb().from('final_report')
          .update({ deleted_at:new Date().toISOString() }).eq('id', id);
        if(r.error) throw err(r.error, 'حذف التقرير');
        return true;
      }
    },

    _err: err,
    _detail: detail
  };

  IAPP.svc = IAPP.svc || {};
  IAPP.svc.ai = ai;
})(window);
