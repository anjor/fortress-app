// Fortress v2 - Main Application
// Living dashboard with optional advanced mode

import { useEffect } from 'react';
import { Dashboard } from './components';
import { useFortressStore } from './store';

export default function App() {
  const latestSnapshot = useFortressStore(state => state.latestSnapshot);
  
  // Load demo data if no snapshot exists (for development)
  useEffect(() => {
    if (!latestSnapshot) {
      // Uncomment to auto-load demo data:
      // loadDemoData();
    }
  }, [latestSnapshot]);
  
  return (
    <div className="min-h-screen bg-white antialiased">
      <Dashboard />
    </div>
  );
}
