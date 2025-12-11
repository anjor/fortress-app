// Fortress v2 - Main Application
// Living dashboard with optional advanced mode

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './components';
import { SettingsPage } from './pages/SettingsPage';
import { useFortressStore } from './store';

// Route guard for new users
function RouteGuard({ children }: { children: React.ReactNode }) {
  const hasCompletedOnboarding = useFortressStore(state => state.hasCompletedOnboarding);
  const latestSnapshot = useFortressStore(state => state.latestSnapshot);

  const isNewUser = !hasCompletedOnboarding && !latestSnapshot;

  if (isNewUser) {
    return <Navigate to="/settings" replace state={{ isNewUser: true }} />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white antialiased">
        <Routes>
          <Route path="/" element={
            <RouteGuard>
              <Dashboard />
            </RouteGuard>
          } />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
