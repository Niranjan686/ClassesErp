import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import CommandPalette from './components/Common/CommandPalette';
import { NotificationProvider } from './components/Common/NotificationSystem';
import GuidedOnboardingTour from './components/Common/GuidedOnboardingTour';

function App() {
  return (
    <Router>
      <NotificationProvider>
        <AppRoutes />
        <CommandPalette />
        <GuidedOnboardingTour />
      </NotificationProvider>
    </Router>
  );
}

export default App;
