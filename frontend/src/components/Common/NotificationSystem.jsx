import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2, AlertTriangle, AlertCircle, Info, HelpCircle,
  X, Check, Wifi, WifiOff, ShieldAlert, FileText, ArrowRight
} from 'lucide-react';
import { SYSTEM_MESSAGES } from '../../config/constants';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  // Confirm Dialog State
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDestructive: false,
    onConfirm: () => {},
    onCancel: () => {},
  });

  const lastNotifiedRef = useRef({});

  // Deduplication helper to prevent notification spamming
  const shouldNotify = (key, cooldownMs = 2500) => {
    const now = Date.now();
    const last = lastNotifiedRef.current[key] || 0;
    if (now - last < cooldownMs) return false;
    lastNotifiedRef.current[key] = now;
    return true;
  };

  // 1. Success Toast
  const success = useCallback((title, description) => {
    const key = `success_${title}`;
    if (!shouldNotify(key)) return;
    toast.success(title, {
      description,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      duration: 3500,
    });
  }, []);

  // 2. Error Toast
  const error = useCallback((title, description) => {
    const key = `error_${title}`;
    if (!shouldNotify(key)) return;
    toast.error(title, {
      description,
      icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
      duration: 5000,
    });
  }, []);

  // 3. Warning Toast
  const warning = useCallback((title, description) => {
    const key = `warn_${title}`;
    if (!shouldNotify(key)) return;
    toast.warning(title, {
      description,
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      duration: 4000,
    });
  }, []);

  // 4. Info Toast
  const info = useCallback((title, description) => {
    const key = `info_${title}`;
    if (!shouldNotify(key)) return;
    toast.info(title, {
      description,
      icon: <Info className="w-5 h-5 text-blue-500" />,
      duration: 3500,
    });
  }, []);

  // 5. High-Impact Confirm Dialog (Replaces browser confirm() & prompt())
  const confirm = useCallback(({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Proceed',
    cancelText = 'Cancel',
    isDestructive = false,
    onConfirm = () => {},
    onCancel = () => {},
  }) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      isDestructive,
      onConfirm: async () => {
        try {
          await onConfirm();
        } finally {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
      onCancel: () => {
        onCancel();
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  }, []);

  // 6. Domain-Specific Notification Helpers
  const studentRegistered = useCallback((name, code) => {
    success('Student Enrolled Successfully 🎓', `${name} has been enrolled under code ${code}.`);
  }, [success]);

  const attendanceSaved = useCallback((batchName, count) => {
    success('Attendance Synchronized ✅', `Recorded ${count} attendance punches for ${batchName}.`);
  }, [success]);

  const feePaid = useCallback((amount, studentName, receiptNo) => {
    success('Fee Payment Confirmed 💳', `₹${amount.toLocaleString()} received for ${studentName}. Receipt #${receiptNo}`);
  }, [success]);

  const apiError = useCallback((err, fallback = SYSTEM_MESSAGES.API_GENERIC_ERROR) => {
    const message = err?.response?.data?.message || err?.message || fallback;
    error('Operation Failed', message);
  }, [error]);

  const sessionExpired = useCallback(() => {
    warning('Session Expired', SYSTEM_MESSAGES.SESSION_EXPIRED);
  }, [warning]);

  // 7. Auto Network Health Monitoring
  useEffect(() => {
    const handleOnline = () => {
      success('Connection Restored 🌐', SYSTEM_MESSAGES.NETWORK_ONLINE);
    };

    const handleOffline = () => {
      warning('Internet Disconnected ⚠️', SYSTEM_MESSAGES.NETWORK_OFFLINE);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [success, warning]);

  const value = {
    success,
    error,
    warning,
    info,
    confirm,
    studentRegistered,
    attendanceSaved,
    feePaid,
    apiError,
    sessionExpired,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Modern Sonner Toast Container */}
      <Toaster
        position="top-right"
        richColors
        closeButton
        expand
        duration={4000}
        toastOptions={{
          style: {
            borderRadius: '16px',
            padding: '16px',
            fontSize: '13px',
            boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.12)',
            border: '1px solid #E2E8F0',
          },
        }}
      />

      {/* Interactive Framer-Motion Confirmation Dialog Modal */}
      <AnimatePresence>
        {confirmState.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={confirmState.onCancel}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 z-10"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmState.isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  {confirmState.isDestructive ? (
                    <ShieldAlert className="w-6 h-6" />
                  ) : (
                    <HelpCircle className="w-6 h-6" />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    {confirmState.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    {confirmState.message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={confirmState.onCancel}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
                >
                  {confirmState.cancelText}
                </button>
                <button
                  type="button"
                  onClick={confirmState.onConfirm}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-black shadow-lg transition-all transform active:scale-95 ${
                    confirmState.isDestructive
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/25'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25'
                  }`}
                >
                  {confirmState.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
};

export const useNotify = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotify must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationProvider;
