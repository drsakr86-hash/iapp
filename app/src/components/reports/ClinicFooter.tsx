import { label, type ReportLang } from '../../i18n/report';
import type { ReportData } from '../../types/report';

interface Pair {
  ar: string;
  en: string;
}

/**
 * Clinic/location block. Deliberately separate from ReportFooter (the
 * doctor's signature) — the doctor is the document's primary identity,
 * the clinic is contact/location metadata and must never be combined
 * with the signature or promoted into the header.
 *
 * `data.clinic` is resolved by the page from `visit.clinic_id` via
 * clinics.get() (not the active-only clinics.list()), so a historical
 * visit always prints the clinic it actually happened at — even if that
 * clinic has since been deactivated — never whichever clinic is
 * "currently active".
 *
 * Only fields with a real value are shown — no placeholder contact info
 * is ever invented for a clinic missing a phone/WhatsApp number. There is
 * no separate "mobile" column in iapp.clinics (only phone + whatsapp), so
 * a clinic with two distinct numbers can only show one under "Tel" today.
 *
 * The clinic has no address_en column, so the address is always printed
 * in the language it was actually entered in, regardless of report
 * language — inventing an English translation of a street address would
 * misinform, not help, a physician trying to find the clinic.
 */
export function ClinicFooter({ data, lang }: { data: ReportData; lang: ReportLang }) {
  const { clinic } = data;
  if (!clinic) return null;

  const name =
    lang === 'ar'
      ? clinic.name_ar
      : lang === 'en'
        ? (clinic.name_en ?? clinic.name_ar)
        : [clinic.name_ar, clinic.name_en].filter(Boolean).join(' — ');

  const telLabel = label(TEL, lang);
  const waLabel = label(WHATSAPP, lang);

  const contactLines: Array<{ label: string; value: string }> = [];
  if (clinic.phone) contactLines.push({ label: telLabel, value: clinic.phone });
  if (clinic.whatsapp) contactLines.push({ label: waLabel, value: clinic.whatsapp });

  return (
    <div className="medical-report__clinic-footer">
      <div className="medical-report__clinic-footer-name">{name}</div>
      {clinic.address ? (
        <div className="medical-report__clinic-footer-address">{clinic.address}</div>
      ) : null}
      {contactLines.length ? (
        <div className="medical-report__clinic-footer-contact">
          {contactLines.map((c, i) => (
            <span key={c.label}>
              {i > 0 ? <span className="medical-report__clinic-footer-sep"> · </span> : null}
              {c.label}: {c.value}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const TEL: Pair = { ar: 'تليفون', en: 'Tel' };
const WHATSAPP: Pair = { ar: 'واتساب', en: 'WhatsApp' };
