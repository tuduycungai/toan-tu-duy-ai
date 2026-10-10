import React from 'react';
import { createRoot } from 'react-dom/client';
import { CurriculumShell as Home } from './components/curriculum-shell';
import { TeacherConsole } from './components/teacher-console';
import './app/globals.css';
import './app/enhancements.css';
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {new URLSearchParams(location.search).get('teacher') === '1' ? <TeacherConsole /> : <Home />}
  </React.StrictMode>,
);
