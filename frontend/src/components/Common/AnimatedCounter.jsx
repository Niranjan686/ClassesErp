import React, { useEffect, useState, useRef } from 'react';

/**
 * AnimatedCounter: Smooth count-up animation for metrics & stats
 */
export const AnimatedCounter = ({ value, duration = 1200, prefix = '', suffix = '', decimals = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const target = typeof value === 'number' ? value : parseFloat(value) || 0;
  const countRef = useRef(null);

  useEffect(() => {
    let startTimestamp = null;
    const startValue = displayValue;
    const change = target - startValue;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || duration === 0) {
      setDisplayValue(target);
      return;
    }

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out expo formula for natural deceleration
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startValue + change * easeOut;
      
      setDisplayValue(current);

      if (progress < 1) {
        countRef.current = window.requestAnimationFrame(step);
      }
    };

    countRef.current = window.requestAnimationFrame(step);

    return () => {
      if (countRef.current) cancelAnimationFrame(countRef.current);
    };
  }, [target, duration]);

  const formatted = decimals > 0 
    ? displayValue.toFixed(decimals) 
    : Math.round(displayValue).toLocaleString();

  return <span>{prefix}{formatted}{suffix}</span>;
};

export default AnimatedCounter;
