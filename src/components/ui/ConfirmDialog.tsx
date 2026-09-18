import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl p-6 relative fade-in-up"
        style={{
          backgroundColor: '#121212',
          border: '1px solid #242424',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg text-muted hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4">
          <div
            className="flex items-center justify-center rounded-lg flex-shrink-0"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: danger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(212, 175, 55, 0.15)',
              border: `1px solid ${danger ? 'rgba(239, 68, 68, 0.3)' : 'rgba(212, 175, 55, 0.3)'}`,
            }}
          >
            <AlertTriangle size={20} color={danger ? '#f87171' : '#D4AF37'} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white mb-1.5">{title}</h3>
            <p className="text-sm text-muted leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid #242424' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: '#1a1a1a', color: '#8A8A8A', border: '1px solid #242424' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            style={
              danger
                ? { backgroundColor: '#dc2626', color: '#FFFFFF', border: '1px solid #ef4444' }
                : {
                    background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)',
                    color: '#070707',
                    border: '1px solid #D4AF37',
                    fontWeight: 600,
                  }
            }
          >
            {isLoading && (
              <span
                className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
              />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

