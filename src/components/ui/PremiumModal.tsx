
import React from 'react';
import { createPortal } from 'react-dom';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'alert' | 'confirm' | 'success' | 'error';
  confirmText?: string;
  cancelText?: string;
}

const PremiumModal: React.FC<PremiumModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'alert',
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: (
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-[32px] flex items-center justify-center text-emerald-500 mb-8 mx-auto">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ),
          buttonClass: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20",
        };
      case 'error':
      case 'confirm':
        return {
          icon: (
            <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center mb-8 mx-auto ${type === 'error' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-500'}`}>
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          ),
          buttonClass: type === 'error' ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20" : "bg-slate-900 dark:bg-indigo-600 hover:bg-black dark:hover:bg-indigo-700 shadow-slate-900/30 dark:shadow-indigo-500/20",
        };
      default: // alert
        return {
          icon: (
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-[32px] flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-8 mx-auto">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          ),
          buttonClass: "bg-slate-900 dark:bg-indigo-600 hover:bg-black dark:hover:bg-indigo-700 shadow-slate-900/30 dark:shadow-indigo-500/20",
        };
    }
  };

  const styles = getTypeStyles();

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-6">
      <div className="bg-white dark:bg-slate-900 rounded-[48px] p-10 lg:p-12 max-w-md w-full shadow-2xl border border-slate-100 dark:border-white/5 relative overflow-hidden">
        {/* Aesthetic decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16"></div>
        
        {styles.icon}
        
        <div className="text-center mb-10 relative z-10">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic mb-3">{title}</h3>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex flex-col space-y-4 relative z-10">
          {type === 'confirm' ? (
            <>
              <button
                onClick={() => {
                  onConfirm?.();
                  onClose();
                }}
                className={`w-full py-5 text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${styles.buttonClass}`}
              >
                {confirmText}
              </button>
              <button
                onClick={onClose}
                className="w-full py-5 bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
              >
                {cancelText}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className={`w-full py-5 text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${styles.buttonClass}`}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PremiumModal;
