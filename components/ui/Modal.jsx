'use client';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-primary/50 z-[100] flex items-center justify-center p-4 sm:p-5" onClick={onClose}>
      <div
        className={`bg-white rounded-pf p-5 sm:p-7 w-full ${maxWidth} max-h-[88vh] overflow-y-auto animate-fadeUp`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-head">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-bglight">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
