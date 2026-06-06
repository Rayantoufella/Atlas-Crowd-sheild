// App shell — hash router + shared global navbar on every page.
// No auth: the command-center dashboard is the default landing page.
import React from 'react';
import { useHashRouter } from './lib/router.js';
import NavBar from './components/NavBar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Admin from './pages/Admin.jsx';
import ReportsDashboard from './pages/ReportsDashboard.jsx';
import Forensic from './pages/Forensic.jsx';

export default function App() {
  const { segments, navigate } = useHashRouter();

  // First segment determines which page renders. Defaults to the dashboard.
  const page = segments[0] || 'dashboard';

  // Single navigation helper shared by the navbar across all pages.
  const goSection = (k) =>
    navigate(k === 'dashboard' ? '/dashboard' : k === 'forensic' ? '/forensic' : k === 'admin' ? '/admin' : '/reports');

  // `ops` kept as an alias of the dashboard for old links.
  const activeTab = page === 'ops' ? 'dashboard' : page;

  return (
    <div style={{ minWidth: 1140, position: 'relative', zIndex: 1 }}>
      <NavBar activeTab={activeTab} onTab={goSection} />
      {(page === 'dashboard' || page === 'ops') && <Dashboard />}
      {page === 'forensic' && <Forensic />}
      {page === 'admin' && <Admin section={segments[1]} navigate={navigate} />}
      {page === 'reports' && <ReportsDashboard section={segments[1]} navigate={navigate} />}
    </div>
  );
}
