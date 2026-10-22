import { BrowserRouter } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { StorageRecoveryNotice } from '../components/common/StorageRecoveryNotice';
import { AppRoutes } from './AppRoutes';

export function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Header />
        <StorageRecoveryNotice />
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}
