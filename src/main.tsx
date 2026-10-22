import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { loadMistakePatterns } from './services/storageService';
import './styles/global.css';

// Validate and recover locally stored mistake data before the UI starts.
loadMistakePatterns();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('The application root element could not be found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
