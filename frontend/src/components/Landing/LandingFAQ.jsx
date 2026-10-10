import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';

/**
 * LandingFAQ:
 * Animated FAQ Accordion section with accessible open/close states
 */
const LandingFAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'How quickly can our school onboard to ClassTech?',
      a: 'Most schools go live in under 15 minutes. Simply register your campus, define your classroom batches and fee heads, and import your student roster via Excel/CSV or single-entry admission dossiers.'
    },
    {
      q: 'Does ClassTech support multi-tenant database isolation and data privacy?',
      a: 'Yes, every school campus operates in a dedicated multi-tenant environment with isolated tenant codes and 256-bit encryption. Student, fee, and academic data remain strictly confidential and protected.'
    },
    {
      q: 'Can parents and students access ClassTech on their smartphones?',
      a: 'Absolutely. The ClassTech companion app is available on iOS, Android, and mobile web browsers. Parents log in securely using their registered mobile number to track daily attendance, digital fee receipts, homework, and notices.'
    },
    {
      q: 'How does the automated absent SMS gateway work?',
      a: 'When a teacher completes 1-click batch attendance, ClassTech automatically detects absent students and triggers instant SMS broadcasts to their registered parents without requiring any manual phone calls.'
    },
    {
      q: 'Can we migrate our existing student data from spreadsheets or legacy software?',
      a: 'Yes! ClassTech includes built-in 1-click CSV/Excel import tools for student directories, fee ledgers, and staff records. Our customer success team also assists with complimentary migration.'
    },
    {
      q: 'Is any proprietary biometric or RFID hardware required?',
      a: 'No expensive proprietary hardware is required. Teachers and administrators can mark attendance directly from any smartphone, tablet, or laptop browser with 1-click roll call.'
    }
  ];

  return (
    <section className="py-20 bg-white border-t border-[#E8EDF4]" id="faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="px-3.5 py-1 rounded-full bg-[#EEF2FF] text-[#4338CA] text-xs font-bold border border-[#E0E7FF] inline-flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#172033] tracking-tight mt-3 font-display">
            Everything you need to know.
          </h2>
          <p className="text-sm text-[#64748B] mt-2">
            Clear answers about implementing ClassTech in your school or coaching institute.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;

            return (
              <div
                key={i}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen 
                    ? 'bg-white border-[#C7D2FE] shadow-md ring-1 ring-[#4338CA]/10' 
                    : 'bg-[#F8FAFC] border-[#E8EDF4] hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full p-5 flex items-center justify-between text-left transition-colors"
                >
                  <span className="text-sm sm:text-base font-bold text-[#172033] pr-4">
                    {faq.q}
                  </span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 ${
                    isOpen ? 'bg-[#EEF2FF] text-[#4338CA] rotate-180' : 'bg-slate-100 text-[#64748B]'
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#64748B] leading-relaxed border-t border-slate-100">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default LandingFAQ;
