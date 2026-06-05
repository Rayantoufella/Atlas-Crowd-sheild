// Hash-based router. Routes look like #/admin/cameras
// Returns { path, segments, navigate }
import { useEffect, useState, useCallback } from 'react';

function readHash() {
  const h = window.location.hash || '#/';
  return h.startsWith('#') ? h.slice(1) : h;
}

export function useHashRouter() {
  const [path, setPath] = useState(readHash());

  useEffect(() => {
    const onChange = () => setPath(readHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((to) => {
    window.location.hash = to.startsWith('#') ? to.slice(1) : to;
  }, []);

  const segments = path.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  return { path, segments, navigate };
}
