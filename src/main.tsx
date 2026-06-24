import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import './index.css';
import App from './App.tsx';
import { GameProvider } from './context/GameContext.tsx';
import { EngineProvider } from './engine/EngineProvider.tsx';
import { isRealLinuxSupported } from './engine/v86';
import { getPersistentVmHost } from './engine/realVmHost';

if (typeof window !== 'undefined' && isRealLinuxSupported()) {
  // Preload v86 kernel in the background for a faster terminal experience
  setTimeout(() => {
    try {
      getPersistentVmHost();
    } catch (e) {
      console.warn('Failed to preload v86:', e);
    }
  }, 1000);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <EngineProvider>
        <GameProvider>
          <App />
        </GameProvider>
      </EngineProvider>
    </HashRouter>
  </StrictMode>
);
