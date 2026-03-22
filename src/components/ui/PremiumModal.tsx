
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
  data?: {
    amount?: number;
    client?: string;
    reference?: string;
    date?: string;
  };
}

const PremiumModal: React.FC<PremiumModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'alert',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  data
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: (
            <div className="relative mb-8 transform hover:scale-110 transition-transform duration-700">
              <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-2xl animate-pulse"></div>
              <div className="relative w-28 h-28 bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 rounded-[42px] flex items-center justify-center text-white shadow-[0_25px_60px_-15px_rgba(16,185,129,0.6)] border border-white/20 z-20">
                <svg className="w-14 h-14 animate-in zoom-in-50 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {/* Particles */}
              {[...Array(12)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-particle origin-center"
                  style={{
                    '--tw-translate-x': `${(Math.random() - 0.5) * 200}px`,
                    '--tw-translate-y': `${(Math.random() - 0.5) * 200}px`,
                    animationDelay: `${Math.random() * 0.2}s`
                  } as any}
                ></div>
              ))}
            </div>
          ),
          buttonClass: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/30",
          glowColor: "from-emerald-500/20 to-teal-500/0",
          accentColor: "border-emerald-500/30",
        };
      // ... (rest of getTypeStyles cases remain largely same visually, but adjusting icon margin)
      case 'error':
        return {
          icon: (
            <div className="relative mb-8 transform hover:scale-110 transition-transform duration-700">
              <div className="absolute inset-0 bg-rose-500/30 rounded-full blur-2xl animate-pulse"></div>
              <div className="relative w-28 h-28 bg-gradient-to-br from-rose-400 via-red-500 to-rose-600 rounded-[42px] flex items-center justify-center text-white shadow-[0_25px_60px_-15px_rgba(225,29,72,0.6)] border border-white/20 z-20">
                <svg className="w-14 h-14 animate-in zoom-in-50 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              {/* Error Particles */}
              {[...Array(12)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-rose-400 rounded-full animate-particle origin-center"
                  style={{
                    '--tw-translate-x': `${(Math.random() - 0.5) * 200}px`,
                    '--tw-translate-y': `${(Math.random() - 0.5) * 200}px`,
                    animationDelay: `${Math.random() * 0.2}s`
                  } as any}
                ></div>
              ))}
            </div>
          ),
          buttonClass: "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-600/30",
          glowColor: "from-rose-500/20 to-red-500/0",
          accentColor: "border-rose-500/30",
        };
      case 'confirm':
        return {
          icon: (
            <div className="relative mb-8 transform hover:scale-110 transition-transform duration-700">
              <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-2xl animate-pulse"></div>
              <div className="relative w-28 h-28 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 rounded-[42px] flex items-center justify-center text-white shadow-[0_25px_60px_-15px_rgba(245,158,11,0.6)] border border-white/20">
                <svg className="w-14 h-14 animate-in zoom-in-50 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          ),
          buttonClass: "bg-slate-900 dark:bg-indigo-600 hover:bg-black dark:hover:bg-indigo-700 shadow-indigo-500/30",
          glowColor: "from-amber-500/20 to-orange-500/0",
          accentColor: "border-amber-500/30",
        };
      default: // alert
        return {
          icon: (
            <div className="relative mb-8 transform hover:scale-110 transition-transform duration-700">
              <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-2xl animate-pulse"></div>
              <div className="relative w-28 h-28 bg-gradient-to-br from-indigo-400 via-violet-500 to-indigo-600 rounded-[42px] flex items-center justify-center text-white shadow-[0_25px_60px_-15px_rgba(79,70,229,0.6)] border border-white/20">
                <svg className="w-14 h-14 animate-in zoom-in-50 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          ),
          buttonClass: "bg-slate-900 dark:bg-indigo-600 hover:bg-black dark:hover:bg-indigo-700 shadow-indigo-500/30",
          glowColor: "from-indigo-500/20 to-violet-500/0",
          accentColor: "border-indigo-500/30",
        };
    }
  };

  const styles = getTypeStyles();

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/40 dark:bg-black/80 backdrop-blur-[20px] flex items-center justify-center z-[9999] p-6 animate-in fade-in duration-700">
      <div className={`bg-white/80 dark:bg-slate-950/80 backdrop-blur-[40px] rounded-[64px] p-8 lg:p-12 max-w-sm lg:max-w-md w-full shadow-[0_80px_160px_-30px_rgba(0,0,0,0.7)] border ${styles.accentColor} relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-20 duration-700 ${type === 'error' ? 'animate-shake' : ''}`}>
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        
        {/* Error Scanline (Error Only) */}
        {type === 'error' && (
          <div className="absolute inset-x-0 top-1/2 h-[2px] bg-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.8)] z-30 animate-error-scan pointer-events-none"></div>
        )}

        <div className={`absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-br ${styles.glowColor} rounded-full blur-[100px] animate-pulse`}></div>
        <div className={`absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr ${styles.glowColor} rounded-full blur-[100px] opacity-40 animate-pulse`}></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          {styles.icon}
          
          <div className="mb-8">
            <h3 className="text-3xl lg:text-4xl font-black text-slate-950 dark:text-white tracking-tighter uppercase italic mb-3 leading-none bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-600 dark:from-white dark:to-slate-500">
              {title}
            </h3>
            <p className="text-[11px] lg:text-[12px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] leading-relaxed max-w-[320px] mx-auto opacity-70 italic">
              {message}
            </p>
          </div>

          {/* Digital Receipt Card (Success Only) */}
          {type === 'success' && data && (
            <div className="w-full mb-10 bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white dark:border-white/10 shadow-lg animate-receipt">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-white/5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Digital Receipt</span>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[8px] font-black uppercase tracking-widest whitespace-nowrap">Verified</span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-left">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Client Resource</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase italic">{data.client}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Protocol ID</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white">{data.reference}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-end">
                   <div className="text-left space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Settlement Amount</p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 italic">₹{data.amount?.toLocaleString('en-IN')}</p>
                  </div>
                  <p className="text-[9px] font-medium text-slate-400 italic opacity-50">{data.date}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-4 w-full">
            {type === 'confirm' ? (
              <>
                <button
                  onClick={() => {
                    onConfirm?.();
                    onClose();
                  }}
                  className={`w-full py-6 text-white rounded-[28px] text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-3xl active:scale-95 flex items-center justify-center gap-4 ${styles.buttonClass} group`}
                >
                  {confirmText}
                  <span className="opacity-40 group-hover:translate-x-1 transition-transform tracking-tighter">→</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-6 bg-slate-100/50 dark:bg-white/5 text-slate-500 dark:text-slate-500 rounded-[28px] text-[12px] font-black uppercase tracking-[0.3em] hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-950 dark:hover:text-white transition-all active:scale-95 border border-slate-200/50 dark:border-white/5"
                >
                  {cancelText}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className={`w-full py-6 text-white rounded-[28px] text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-3xl active:scale-95 flex items-center justify-center gap-4 ${styles.buttonClass} group`}
              >
                PROCEED
                <span className="opacity-40 group-hover:translate-x-1 transition-transform tracking-tighter">→</span>
              </button>
            )}
          </div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[200%] -top-full animate-[scanline_8s_linear_infinite] pointer-events-none"></div>
      </div>
    </div>,
    document.body
  );
};

export default PremiumModal;
