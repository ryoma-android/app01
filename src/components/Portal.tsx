'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
}

const Portal: React.FC<PortalProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }

  const container = document.getElementById('modal-root');
  if (!container) {
    // This case should ideally not happen if layout.tsx is correct
    console.error('The element #modal-root was not found');
    return null;
  }

  return createPortal(children, container);
};

export default Portal; 