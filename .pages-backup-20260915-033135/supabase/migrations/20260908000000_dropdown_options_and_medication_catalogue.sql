-- I APP configurable dropdown vocabulary + Test medication seed.
-- Safe-delete semantics: rows are deactivated, never hard-deleted.
create table if not exists iapp.dropdown_options (
  id uuid primary key default gen_random_uuid(),
  field_key text not null,
  value text not null,
  label_ar text not null,
  label_en text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid(),
  constraint dropdown_options_key_value_uq unique (field_key, value),
  constraint dropdown_options_nonblank check (length(btrim(value)) > 0 and length(btrim(label_ar)) > 0)
);
create index if not exists dropdown_options_field_active_idx on iapp.dropdown_options(field_key, is_active, sort_order);
alter table iapp.dropdown_options enable row level security;
drop policy if exists dropdown_options_select on iapp.dropdown_options;
drop policy if exists dropdown_options_insert on iapp.dropdown_options;
drop policy if exists dropdown_options_update on iapp.dropdown_options;
create policy dropdown_options_select on iapp.dropdown_options for select to authenticated using (iapp.is_doctor_or_admin());
create policy dropdown_options_insert on iapp.dropdown_options for insert to authenticated with check (iapp.is_doctor_or_admin());
create policy dropdown_options_update on iapp.dropdown_options for update to authenticated using (iapp.is_doctor_or_admin()) with check (iapp.is_doctor_or_admin());
grant select, insert, update on iapp.dropdown_options to authenticated;

insert into iapp.dropdown_options(field_key,value,label_ar,sort_order)
select * from (values
  ('iop_method','Goldmann','Goldmann',1),('iop_method','NCT (هوائي)','NCT (هوائي)',2),('iop_method','Tonopen','Tono-Pen',3),('iop_method','iCare','iCare',4),('iop_method','Perkins','Perkins',5),('iop_method','بالإصبع','بالإصبع',6),
  ('med_frequency','OD (مرة يومياً)','OD (مرة يومياً)',1),('med_frequency','BD (مرتان)','BD (مرتان)',2),('med_frequency','TDS (٣ مرات)','TDS (٣ مرات)',3),('med_frequency','QDS (٤ مرات)','QDS (٤ مرات)',4),('med_frequency','PRN (عند اللزوم)','PRN (عند اللزوم)',5),
  ('med_duration','3 أيام','3 أيام',1),('med_duration','5 أيام','5 أيام',2),('med_duration','أسبوع','أسبوع',3),('med_duration','10 أيام','10 أيام',4),('med_duration','أسبوعان','أسبوعان',5),('med_duration','3 أسابيع','3 أسابيع',6),('med_duration','شهر','شهر',7),('med_duration','شهران','شهران',8),('med_duration','3 أشهر','3 أشهر',9),('med_duration','حتى المراجعة','حتى المراجعة',10),('med_duration','مستمر','مستمر',11),
  ('service_category','كشف','كشف',1),('service_category','استشارة','استشارة',2),('service_category','فحوصات','فحوصات',3),('service_category','أشعة','أشعة',4),('service_category','إجراءات','إجراءات',5),('service_category','عمليات','عمليات',6),('service_category','أدوية','أدوية',7),('service_category','أخرى','أخرى',8),
  ('complaint','ضعف النظر','ضعف النظر',1),('complaint','التهاب العين','التهاب العين',2),('complaint','صداع','صداع',3),('complaint','تغيير النظارة','تغيير النظارة',4),('complaint','صعوبة في القراءة','صعوبة في القراءة',5),('complaint','مياه بيضاء','مياه بيضاء',6),('complaint','شبورة بالعين','شبورة بالعين',7),('complaint','ألم في العين','ألم في العين',8),('complaint','عين حمراء','عين حمراء',9),('complaint','إفرازات من العين','إفرازات من العين',10),('complaint','رؤية مزدوجة','رؤية مزدوجة',11),('complaint','وميض أو بقع سوداء','وميض أو بقع سوداء',12),
  ('diagnosis','قصر نظر','قصر نظر',1),('diagnosis','طول نظر','طول نظر',2),('diagnosis','استجماتيزم','استجماتيزم',3),('diagnosis','قصر النظر الشيخوخي','قصر النظر الشيخوخي',4),('diagnosis','المياه البيضاء','المياه البيضاء',5),('diagnosis','المياه الزرقاء','المياه الزرقاء',6),('diagnosis','التهاب الملتحمة','التهاب الملتحمة',7),('diagnosis','جفاف العين','جفاف العين',8),('diagnosis','اعتلال الشبكية السكري','اعتلال الشبكية السكري',9),('diagnosis','تنكس البقعة الصفراء','تنكس البقعة الصفراء',10),('diagnosis','الحول','الحول',11),('diagnosis','كسل العين','كسل العين',12),
  ('treatment_plan','نظارة طبية','نظارة طبية',1),('treatment_plan','عدسات لاصقة','عدسات لاصقة',2),('treatment_plan','قطرات','قطرات',3),('treatment_plan','متابعة دورية','متابعة دورية',4),('treatment_plan','عملية المياه البيضاء','عملية المياه البيضاء',5),('treatment_plan','ليزك','ليزك',6),('treatment_plan','حقن داخل العين','حقن داخل العين',7),('treatment_plan','ليزر شبكية','ليزر شبكية',8),('treatment_plan','تحويل لأخصائي','تحويل لأخصائي',9)
) s(field_key,value,label_ar,sort_order)
where not exists (select 1 from iapp.dropdown_options d where d.field_key=s.field_key and d.value=s.value);

insert into iapp.dropdown_options(field_key,value,label_ar,sort_order)
select 'finding:'||x.field_key, x.option, x.option, x.ord
from (values
 ('lids','طبيعية',1),('lids','تورم',2),('lids','احمرار',3),('lids','التهاب الجفن',4),('lids','شحاذ العين',5),('lids','إسدال الجفن',6),('lids','انقلاب للخارج',7),('lids','انقلاب للداخل',8),
 ('conjunctiva','طبيعية',1),('conjunctiva','احتقان',2),('conjunctiva','التهاب',3),('conjunctiva','ظفرة',4),('conjunctiva','نزيف تحت الملتحمة',5),('conjunctiva','إفراز صديدي',6),('conjunctiva','حليمات',7),
 ('cornea','شفافة',1),('cornea','عتامة',2),('cornea','تليف',3),('cornea','وذمة',4),('cornea','ترقق',5),('cornea','قرحة',6),('cornea','صبغة فلوريسين إيجابية',7),('cornea','ندبة',8),('cornea','رواسب خلف القرنية',9),
 ('ac','عميقة وهادئة',1),('ac','ضحلة',2),('ac','خلايا',3),('ac','توهج',4),('ac','تجمع صديدي',5),('ac','تجمع دموي',6),
 ('iris','طبيعية',1),('iris','ضمور',2),('iris','التصاقات خلفية',3),('iris','تكوّن أوعية',4),('iris','عيب في نقل الضوء',5),
 ('pupil','مستديرة متفاعلة',1),('pupil','غير منتظمة',2),('pupil','عيب حدقي وارد RAPD',3),('pupil','ثابتة',4),('pupil','متوسعة',5),('pupil','مضيّقة',6),
 ('lens','صافية',1),('lens','مياه بيضاء نووية',2),('lens','تحت المحفظة الخلفية',3),('lens','قشرية',4),('lens','ناضجة',5),('lens','عدسة صناعية',6),('lens','عتامة المحفظة الخلفية',7),
 ('vitreous','صافٍ',1),('vitreous','انفصال زجاجي خلفي',2),('vitreous','عتامات',3),('vitreous','نزيف',4),('vitreous','خلايا',5),
 ('disc','طبيعي، الحواف واضحة',1),('disc','شحوب',2),('disc','وذمة',3),('disc','تجويف',4),('disc','حواف غير واضحة',5),
 ('cd_ratio','0.1',1),('cd_ratio','0.2',2),('cd_ratio','0.3',3),('cd_ratio','0.4',4),('cd_ratio','0.5',5),('cd_ratio','0.6',6),('cd_ratio','0.7',7),('cd_ratio','0.8',8),('cd_ratio','0.9',9),
 ('macula','المنعكس البقعي موجود',1),('macula','منعكس باهت',2),('macula','وذمة',3),('macula','تنكس',4),('macula','ثقب بقعي',5),('macula','دروزن',6),('macula','نزيف',7),
 ('vessels','طبيعية',1),('vessels','تضيّق شرياني',2),('vessels','تعرّج',3),('vessels','انضغاط شرياني وريدي',4),('vessels','انسداد وريدي',5),('vessels','تكوّن أوعية جديدة',6),
 ('periphery','سليمة',1),('periphery','تنكس شبكي',2),('periphery','ثقب',3),('periphery','تمزق',4),('periphery','انفصال',5),('periphery','أثر ليزر سابق',6)
) x(field_key,option,ord)
where not exists (select 1 from iapp.dropdown_options d where d.field_key='finding:'||x.field_key and d.value=x.option);

insert into iapp.medications(name,name_ar,generic_name,strength,form,is_active,is_custom)
select * from (values
  ('Artificial Tears','دموع صناعية','Lubricating eye drops',null,'drop'::iapp.medication_form,true,true),('Moxifloxacin','موكسيفلوكساسين','Moxifloxacin','0.5%','drop'::iapp.medication_form,true,true),('Tobramycin','توبراميسين','Tobramycin','0.3%','drop'::iapp.medication_form,true,true),('Prednisolone Acetate','بريدنيزولون أسيتات','Prednisolone acetate','1%','drop'::iapp.medication_form,true,true),('Ketorolac','كيتورولاك','Ketorolac','0.5%','drop'::iapp.medication_form,true,true),('Latanoprost','لاتانوبروست','Latanoprost','0.005%','drop'::iapp.medication_form,true,true),('Timolol','تيمولول','Timolol','0.5%','drop'::iapp.medication_form,true,true)
) s(name,name_ar,generic_name,strength,form,is_active,is_custom)
where not exists (select 1 from iapp.medications m where lower(m.name)=lower(s.name));
