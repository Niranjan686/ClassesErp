import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import AIAssistant from './components/AI/AIAssistant';
import CommandPalette from './components/Common/CommandPalette';

function App() {
  return (
    <Router>
      <AppRoutes />
      <CommandPalette />
      <AIAssistant />
    </Router>
  );
}

export default App;
