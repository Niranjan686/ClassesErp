import React from 'react';

/**
 * OpenBookSVG: Minimalist animated open book illustration with gentle fluttering pages
 */
export const OpenBookSVG = ({ className = "w-12 h-12", color = "#4F46E5" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Book Spine / Cover */}
    <path 
      d="M32 52V18C32 18 24 14 8 14V48C24 48 32 52 32 52Z" 
      fill={color} 
      fillOpacity="0.12" 
      stroke={color} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path 
      d="M32 52V18C32 18 40 14 56 14V48C40 48 32 52 32 52Z" 
      fill={color} 
      fillOpacity="0.18" 
      stroke={color} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    {/* Page Lines */}
    <path d="M14 24C20 24 26 26 26 26" stroke={color} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
    <path d="M14 32C20 32 26 34 26 34" stroke={color} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
    <path d="M14 40C20 40 26 42 26 42" stroke={color} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
    <path d="M50 24C44 24 38 26 38 26" stroke={color} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
    <path d="M50 32C44 32 38 34 38 34" stroke={color} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
    <path d="M50 40C44 40 38 42 38 42" stroke={color} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
    {/* Book Ribbon */}
    <path d="M32 18V38L35 34L38 38V18" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

/**
 * GraduationCapSVG: Sleek modern mortarboard
 */
export const GraduationCapSVG = ({ className = "w-12 h-12", color = "#4F46E5" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M32 12L6 24L32 36L58 24L32 12Z" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M14 28V42C14 42 21 48 32 48C43 48 50 42 50 42V28" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Tassel */}
    <path d="M50 25.5V40" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    <circle cx="50" cy="42" r="2.5" fill="#F59E0B" />
  </svg>
);

/**
 * PaperPlaneSVG: Smooth aerodynamic learning motif
 */
export const PaperPlaneSVG = ({ className = "w-10 h-10", color = "#0284C7" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M6 24L42 8L28 42L22 28L6 24Z" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <path d="M22 28L42 8" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * EmptyStateIllustration: Tasteful academic empty state
 */
export const EmptyStateIllustration = ({ 
  title = "No data available", 
  description = "Get started by adding your first record.",
  action = null 
}) => (
  <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] my-4">
    <div className="relative mb-5">
      <div className="w-20 h-20 rounded-2xl bg-indigo-50/80 border border-indigo-100/60 flex items-center justify-center shadow-sm">
        <OpenBookSVG className="w-10 h-10" color="#4F46E5" />
      </div>
      <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 text-xs font-bold">
        ✦
      </div>
    </div>
    <h3 className="text-base font-bold text-slate-800 tracking-tight mb-1">{title}</h3>
    <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-5 leading-relaxed">{description}</p>
    {action && <div>{action}</div>}
  </div>
);

/**
 * FloatingEducationalElements: Gentle drifting academic accents for hero/landing
 */
export const FloatingEducationalElements = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
    {/* Floating Book top-left */}
    <div className="absolute top-12 left-6 lg:left-24 opacity-30 animate-float-slow transform -rotate-12">
      <OpenBookSVG className="w-12 h-12 text-indigo-400" color="#6366F1" />
    </div>

    {/* Floating Graduation Cap top-right */}
    <div className="absolute top-16 right-8 lg:right-28 opacity-35 animate-float-medium transform rotate-12">
      <GraduationCapSVG className="w-14 h-14 text-sky-400" color="#0EA5E9" />
    </div>

    {/* Floating Paper plane mid-left */}
    <div className="absolute top-1/2 left-4 lg:left-16 opacity-25 animate-float-fast transform rotate-6">
      <PaperPlaneSVG className="w-10 h-10 text-mint-500" color="#10B981" />
    </div>

    {/* Subtle Learning Star mid-right */}
    <div className="absolute top-2/3 right-10 lg:right-32 opacity-30 animate-pulse text-amber-400 text-2xl font-bold">
      ✦
    </div>

    {/* Small glowing dots */}
    <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-indigo-300 opacity-40"></div>
    <div className="absolute bottom-20 left-1/3 w-2.5 h-2.5 rounded-full bg-sky-300 opacity-40"></div>
    <div className="absolute top-20 left-1/2 w-1.5 h-1.5 rounded-full bg-emerald-300 opacity-50"></div>
  </div>
);
