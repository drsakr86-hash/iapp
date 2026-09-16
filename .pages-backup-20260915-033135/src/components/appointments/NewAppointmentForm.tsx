/* -------------------------------------------------------------------------
 * NewAppointmentForm — حجز موعد جديد
 * -------------------------------------------------------------------------
 * Every field here maps to a parameter of iapp.book_appointment. The form
 * collects, validates for legibility, and calls. It does NOT decide whether
 * a slot is free.
 *
 * The slot grid is advisory. It is read from iapp.available_slots when the
 * clinic and date are chosen, and it can be stale by the time the doctor
 * presses save — another secretary may have taken the slot in between. The
 * authority is the exclusion constraint on appointments.slot, which refuses
 * the second write. That refusal surfaces here as an Arabic message and the
 * grid reloads. Pre-checking and then inserting would be a lost update, and
 * that is the exact defect Phase 8 was opened to fix.
 *
 * PATIENT SELECTION — every appointment from this app is tied to a real
 * iapp.patients row via patient_id. There is deliberately no guest/walk-in
 * path (see appointments.ts). Two ways to land on a patient_id:
 *   1. Search existing patients, click a result — the picker never lets the
 *      typed search text be mistaken for a selection.
 *   2. "+ إضافة مريض جديد" when the search finds nobody — collects the new
 *      patient's details, checks for a phone match first (so one secretary
 *      typo doesn't create a duplicate chart), then creates the row and
 *      uses its id. If appointment booking then fails, the newly created
 *      patient stays selected so the secretary can just retry saving
 *      instead of losing the patient or re-entering their details.
 * ---------------------------------------------------------------------- */

import { useCallback, useEffect, useState } from 'react';
import { Button, Card } from '../ui';
import { MedValue } from '../medical/Medical';
import { useToast } from '../../hooks/useToast';
import * as appointments from '../../services/appointments';
import * as patientsSvc from '../../services/patients';
import * as clinicsSvc from '../../services/clinics';
import * as doctorsSvc from '../../services/doctors';
import { today } from '../../utils/medical';
import { GENDER_OPTIONS } from '../../config/fieldOptions';

export interface NewAppointmentFormProps {
  /** Pre-selected patient, when opened from a patient record. */
  patientId?: string | null;
  defaultClinicId?: string | null;
  defaultDoctorId?: string | null;
  /** Called with the created row so the caller can prepend it to its list. */
  onCreated?: (row: appointments.AppointmentRow) => void;
  onCancel?: () => void;
}

export function NewAppointmentForm({
  patientId = null,
  defaultClinicId = null,
  defaultDoctorId = null,
  onCreated,
  onCancel,
}: NewAppointmentFormProps) {
  const toast = useToast();

  const [clinics, setClinics] = useState<clinicsSvc.ClinicRow[]>([]);
  const [doctors, setDoctors] = useState<doctorsSvc.DoctorRecord[]>([]);
  const [results, setResults] = useState<patientsSvc.PatientRow[]>([]);

  const [clinicId, setClinicId] = useState(defaultClinicId ?? '');
  const [doctorId, setDoctorId] = useState(defaultDoctorId ?? '');

  /* The picker's single source of truth: either a chosen existing patient,
     or the id/summary of one just created here. Never a free-text name. */
  const [selected, setSelected] = useState<patientsSvc.PatientRow | null>(null);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);

  /* "+ إضافة مريض جديد" sub-form. */
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGender, setNewGender] = useState<'male' | 'female' | ''>('');
  const [newDob, setNewDob] = useState('');
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [duplicate, setDuplicate] = useState<patientsSvc.PatientRow | null>(null);

  const [date, setDate] = useState(today());
  const [time, setTime] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');

  const [slots, setSlots] = useState<appointments.Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Reference data, once. */
  useEffect(() => {
    let active = true;
    Promise.all([clinicsSvc.list(), doctorsSvc.list()])
      .then(([c, d]) => {
        if (!active) return;
        setClinics(c);
        setDoctors(d);
        if (!defaultClinicId && c.length === 1) setClinicId(c[0].id);
      })
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [defaultClinicId]);

  /* Pre-selected patient (opened from a patient record): load its summary
     once so the same "selected patient" card renders either way. */
  useEffect(() => {
    if (!patientId) return;
    let active = true;
    patientsSvc
      .get(patientId)
      .then((p) => active && setSelected(p))
      .catch(() => {
        /* Falls back to the plain id still being sent to book(); the card
           just won't have a name to show. */
      });
    return () => {
      active = false;
    };
  }, [patientId]);

  /* Patient search, debounced — one request per pause, not per keystroke.
     Only runs while nobody is selected and no pre-selected patientId was
     passed in, so a chosen result is never silently re-queried away. */
  useEffect(() => {
    if (patientId || selected) return;
    const term = search.trim();
    if (!term) {
      // oxlint-disable-next-line react/set-state-in-effect
      setResults([]);
      setSearching(false);
      return;
    }
    let active = true;
    setSearching(true);
    const t = setTimeout(() => {
      patientsSvc
        .list({ search: term, limit: 30 })
        .then((p) => {
          if (!active) return;
          setResults(p);
          setError(null);
        })
        .catch((e: Error) => {
          /* A failed patient search is not a silent failure: without it the
             list is empty and booking is blocked, so the user must be told
             why rather than seeing an unexplained empty list. */
          if (active) setError(e.message || 'تعذّر البحث عن المرضى');
        })
        .finally(() => {
          if (active) setSearching(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [search, patientId, selected]);

  function pickPatient(p: patientsSvc.PatientRow) {
    setSelected(p);
    setResults([]);
    setSearch('');
    setAddingNew(false);
    setDuplicate(null);
    setNewName('');
    setNewPhone('');
    setNewGender('');
    setNewDob('');
    setError(null);
  }

  function changePatient() {
    setSelected(null);
    setSearch('');
    setResults([]);
    setAddingNew(false);
    setDuplicate(null);
    setNewName('');
    setNewPhone('');
    setNewGender('');
    setNewDob('');
  }

  function startAddNew() {
    setAddingNew(true);
    setDuplicate(null);
    setNewName(search.trim());
    setNewPhone('');
    setNewGender('');
    setNewDob('');
  }

  /**
   * Creates the new patient (after the duplicate check below has been
   * cleared) and selects it, so save() always has a real patient_id.
   */
  async function createAndSelectPatient(): Promise<patientsSvc.PatientRow> {
    const created = await patientsSvc.create({
      fullName: newName,
      phone: newPhone || null,
      gender: newGender || null,
      dateOfBirth: newDob || null,
    });
    setSelected(created);
    setAddingNew(false);
    setDuplicate(null);
    return created;
  }

  const loadSlots = useCallback(async () => {
    if (!clinicId || !date) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    try {
      setSlots(await appointments.availableSlots(clinicId, date, doctorId || null));
    } catch (e) {
      setSlots([]);
      if (e instanceof Error) setError(e.message);
    } finally {
      setSlotsLoading(false);
    }
  }, [clinicId, date, doctorId]);

  useEffect(() => {
    /* Slot availability is server state keyed by clinic+date+doctor. It
       must be re-read when any of them changes; it cannot be derived. */
    // oxlint-disable-next-line react/set-state-in-effect
    void loadSlots();
  }, [loadSlots]);

  async function bookFor(pid: string) {
    const row = await appointments.book({
      clinicId,
      date,
      time,
      patientId: pid,
      doctorId: doctorId || null,
      type: type || null,
      notes: notes || null,
    });
    toast.success('تم حجز الموعد');
    setTime('');
    setNotes('');
    onCreated?.(row);
    /* The taken slot must disappear from the grid straight away. */
    void loadSlots();
  }

  async function save() {
    if (saving || creatingPatient) return;

    if (addingNew) {
      const name = newName.trim();
      if (!name) {
        const message = 'اسم المريض مطلوب';
        setError(message);
        toast.error(message);
        return;
      }

      // A phone match is checked before creating anything, so one typo in
      // the search box doesn't silently produce a duplicate chart.
      if (!duplicate && newPhone.trim()) {
        setCreatingPatient(true);
        setError(null);
        try {
          const match = await patientsSvc.findByPhone(newPhone);
          if (match) {
            setDuplicate(match);
            return;
          }
        } catch (e) {
          const message = e instanceof Error ? e.message : 'تعذّر التحقق من رقم الهاتف';
          setError(message);
          toast.error(message);
          return;
        } finally {
          setCreatingPatient(false);
        }
      }

      setCreatingPatient(true);
      setError(null);
      let pid: string;
      try {
        const created = await createAndSelectPatient();
        pid = created.id;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'تعذّر إنشاء المريض';
        setError(message);
        toast.error(message);
        return;
      } finally {
        setCreatingPatient(false);
      }

      // The patient now exists and is selected even if the code below
      // fails, so a booking failure here is retried with the normal save
      // button — the patient is never created twice.
      setSaving(true);
      try {
        await bookFor(pid);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'تعذّر حجز الموعد';
        setError('تم إنشاء المريض بنجاح، لكن حجز الموعد فشل: ' + message);
        toast.error(message);
        void loadSlots();
      } finally {
        setSaving(false);
      }
      return;
    }

    const pid = patientId || selected?.id;
    if (!pid) {
      const message = 'من فضلك اختر مريضًا من قائمة المرضى المسجلين، أو أضف مريضًا جديدًا';
      setError(message);
      toast.error(message);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await bookFor(pid);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'تعذّر حجز الموعد';
      setError(message);
      toast.error(message);
      /* The most likely cause is that someone else took the slot. Reload so
         the doctor sees the current picture rather than the stale one. */
      void loadSlots();
    } finally {
      setSaving(false);
    }
  }

  const free = slots.filter((s) => s.is_free);
  const busy = saving || creatingPatient;

  return (
    <Card title="حجز موعد جديد">
      <label className="field">
        <span className="field__label">العيادة</span>
        <select value={clinicId} onChange={(e) => setClinicId(e.target.value)}>
          <option value="">— اختر العيادة —</option>
          {clinics.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_ar}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field__label">الطبيب</span>
        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          <option value="">— أي طبيب —</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title_ar ? `${d.title_ar} ` : ''}
              {d.full_name_ar}
            </option>
          ))}
        </select>
      </label>

      {patientId ? null : selected ? (
        /* A clearly selected patient — never an editable text field the
           user could mistake for still being a search box. */
        <div className="field">
          <span className="field__label">المريض</span>
          <div className="row" style={{ alignItems: 'center', gap: 8 }}>
            <strong>{selected.full_name}</strong>
            <span className="muted" style={{ fontSize: 12 }}>
              {selected.patient_code}
              {selected.phone ? ` — ${selected.phone}` : ''}
            </span>
            <Button variant="outline" onClick={changePatient}>
              تغيير
            </Button>
          </div>
        </div>
      ) : addingNew ? (
        <div className="field">
          <span className="field__label">مريض جديد</span>
          <label className="field">
            <span className="field__label">الاسم الكامل</span>
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setDuplicate(null);
              }}
            />
          </label>
          <label className="field">
            <span className="field__label">الهاتف (اختياري)</span>
            <input
              type="text"
              dir="ltr"
              value={newPhone}
              onChange={(e) => {
                setNewPhone(e.target.value);
                setDuplicate(null);
              }}
            />
          </label>
          <div className="grid-2">
            <label className="field">
              <span className="field__label">النوع</span>
              <select
                value={newGender}
                onChange={(e) => setNewGender(e.target.value as 'male' | 'female' | '')}
              >
                <option value="">— اختر —</option>
                {GENDER_OPTIONS.filter((g) => g.value === 'male' || g.value === 'female').map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">تاريخ الميلاد (اختياري)</span>
              <input
                type="date"
                dir="ltr"
                value={newDob}
                max={today()}
                onChange={(e) => setNewDob(e.target.value)}
              />
            </label>
          </div>

          {duplicate ? (
            <div className="alert">
              <p>يوجد مريض مسجل بهذا الرقم: {duplicate.full_name} ({duplicate.patient_code})</p>
              <div className="row" style={{ gap: 8, marginBlockStart: 6 }}>
                <Button
                  onClick={() => {
                    pickPatient(duplicate);
                  }}
                >
                  استخدام هذا المريض
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    setDuplicate(null);
                    setCreatingPatient(true);
                    setError(null);
                    try {
                      await createAndSelectPatient();
                    } catch (e) {
                      const message =
                        e instanceof Error ? e.message : 'تعذّر إنشاء المريض';
                      setError(message);
                      toast.error(message);
                    } finally {
                      setCreatingPatient(false);
                    }
                  }}
                >
                  إنشاء مريض جديد مع ذلك
                </Button>
              </div>
            </div>
          ) : null}

          <div className="row" style={{ gap: 8, marginBlockStart: 6 }}>
            <Button
              variant="outline"
              onClick={() => {
                setAddingNew(false);
                setDuplicate(null);
              }}
            >
              رجوع للبحث
            </Button>
          </div>
        </div>
      ) : (
        <>
          <label className="field">
            <span className="field__label">ابحث عن مريض بالاسم / الهاتف / كود المريض</span>
            <input
              type="text"
              value={search}
              placeholder="الاسم أو رقم الهاتف أو الكود"
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          {search.trim() ? (
            searching ? (
              <p className="muted" style={{ fontSize: 12 }}>
                جارٍ البحث…
              </p>
            ) : results.length ? (
              <ul className="row" style={{ flexDirection: 'column', gap: 4 }}>
                {results.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="patient-result"
                      onClick={() => pickPatient(p)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'start',
                        cursor: 'pointer',
                      }}
                    >
                      <strong>{p.full_name}</strong>{' '}
                      <span className="muted" style={{ fontSize: 12 }}>
                        {p.patient_code}
                        {p.phone ? ` — ${p.phone}` : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="field">
                <p className="muted" style={{ fontSize: 12 }}>
                  لا يوجد مريض مطابق
                </p>
                <Button variant="outline" onClick={startAddNew}>
                  + إضافة مريض جديد
                </Button>
              </div>
            )
          ) : null}
        </>
      )}

      <div className="grid-2">
        <label className="field">
          <span className="field__label">التاريخ</span>
          <input
            type="date"
            dir="ltr"
            value={date}
            min={today()}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field__label">الوقت</span>
          <input
            type="time"
            dir="ltr"
            value={time.slice(0, 5)}
            onChange={(e) => setTime(e.target.value)}
          />
        </label>
      </div>

      {/* The free-slot grid. Times are LTR: 09:30 must not reorder. */}
      <div style={{ marginBlockStart: 6 }}>
        <span className="muted" style={{ fontSize: 12 }}>
          {slotsLoading
            ? 'جارٍ قراءة المواعيد المتاحة…'
            : free.length
              ? `${free.length} موعد متاح`
              : clinicId
                ? 'لا توجد مواعيد متاحة في هذا اليوم'
                : 'اختر العيادة والتاريخ لعرض المواعيد المتاحة'}
        </span>
        <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginBlockStart: 6 }}>
          {free.map((s) => (
            <Button
              key={s.slot_time}
              variant={time.slice(0, 5) === s.slot_time.slice(0, 5) ? 'primary' : 'outline'}
              onClick={() => setTime(s.slot_time)}
            >
              <MedValue>{s.slot_time.slice(0, 5)}</MedValue>
            </Button>
          ))}
        </div>
      </div>

      <label className="field" style={{ marginBlockStart: 10 }}>
        <span className="field__label">نوع الموعد</span>
        <input
          type="text"
          value={type}
          placeholder="كشف / متابعة / استشارة"
          onChange={(e) => setType(e.target.value)}
        />
      </label>

      <label className="field">
        <span className="field__label">ملاحظات</span>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      {error ? <p className="alert">{error}</p> : null}

      <div className="row" style={{ gap: 8, marginBlockStart: 12 }}>
        <Button onClick={save} disabled={busy || (addingNew && !!duplicate)}>
          {creatingPatient ? 'جارٍ إنشاء المريض…' : saving ? 'جارٍ الحجز…' : 'حفظ الموعد'}
        </Button>
        {onCancel ? (
          <Button variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

export default NewAppointmentForm;
