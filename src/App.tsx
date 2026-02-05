// Fortress v2 - Main Application
// Living dashboard with question-first onboarding

import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Dashboard, QuestionSelector } from './components';
import { SettingsPage } from './pages/SettingsPage';
import { useFortressStore } from './store';

// Route guard for new users - sends to question selector
function RouteGuard({ children }: { children: React.ReactNode }) {
  const hasCompletedOnboarding = useFortressStore(state => state.hasCompletedOnboarding);
  const latestSnapshot = useFortressStore(state => state.latestSnapshot);

  const isNewUser = !hasCompletedOnboarding && !latestSnapshot;

  if (isNewUser) {
    return <Navigate to="/questions" replace />;
  }

  return <>{children}</>;
}

// Question selector page wrapper
function QuestionsPage() {
  const navigate = useNavigate();
  const setSelectedQuestions = useFortressStore(state => state.setSelectedQuestions);
  
  const handleComplete = (selectedQuestions: string[]) => {
    setSelectedQuestions(selectedQuestions);
    navigate('/settings', { state: { fromQuestions: true } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <QuestionSelector onComplete={handleComplete} maxSelections={5} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/fortress-app">
      <div className="min-h-screen bg-white antialiased">
        <Routes>
          <Route path="/" element={
            <RouteGuard>
              <Dashboard />
            </RouteGuard>
          } />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
