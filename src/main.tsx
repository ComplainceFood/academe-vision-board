import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'

// After a deploy, browsers with a stale cached bundle can fail to load
// hashed chunks that no longer exist. Reload once to pick up the new build.
window.addEventListener('vite:preloadError', () => {
  const key = 'chunk-reload-at';
  const last = Number(sessionStorage.getItem(key) || 0);
  if (Date.now() - last > 30_000) {
    sessionStorage.setItem(key, String(Date.now()));
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
