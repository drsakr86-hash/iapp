import type { ReactElement } from 'react';
import type { ReportLang, ReportRecipient } from '../../../i18n/report';
import type { ReportData, ReportDocType } from '../../../types/report';
import { examinationHasContent } from '../sections/ExaminationSection';
import { MedicalReport } from '../MedicalReport';
import { ExaminationReport } from './ExaminationReport';
import { GlassesPrescriptionReport } from './GlassesPrescriptionReport';
import { MedicationPrescriptionReport } from './MedicationPrescriptionReport';
import { InvestigationRequestReport } from './InvestigationRequestReport';
import { ImagingReport } from './ImagingReport';
import { FollowUpReport } from './FollowUpReport';

export interface DocEntry {
  type: ReportDocType;
  label: string;
  icon: string;
  isAvailable: (data: ReportData) => boolean;
  Component: (props: {
    data: ReportData;
    lang?: ReportLang;
    recipient?: ReportRecipient;
  }) => ReactElement | null;
}

export const DOCUMENT_REGISTRY: DocEntry[] = [
  {
    type: 'examination',
    label: 'تقرير الفحص',
    icon: '🩺',
    isAvailable: (d) => examinationHasContent(d.examination),
    Component: ExaminationReport,
  },
  {
    type: 'glasses',
    label: 'وصفة النظارة',
    icon: '👓',
    isAvailable: (d) => d.glasses.length > 0,
    Component: GlassesPrescriptionReport,
  },
  {
    type: 'medication',
    label: 'وصفة الأدوية',
    icon: '💊',
    isAvailable: (d) => d.drugs.length > 0,
    Component: MedicationPrescriptionReport,
  },
  {
    type: 'investigation_request',
    label: 'طلب أشعة وفحوصات',
    icon: '🩻',
    isAvailable: (d) => d.imagingOrders.length > 0,
    Component: InvestigationRequestReport,
  },
  {
    type: 'imaging_report',
    label: 'تقرير التصوير',
    icon: '🖼️',
    isAvailable: (d) => d.studies.length > 0,
    Component: ImagingReport,
  },
  {
    type: 'followup',
    label: 'المتابعة',
    icon: '📋',
    isAvailable: (d) => d.followUps.length > 0,
    Component: FollowUpReport,
  },
  {
    type: 'complete',
    label: 'التقرير الطبي الكامل',
    icon: '📄',
    isAvailable: () => true,
    Component: MedicalReport,
  },
];

export function availableDocuments(data: ReportData): DocEntry[] {
  return DOCUMENT_REGISTRY.filter((entry) => entry.isAvailable(data));
}

export function documentComponentFor(type: ReportDocType): DocEntry['Component'] {
  return (DOCUMENT_REGISTRY.find((e) => e.type === type) ?? DOCUMENT_REGISTRY[DOCUMENT_REGISTRY.length - 1])
    .Component;
}
