/* -------------------------------------------------------------------------
 * i18n/findings.ts — professional English for clinical finding VALUES.
 * -------------------------------------------------------------------------
 * SAFETY RULE: this dictionary only ever translates a value that matches
 * one of the application's own fixed suggestion strings verbatim — the
 * same Arabic options a doctor picks from the dropdown next to each
 * finding field (see M.ANT_FIELDS / M.POST_FIELDS in utils/models.ts).
 * These are a closed, known vocabulary, so mapping them to established
 * ophthalmology English terms is a terminology lookup, not a translation
 * guess.
 *
 * Anything NOT in this dictionary — free text the doctor typed instead of
 * picking a suggestion — is left exactly as recorded. This file never runs
 * machine translation and never invents a professional term for text it
 * doesn't recognize; that is the one safety rule this whole file exists to
 * respect (see PART 5 of the report-language brief).
 * ---------------------------------------------------------------------- */

const FINDING_VALUE_EN: Record<string, string> = {
  // lids
  'طبيعية': 'Normal',
  'تورم': 'Eyelid edema',
  'احمرار': 'Eyelid erythema',
  'التهاب الجفن': 'Blepharitis',
  'شحاذ العين': 'Hordeolum (stye)',
  'إسدال الجفن': 'Ptosis',
  'انقلاب للخارج': 'Ectropion',
  'انقلاب للداخل': 'Entropion',

  // conjunctiva
  'احتقان': 'Conjunctival injection',
  'التهاب': 'Inflammation',
  'ظفرة': 'Pterygium',
  'نزيف تحت الملتحمة': 'Subconjunctival hemorrhage',
  'إفراز صديدي': 'Purulent discharge',
  'حليمات': 'Papillae',

  // cornea
  'شفافة': 'Clear',
  'عتامة': 'Opacity',
  'تليف': 'Scarring',
  'وذمة': 'Edema',
  'ترقق': 'Thinning',
  'قرحة': 'Ulcer',
  'صبغة فلوريسين إيجابية': 'Fluorescein staining positive',
  'ندبة': 'Scar',
  'رواسب خلف القرنية': 'Keratic precipitates',

  // anterior chamber
  'عميقة وهادئة': 'Deep and quiet',
  'ضحلة': 'Shallow',
  'خلايا': 'Cells',
  'توهج': 'Flare',
  'تجمع صديدي': 'Hypopyon',
  'تجمع دموي': 'Hyphema',

  // iris
  'ضمور': 'Atrophy',
  'التصاقات خلفية': 'Posterior synechiae',
  'تكوّن أوعية': 'Neovascularization',
  'عيب في نقل الضوء': 'Transillumination defect',

  // pupil
  'مستديرة متفاعلة': 'Round and reactive',
  'غير منتظمة': 'Irregular',
  'عيب حدقي وارد RAPD': 'RAPD present',
  'ثابتة': 'Fixed',
  'متوسعة': 'Dilated',
  'مضيّقة': 'Miotic',

  // lens
  'صافية': 'Clear',
  'مياه بيضاء نووية': 'Nuclear cataract',
  'تحت المحفظة الخلفية': 'Posterior subcapsular cataract',
  'قشرية': 'Cortical cataract',
  'ناضجة': 'Mature cataract',
  'عدسة صناعية': 'Pseudophakia',
  'عتامة المحفظة الخلفية': 'Posterior capsule opacification',

  // vitreous
  'صافٍ': 'Clear',
  'انفصال زجاجي خلفي': 'Posterior vitreous detachment (PVD)',
  'عتامات': 'Vitreous opacities',
  'نزيف': 'Hemorrhage',

  // disc
  'طبيعي، الحواف واضحة': 'Normal, well-defined margins',
  'شحوب': 'Pallor',
  'تجويف': 'Cupping',
  'حواف غير واضحة': 'Blurred margins',

  // macula
  'المنعكس البقعي موجود': 'Foveal reflex present',
  'منعكس باهت': 'Diminished foveal reflex',
  'تنكس': 'Degeneration',
  'ثقب بقعي': 'Macular hole',
  'دروزن': 'Drusen',

  // vessels
  'تضيّق شرياني': 'Arterial attenuation',
  'تعرّج': 'Tortuosity',
  'انضغاط شرياني وريدي': 'AV nicking',
  'انسداد وريدي': 'Venous occlusion',

  // periphery
  'سليمة': 'Normal / attached',
  'تنكس شبكي': 'Lattice degeneration',
  'ثقب': 'Retinal hole',
  'تمزق': 'Retinal tear',
  'انفصال': 'Retinal detachment',
  'أثر ليزر سابق': 'Prior laser scars',
};

/**
 * Common, established diagnosis names. Same safety rule: only an EXACT
 * match on the stored diagnosis_text is translated — a compound Arabic
 * sentence built around one of these words is left untouched rather than
 * partially/incorrectly translated.
 */
const DIAGNOSIS_EN: Record<string, string> = {
  'المياه البيضاء': 'Cataract',
  'المياه الزرقاء': 'Glaucoma',
  'اعتلال الشبكية السكري': 'Diabetic Retinopathy',
  'انسداد الوريد الشبكي': 'Retinal Vein Occlusion',
};

/**
 * Returns the professional English term for an exact-match finding value,
 * or `null` when the value isn't in the fixed suggestion vocabulary (e.g.
 * free text) — callers must fall back to the original value, never guess.
 */
export function findingValueEn(arValue: string): string | null {
  return FINDING_VALUE_EN[arValue.trim()] ?? null;
}

export function diagnosisEn(text: string): string | null {
  return DIAGNOSIS_EN[text.trim()] ?? null;
}
