import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

/**
 * PageTransition: Staggered smooth fade-and-slide page enter wrapper
 */
export const PageTransition = ({ children, className = "" }) => {
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full ${className}`}
    >
      {children}
    </motion.div>
  );
};

/**
 * StaggerContainer & StaggerItem: Clean sequential reveal for lists & card grids
 */
export const StaggerContainer = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial="hidden"
    animate="show"
    variants={{
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: 0.05,
          delayChildren: delay,
        }
      }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className = "" }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 10 },
      show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

/**
 * CardMotion: Tactile interactive card wrapper with smooth hover lift and press
 */
export const CardMotion = ({ children, className = "", onClick, ...props }) => (
  <motion.div
    whileHover={{ y: -2, transition: { duration: 0.2, ease: "easeOut" } }}
    whileTap={onClick ? { scale: 0.99, transition: { duration: 0.1 } } : undefined}
    onClick={onClick}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * ButtonMotion: Tactile micro-spring press for action buttons
 */
export const ButtonMotion = ({ children, className = "", ...props }) => (
  <motion.button
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.15 }}
    className={className}
    {...props}
  >
    {children}
  </motion.button>
);

/**
 * Trigger Celebratory Micro Confetti
 */
export const triggerAcademicConfetti = () => {
  try {
    confetti({
      particleCount: 40,
      spread: 55,
      origin: { y: 0.65 },
      colors: ['#4338CA', '#60A5FA', '#10B981', '#F59E0B'],
      disableForReducedMotion: true
    });
  } catch (e) {}
};

/**
 * SuccessCheckmark: Self-drawing animated SVG checkmark
 */
export const SuccessCheckmark = ({ size = 52, color = "#10B981" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 52 52"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mx-auto"
  >
    {/* Circle Background Outline */}
    <motion.circle
      cx="26"
      cy="26"
      r="23"
      stroke={color}
      strokeWidth="3.5"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      fill="#ECFDF5"
    />
    {/* Animated Drawing Checkmark */}
    <motion.path
      d="M16 27L23 34L36 19"
      stroke={color}
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.32, delay: 0.22, ease: "easeOut" }}
    />
  </svg>
);

/**
 * SuccessModal: Reusable action success popover (Registration, Fee Collection, Attendance Saved)
 */
export const SuccessModal = ({ 
  isOpen, 
  title = "Operation Successful", 
  message = "Changes saved to school database.", 
  onClose,
  actionLabel = "Continue" 
}) => {
  React.useEffect(() => {
    if (isOpen) {
      triggerAcademicConfetti();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-2xl shadow-modal border border-[#E8EDF4] max-w-sm w-full p-6 text-center"
        >
          <div className="mb-4">
            <SuccessCheckmark />
          </div>

          <h3 className="text-lg font-bold text-[#172033] tracking-tight">{title}</h3>
          <p className="text-xs text-[#64748B] mt-1.5 mb-6 leading-relaxed">{message}</p>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
          >
            {actionLabel}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PageTransition;
