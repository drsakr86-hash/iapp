import { createRoot } from 'react-dom/client';
import App from '../src/app/App';
import '../src/styles/global.css';

// Exposed so the jsdom harness can mount on demand.
(globalThis as unknown as { mountApp: () => void }).mountApp = () => {
  const el = document.getElementById('root');
  if (!el) throw new Error('#root missing');
  createRoot(el).render(<App />);
};
