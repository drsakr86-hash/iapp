/* Entry for tests/medical.mjs.
 *
 * Exposes the pure clinical logic AND mounts the real refraction chart into
 * jsdom, so direction and eye order are asserted against rendered DOM rather
 * than against source text. A test that greps the source proves only that a
 * string is present; this one proves what the browser would actually show.
 */
import { createRoot } from 'react-dom/client';
import { ToastProvider } from '../src/contexts/ToastContext';
import { GlassesRxForm } from '../src/components/rx/GlassesRxForm';
import { MedicationRxForm } from '../src/components/rx/MedicationRxForm';
import * as medical from '../src/utils/medical';
import { displayName } from '../src/services/doctors';
import {
  EYE_AR,
  MODALITY_AR,
  MODALITIES,
  RX_EYE_ORDER,
  modalityLabel,
} from '../src/types/domain';
import '../src/styles/global.css';

(globalThis as unknown as Record<string, unknown>).__iapp = {
  medical,
  displayName,
  EYE_AR,
  MODALITY_AR,
  MODALITIES,
  RX_EYE_ORDER,
  modalityLabel,
  mountGlasses() {
    const el = document.getElementById('root');
    if (!el) throw new Error('#root missing');
    createRoot(el).render(
      <ToastProvider>
        <GlassesRxForm patientId="00000000-0000-0000-0000-000000000001" />
      </ToastProvider>,
    );
  },
  mountMeds() {
    const el = document.getElementById('meds');
    if (!el) throw new Error('#meds missing');
    createRoot(el).render(
      <ToastProvider>
        <MedicationRxForm patientId="00000000-0000-0000-0000-000000000001" />
      </ToastProvider>,
    );
  },
};
