// Toast — bottom-right success notification. Auto-dismisses after 3s.
import React, { useEffect, useState, useCallback } from 'react';
import { Icon } from '../lib/icons.jsx';

export default function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;
  return (
    <div className="toast" role="status">
      <span className="live-dot" />
      <Icon.Check size={16} />
      <span>{message}</span>
    </div>
  );
}

// useToast hook — returns { toast, show, hide }
export function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg) => setToast(msg), []);
  const hide = useCallback(() => setToast(null), []);
  return { toast, show, hide };
}
