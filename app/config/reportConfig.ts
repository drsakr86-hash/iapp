/* -------------------------------------------------------------------------
 * reportConfig.ts — presentation-only defaults for the printed report.
 * -------------------------------------------------------------------------
 * Nothing here requires a database migration. The report always prefers
 * real data (iapp.doctors, iapp.clinics) resolved by DoctorMedicalReport;
 * these constants are the last-resort fallback so the header never renders
 * blank if a doctor/clinic row can't be matched.
 * ---------------------------------------------------------------------- */

export const REPORT_FALLBACK = {
  appName: 'I App — عيادات طب وجراحة العيون',
  doctorNameAr: 'د. عبدالستار صقر',
  doctorTitleAr: 'استشاري طب وجراحة العيون والليزر',
};
