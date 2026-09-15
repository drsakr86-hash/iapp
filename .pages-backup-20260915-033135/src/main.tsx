import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles/global.css';

/**
 * StrictMode is deliberately on. It double-invokes effects in development,
 * which surfaces exactly the two bugs this migration is most exposed to:
 * duplicate Realtime subscriptions and missing cleanup. Leaving it off would
 * hide them until production.
 */
const container = document.getElementById('root');
if (!container) throw new Error('#root not found');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
