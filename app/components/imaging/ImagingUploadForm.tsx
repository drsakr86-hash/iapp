/* -------------------------------------------------------------------------
 * ImagingUploadForm — إضافة صورة / نتيجة فحص
 * -------------------------------------------------------------------------
 * The file goes to the private Storage bucket; the metadata goes to
 * iapp.medical_images. Two stores, one operation — see services/imaging.ts
 * for why the file is written first and rolled back on a failed insert.
 *
 * The file itself is never read into a database column. Only the bucket path
 * is stored, and it is resolved to a short-lived signed URL at display time.
 * ---------------------------------------------------------------------- */

import { useState } from 'react';
import { Button, Card } from '../ui';
import { MedText, MedValue } from '../medical/Medical';
import { useToast } from '../../hooks/useToast';
import * as imaging from '../../services/imaging';
import { today } from '../../utils/medical';
import {
  EYE_AR,
  MODALITIES,
  MODALITY_AR,
  type Eye,
  type Modality,
} from '../../types/domain';

export interface ImagingUploadFormProps {
  patientId: string;
  visitId?: string | null;
  examinationId?: string | null;
  onUploaded?: (study: imaging.Study) => void;
}

export function ImagingUploadForm({
  patientId,
  visitId = null,
  examinationId = null,
  onUploaded,
}: ImagingUploadFormProps) {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [modality, setModality] = useState<Modality | ''>('');
  const [eye, setEye] = useState<Eye>('OU');
  const [studyDate, setStudyDate] = useState(today());
  const [device, setDevice] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setProgress('');
    try {
      const study = await imaging.upload({
        patientId,
        visitId,
        examinationId,
        modality: modality as Modality,
        eye,
        studyDate,
        device,
        notes,
        file: file as File,
        onProgress: setProgress,
      });
      toast.success('تم رفع الدراسة وحفظ السجل');
      setFile(null);
      setModality('');
      setNotes('');
      setDevice('');
      onUploaded?.(study);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'تعذّر رفع الصورة';
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
      setProgress('');
    }
  }

  return (
    <Card title="إضافة صورة أو نتيجة فحص">
      <label className="field">
        <span className="field__label">الملف</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/tiff,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      {file ? (
        <p className="muted" style={{ fontSize: 12 }}>
          {/* File name and size are technical strings: LTR. */}
          <MedText>{file.name}</MedText> — <MedValue>{(file.size / 1024 / 1024).toFixed(2)} MB</MedValue>
        </p>
      ) : null}

      <label className="field">
        <span className="field__label">نوع التصوير</span>
        <select value={modality} onChange={(e) => setModality(e.target.value as Modality)}>
          <option value="">— اختر نوع التصوير —</option>
          {MODALITIES.map((m) => (
            <option key={m} value={m}>
              {MODALITY_AR[m]}
            </option>
          ))}
        </select>
      </label>

      <div className="grid-2">
        <label className="field">
          <span className="field__label">العين</span>
          <select value={eye} onChange={(e) => setEye(e.target.value as Eye)}>
            {(['OD', 'OS', 'OU'] as Eye[]).map((e) => (
              <option key={e} value={e}>
                {e} — {EYE_AR[e]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">تاريخ الدراسة</span>
          <input
            type="date"
            dir="ltr"
            value={studyDate}
            onChange={(e) => setStudyDate(e.target.value)}
          />
        </label>
      </div>

      <label className="field">
        <span className="field__label">الجهاز</span>
        {/* Device names are Latin product names. */}
        <input
          type="text"
          dir="ltr"
          className="med-text"
          value={device}
          placeholder="Topcon Maestro2"
          onChange={(e) => setDevice(e.target.value)}
        />
      </label>

      <label className="field">
        <span className="field__label">ملاحظات</span>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      {progress ? <p className="muted">{progress}</p> : null}
      {error ? <p className="alert">{error}</p> : null}

      <Button onClick={save} disabled={busy || !file || !modality} style={{ marginBlockStart: 12 }}>
        {busy ? 'جارٍ الرفع…' : 'رفع وحفظ'}
      </Button>
    </Card>
  );
}

export default ImagingUploadForm;
