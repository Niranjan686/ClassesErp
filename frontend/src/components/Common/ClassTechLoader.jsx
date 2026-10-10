import React from 'react';
import { motion } from 'framer-motion';

/**
 * Signature ClassTech Animated Loader
 * Concept:
 * 1. Minimal open-book outline smoothly draws itself with SVG stroke-dasharray.
 * 2. Two inner pages unfold with a subtle 3D-like rotation.
 * 3. Glowing educational spark (✦) pulses gently above the book.
 * 4. ClassTech wordmark and subtle progress bar indicate live loading.
 */
export const ClassTechLoader = ({ 
  message = "Loading ClassTech OS...", 
  size = "default", // "small" | "default" | "large"
  fullScreen = false,
  inline = false
}) => {
  const scale = size === "small" ? 0.8 : size === "large" ? 1.2 : 1;

  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none" style={{ transform: `scale(${scale})` }}>
      
      {/* ─── ANIMATED SVG BOOK & EDUCATIONAL SPARK ─── */}
      <div className="relative w-24 h-24 flex items-center justify-center mb-3">
        
        {/* Glowing Ambient Radial Backdrop */}
        <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl animate-pulse pointer-events-none"></div>

        {/* Floating Spark (✦) */}
        <motion.div
          animate={{
            y: [-3, -9, -3],
            opacity: [0.75, 1, 0.75],
            scale: [0.95, 1.15, 0.95],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-1 text-[#F59E0B] text-lg font-black drop-shadow-sm z-10"
        >
          ✦
        </motion.div>

        {/* SVG Drawing Book & Turning Pages */}
        <svg
          className="w-20 h-20 text-[#4338CA]"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base Book Spine & Left Page Cover */}
          <motion.path
            d="M40 62V24C40 24 30 18 12 18V54C30 54 40 62 40 62Z"
            stroke="#4338CA"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="#EEF2FF"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          {/* Right Page Cover */}
          <motion.path
            d="M40 62V24C40 24 50 18 68 18V54C50 54 40 62 40 62Z"
            stroke="#4338CA"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="#EEF2FF"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          />

          {/* Left Page Ruled Lines */}
          <path d="M20 30H32" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />
          <path d="M20 38H32" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />
          <path d="M20 46H28" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />

          {/* Right Page Ruled Lines */}
          <path d="M48 30H60" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />
          <path d="M48 38H60" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />
          <path d="M52 46H60" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />

          {/* 3D Animated Unfolding Page */}
          <motion.path
            d="M40 62V24C40 24 48 19 64 21V55C48 55 40 62 40 62Z"
            fill="#6366F1"
            fillOpacity="0.2"
            stroke="#6366F1"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{
              skewY: [-4, 4, -4],
              scaleX: [1, 0.92, 1],
              opacity: [0.6, 0.95, 0.6]
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Golden Bookmark Ribbon */}
          <path d="M40 24V44L43.5 40L47 44V24" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </div>

      {/* ─── CLASSTECH WORDMARK & LIVE LOADING BAR ─── */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="flex flex-col items-center"
      >
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-sm tracking-tight text-[#172033] font-display">
            ClassTech
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
        </div>

        <p className="text-[11px] font-semibold text-[#64748B] mt-0.5">
          {message}
        </p>

        {/* Minimalist Micro Progress Line */}
        <div className="w-24 h-1 bg-[#E8EDF4] rounded-full mt-2.5 overflow-hidden relative">
          <motion.div
            className="absolute top-0 bottom-0 bg-[#4338CA] rounded-full"
            animate={{
              left: ["-40%", "100%"],
              width: ["40%", "30%"]
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </motion.div>

    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F8FAFC]/95 backdrop-blur-md flex items-center justify-center">
        {content}
      </div>
    );
  }

  if (inline) {
    return content;
  }

  return (
    <div className="w-full py-12 flex items-center justify-center">
      {content}
    </div>
  );
};

/**
 * SkeletonCard: Minimalist card skeleton for content-heavy dashboard areas with shimmer
 */
export const SkeletonCard = ({ height = "h-32", className = "" }) => (
  <div className={`bg-white rounded-2xl border border-[#E8EDF4] p-5 animate-shimmer ${height} ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 w-28 bg-slate-100 rounded-lg"></div>
      <div className="h-8 w-8 bg-slate-100 rounded-xl"></div>
    </div>
    <div className="h-8 w-20 bg-slate-100 rounded-xl mb-2"></div>
    <div className="h-3 w-36 bg-slate-100 rounded-md"></div>
  </div>
);

/**
 * SkeletonTable: Minimalist table rows skeleton with shimmer
 */
export const SkeletonTable = ({ rows = 5 }) => (
  <div className="bg-white rounded-2xl border border-[#E8EDF4] p-4 animate-shimmer space-y-3">
    <div className="h-6 w-48 bg-slate-100 rounded-lg mb-4"></div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100"></div>
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 bg-slate-100 rounded-md"></div>
            <div className="h-2.5 w-20 bg-slate-100 rounded-md"></div>
          </div>
        </div>
        <div className="h-6 w-16 bg-slate-100 rounded-lg"></div>
      </div>
    ))}
  </div>
);

export default ClassTechLoader;
