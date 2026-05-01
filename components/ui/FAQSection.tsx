"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  items: FAQItem[];
}

export default function FAQSection({ items }: FAQSectionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setActiveIndex((current) => (current === index ? null : index));
  };

  return (
    <section className="w-full py-20 md:py-28 flex justify-center">
      <div className="container px-4 md:px-6">
        <div className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">FAQs</p>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
            Clear answers, fast response
          </h3>
          <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl mx-auto">
            Everything you need to know about submitting reports, response times, and data privacy.
          </p>
        </div>

        <div className="mt-10 grid gap-4 max-w-3xl mx-auto">
          {items.map((item, index) => {
            const isOpen = activeIndex === index;
            return (
              <motion.div
                layout
                key={item.question}
                className="rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm shadow-[0_5px_10px_rgba(0,0,0,0.05)] overflow-hidden"
                transition={{
                  layout: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleIndex(index)}
                  className="relative w-full text-left"
                >
                  <div className="flex items-center px-5 sm:px-6 py-4 pr-16 text-base sm:text-lg font-semibold text-black">
                    {item.question}
                  </div>
                  <span
                    className={`absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-3xl text-slate-500 transition-transform duration-200 ${
                      isOpen ? "rotate-45 text-black" : "rotate-0"
                    }`}
                  >
                    +
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 sm:px-6 pb-5 text-sm sm:text-base text-slate-600 leading-relaxed">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
