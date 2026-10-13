import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, ChevronLeft, X, Check, HelpCircle, Compass } from 'lucide-react';
import { ONBOARDING_CONFIG, USER_ROLES } from '../../config/constants';

const GuidedOnboardingTour = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [roleSteps, setRoleSteps] = useState([]);

  // Check if current user has already completed onboarding
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    try {
      const user = JSON.parse(userStr);
      const isCompleted = localStorage.getItem(`${ONBOARDING_CONFIG.STORAGE_KEY}_${user._id || user.id || 'default'}`);

      // Determine steps based on role
      const steps = user.role === USER_ROLES.STUDENT 
        ? ONBOARDING_CONFIG.STUDENT_STEPS 
        : ONBOARDING_CONFIG.ADMIN_STEPS;

      setRoleSteps(steps);

      // Auto-start for first-time login
      if (!isCompleted && steps && steps.length > 0) {
        const timer = setTimeout(() => {
          setIsActive(true);
        }, 1200); // 1.2s delay for dashboard to mount smoothly
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn('Onboarding state parse error:', e);
    }
  }, []);

  // Listen for manual restart event (e.g. from Help / Profile menu)
  useEffect(() => {
    const handleRestart = () => {
      setCurrentStepIndex(0);
      setIsActive(true);
    };
    window.addEventListener('restart-classtech-tour', handleRestart);
    return () => window.removeEventListener('restart-classtech-tour', handleRestart);
  }, []);

  // Measure target element position
  const updateTargetPosition = useCallback(() => {
    if (!isActive || !roleSteps[currentStepIndex]) return;

    const step = roleSteps[currentStepIndex];
    const element = document.getElementById(step.targetId);

    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
      });
      // Scroll element smoothly into view if offscreen
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      // Fallback: Centered modal if target is not on current page
      setTargetRect(null);
    }
  }, [isActive, currentStepIndex, roleSteps]);

  useEffect(() => {
    updateTargetPosition();
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition);
    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition);
    };
  }, [updateTargetPosition]);

  const handleNext = () => {
    if (currentStepIndex < roleSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    setIsActive(false);
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        localStorage.setItem(`${ONBOARDING_CONFIG.STORAGE_KEY}_${user._id || user.id || 'default'}`, 'true');
      } catch (e) {}
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  if (!isActive || roleSteps.length === 0) return null;

  const currentStep = roleSteps[currentStepIndex];

  // Calculate tooltip popover positioning relative to target element
  const getPopoverStyle = () => {
    if (!targetRect || typeof window === 'undefined') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const margin = 16;
    const popoverWidth = 340;
    const isMobile = window.innerWidth < 640;

    if (isMobile) {
      return {
        position: 'fixed',
        bottom: '24px',
        left: '16px',
        right: '16px',
        margin: '0 auto',
      };
    }

    // Default: Display below the target, or above if near screen bottom
    const fitsBelow = targetRect.bottom + 220 < window.innerHeight;
    const top = fitsBelow ? targetRect.bottom + margin : Math.max(margin, targetRect.top - 230);
    const left = Math.min(Math.max(margin, targetRect.left), window.innerWidth - popoverWidth - margin);

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${popoverWidth}px`,
    };
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none select-none">
        
        {/* Semi-transparent Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] pointer-events-auto"
          onClick={handleSkip}
        />

        {/* Glowing Cutout Highlight over the Target Element */}
        {targetRect && (
          <motion.div
            layoutId="onboardingHighlight"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
            }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed rounded-2xl border-2 border-indigo-400 bg-white/10 ring-4 ring-indigo-500/20 shadow-2xl pointer-events-none"
          />
        )}

        {/* Interactive Guided Tooltip Popover */}
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.25 }}
          style={getPopoverStyle()}
          className="pointer-events-auto bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 text-slate-800 z-10"
        >
          {/* Header Row: Badge & Close */}
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Step {currentStepIndex + 1} of {roleSteps.length}
            </span>

            <button
              onClick={handleSkip}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Skip Tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title & Description */}
          <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
            {currentStep.title}
          </h4>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            {currentStep.description}
          </p>

          {/* Dots & Navigation Controls */}
          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {roleSteps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStepIndex
                      ? 'w-6 bg-indigo-600'
                      : i < currentStepIndex
                      ? 'w-1.5 bg-indigo-200'
                      : 'w-1.5 bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all"
                  title="Previous Step"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/25 flex items-center gap-1.5 transition-all transform active:scale-95"
              >
                <span>{currentStepIndex === roleSteps.length - 1 ? 'Finish' : 'Next'}</span>
                {currentStepIndex === roleSteps.length - 1 ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GuidedOnboardingTour;
