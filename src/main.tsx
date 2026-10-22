import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { validateStoredData } from './services/storageService';
import './styles/global.css';

// Validate each local category independently before the UI starts.
validateStoredData();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('The application root element could not be found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
