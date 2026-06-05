// App shell — auth gate + hash router + global navbar.
import React, { useState, useEffect } from 'react';
import { useHashRouter } from './lib/router.js';
import NavBar from './components/NavBar.jsx';
import Login from './pages/Login.jsx';
import Ops from './pages/Ops.jsx';
import Admin from './pages/Admin.jsx';
import Reports from './pages/Reports.jsx';

const AUTH_KEY = 'atlas.auth';

export default function App() {
  const { segments, navigate } = useHashRouter();
  const [auth, setAuth] = useState(() => {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch { return null; }
  });

  useEffect(() => {
    if (auth) localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    else localStorage.removeItem(AUTH_KEY);
  }, [auth]);

  // First segment determines which page renders. Defaults to ops when logged in.
  const page = segments[0] || 'ops';

  // Redirect unauthenticated traffic to login
  useEffect(() => {
    if (!auth && page !== 'login') navigate('/login');
    if (auth && page === 'login') navigate('/ops');
  }, [auth, page, navigate]);

  if (!auth) {
    return <Login onLogin={(user) => setAuth(user)} />;
  }

  const onLogout = () => { setAuth(null); navigate('/login'); };

  return (
    <div style={{ minWidth: 1140, position: 'relative', zIndex: 1 }}>
      <NavBar
        activeTab={page}
        onTab={(k) => navigate(k === 'ops' ? '/ops' : k === 'admin' ? '/admin' : '/reports')}
        onLogout={onLogout}
        user={auth.name || auth.email}
      />
      {page === 'ops' && <Ops />}
      {page === 'admin' && <Admin section={segments[1]} navigate={navigate} />}
      {page === 'reports' && <Reports />}
    </div>
  );
}
