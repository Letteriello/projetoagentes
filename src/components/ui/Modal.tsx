import React from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode; // Optional: For custom buttons or footer layout
}

export function Modal({ isOpen, onClose, title, children, footerContent }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose} // Close on overlay click
      aria-modal="true"
      role="dialog"
    >
      <div
        className={cn(
          "bg-gray-800 text-gray-100 rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all",
          // Basic animation (can be enhanced with framer-motion or similar if needed)
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0" 
        )}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-100 hover:bg-gray-700"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="mb-6 text-sm text-gray-300">
          {children}
        </div>

        {/* Footer (Optional) */}
        {footerContent && (
          <div className="flex justify-end space-x-3">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
}
