import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Universal Modal component using React Portal to render directly into document.body.
 * This guarantees the modal is always centered on screen regardless of parent transforms or scroll position.
 */
export default function Modal({ isOpen, onClose, children, maxWidth = 'max-w-lg', className = '' }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs modal-backdrop-smooth"
      onClick={onClose}
    >
      <div
        className={`bg-white border border-slate-200/90 rounded-3xl w-full ${maxWidth} p-6 shadow-2xl modal-content-spring max-h-[90vh] overflow-y-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
