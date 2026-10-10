import React from 'react';
import { OpenBookSVG, GraduationCapSVG, PaperPlaneSVG } from '../Common/EducationalSVGs';

/**
 * ClasstechAnimatedBackground:
 * Multi-layer animated background system referenced from classtech.in
 * Features:
 * - Subtle geometric dot-matrix overlay (.bg-dot-pattern)
 * - 4 High-chroma ambient drifting blurred blobs (Indigo, Soft Sky, Violet, Emerald)
 * - Floating educational micro-motifs
 */
export const ClasstechAnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 select-none">
      
      {/* ─── 1. DOT-MATRIX GEOMETRIC GRID OVERLAY ─── */}
      <div className="absolute inset-0 bg-dot-pattern opacity-60"></div>

      {/* ─── 2. MULTI-COLOR DRIFTING AMBIENT BLOBS (from classtech.in) ─── */}
      {/* Blob 1: Primary Indigo / Brand (#4338CA) Top Left */}
      <div className="absolute -top-24 -left-20 w-[420px] h-[420px] sm:w-[600px] sm:h-[600px] bg-gradient-to-tr from-[#4338CA]/25 to-[#4F46E5]/15 rounded-full blur-[90px] animate-blob"></div>

      {/* Blob 2: Soft Sky Blue (#38BDF8 / #60A5FA) Top Right */}
      <div className="absolute top-10 -right-24 w-[380px] h-[380px] sm:w-[540px] sm:h-[540px] bg-gradient-to-bl from-[#38BDF8]/20 to-[#60A5FA]/15 rounded-full blur-[80px] animate-blob animation-delay-2000"></div>

      {/* Blob 3: Purple / Violet Accent (#A855F7) Center-Bottom */}
      <div className="absolute top-[45%] left-[25%] -translate-x-1/2 w-[400px] h-[400px] sm:w-[580px] sm:h-[580px] bg-gradient-to-r from-[#A855F7]/15 via-[#818CF8]/10 to-transparent rounded-full blur-[100px] animate-blob animation-delay-4000"></div>

      {/* Blob 4: Soft Emerald (#10B981) Mid-Right */}
      <div className="absolute top-[60%] -right-16 w-[320px] h-[320px] sm:w-[480px] sm:h-[480px] bg-gradient-to-l from-[#10B981]/15 to-[#34D399]/10 rounded-full blur-[90px] animate-blob animation-delay-6000"></div>

      {/* ─── 3. FLOATING EDUCATIONAL ACCENT MOTIFS ─── */}
      <div className="absolute top-16 left-6 lg:left-20 opacity-30 animate-float-slow transform -rotate-12">
        <OpenBookSVG className="w-12 h-12 text-[#4338CA]" color="#4338CA" />
      </div>

      <div className="absolute top-20 right-8 lg:right-24 opacity-35 animate-float-medium transform rotate-12">
        <GraduationCapSVG className="w-14 h-14 text-[#0EA5E9]" color="#0EA5E9" />
      </div>

      <div className="absolute top-[52%] left-4 lg:left-14 opacity-25 animate-float-fast transform rotate-6">
        <PaperPlaneSVG className="w-10 h-10 text-[#10B981]" color="#10B981" />
      </div>

      {/* Ambient Sparkles */}
      <div className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full bg-indigo-400 opacity-60 animate-ping"></div>
      <div className="absolute top-1/3 left-1/5 text-amber-400 font-black text-lg opacity-40 animate-pulse">✦</div>
      <div className="absolute top-2/3 right-1/6 text-indigo-400 font-black text-xl opacity-35 animate-pulse">✦</div>
      <div className="absolute bottom-1/4 left-1/3 w-2.5 h-2.5 rounded-full bg-sky-300 opacity-50"></div>
    </div>
  );
};

/**
 * ClasstechWaveDivider:
 * Flowing animated wave divider between landing page sections
 */
export const ClasstechWaveDivider = ({ flip = false, color = "#FFFFFF" }) => {
  return (
    <div className={`w-full overflow-hidden leading-none select-none pointer-events-none ${flip ? 'rotate-180 -mb-1' : '-mt-1'}`}>
      <svg 
        className="relative block w-[calc(100%+1.3px)] h-12 sm:h-16 text-white" 
        viewBox="0 0 1200 120" 
        preserveAspectRatio="none"
      >
        <path 
          d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,60 L1200,120 L0,120 Z" 
          fill={color}
          className="animate-wave-slow opacity-60"
        />
        <path 
          d="M0,20 C200,80 450,10 650,70 C850,130 1050,40 1200,80 L1200,120 L0,120 Z" 
          fill={color}
          className="animate-wave-medium opacity-80"
        />
        <path 
          d="M0,40 C300,10 600,90 900,30 C1050,0 1150,50 1200,40 L1200,120 L0,120 Z" 
          fill={color}
        />
      </svg>
    </div>
  );
};

export default ClasstechAnimatedBackground;
