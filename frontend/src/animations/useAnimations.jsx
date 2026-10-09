import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import anime from 'animejs';

/**
 * GSAP Page Transition Hook
 * Runs smooth fade + y-translate on page mount
 */
export const usePageTransition = (containerRef) => {
  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [containerRef]);
};

/**
 * GSAP Stagger Reveal Hook for Dashboard Cards and Lists
 */
export const useStaggerReveal = (containerRef, selector = '.stagger-item', delay = 0.05) => {
  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        selector,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger: delay,
          ease: 'power2.out',
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [containerRef, selector, delay]);
};

/**
 * AnimatedCounter Component powered by Anime.js
 */
export const AnimatedCounter = ({ value, prefix = '', suffix = '', duration = 1200, decimals = 0, className = '' }) => {
  const countRef = useRef(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const obj = { val: prevValue.current };

    const anim = anime({
      targets: obj,
      val: target,
      round: decimals > 0 ? Math.pow(10, decimals) : 1,
      easing: 'easeOutExpo',
      duration: duration,
      update: () => {
        if (countRef.current) {
          const formatted = decimals > 0 
            ? obj.val.toFixed(decimals) 
            : Math.round(obj.val).toLocaleString();
          countRef.current.innerText = `${prefix}${formatted}${suffix}`;
        }
      },
      complete: () => {
        prevValue.current = target;
      }
    });

    return () => anim.pause();
  }, [value, prefix, suffix, duration, decimals]);

  return <span ref={countRef} className={className}>{prefix}0{suffix}</span>;
};

/**
 * ProgressRing Component powered by Anime.js SVG stroke animation
 */
export const ProgressRing = ({ 
  percentage = 0, 
  size = 110, 
  strokeWidth = 9, 
  color = '#2563eb', 
  trackColor = '#e2e8f0', 
  label = '', 
  sublabel = '' 
}) => {
  const circleRef = useRef(null);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const validPct = Math.min(Math.max(Number(percentage) || 0, 0), 100);
    const offset = circumference - (validPct / 100) * circumference;

    const anim = anime({
      targets: circleRef.current,
      strokeDashoffset: [circumference, offset],
      easing: 'easeInOutCubic',
      duration: 1200,
    });

    return () => anim.pause();
  }, [percentage, circumference]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-black text-slate-800 dark:text-slate-100">
          <AnimatedCounter value={percentage} suffix="%" duration={1200} />
        </span>
        {label && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>}
        {sublabel && <span className="text-[9px] text-slate-400">{sublabel}</span>}
      </div>
    </div>
  );
};

/**
 * Animated Success Checkmark for forms, attendance, and fee payments
 */
export const SuccessCheck = ({ size = 64, color = '#10b981' }) => {
  const pathRef = useRef(null);
  const circleRef = useRef(null);

  useEffect(() => {
    anime.timeline({ easing: 'easeOutElastic(1, .8)' })
      .add({
        targets: circleRef.current,
        scale: [0, 1],
        opacity: [0, 1],
        duration: 500
      })
      .add({
        targets: pathRef.current,
        strokeDashoffset: [anime.setDashoffset, 0],
        duration: 400,
        easing: 'easeOutQuad'
      }, '-=200');
  }, []);

  return (
    <div className="inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 52 52">
        <circle
          ref={circleRef}
          cx="26"
          cy="26"
          r="25"
          fill="none"
          stroke={color}
          strokeWidth="3"
        />
        <path
          ref={pathRef}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 27l7 7 16-16"
        />
      </svg>
    </div>
  );
};

/**
 * Live Pulse Indicator
 */
export const LiveBadge = ({ text = "LIVE NOW" }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-600 border border-rose-200">
    <span className="w-2 h-2 rounded-full bg-rose-500 live-pulse"></span>
    {text}
  </span>
);
