import { BrowserRouter } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { AppRoutes } from './AppRoutes';

export function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Header />
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}
