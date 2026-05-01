"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldAlert, BarChart3, Users, Activity, ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const faqs = [
  {
    question: "How do I verify my email?",
    answer:
      "Click the link in the verification email from verify@codepen.io (check spam or other tabs if needed). Or email verify@codepen.io with the subject \"Verify\" from your account email.",
  },
  {
    question: "My report loads indefinitely or crashes.",
    answer:
      "It is usually caused by an infinite loop or unstable client data. Refresh the page and re-enter details. If the issue persists, capture a screenshot and contact support.",
  },
  {
    question: "How do I contact the response coordinator?",
    answer:
      "Use the dashboard messaging panel or the incident details view to leave a comment for the assigned coordinator.",
  },
  {
    question: "What data sources are supported?",
    answer:
      "We maintain a continuously updated list of supported integrations and data feeds for incident tracking.",
  },
  {
    question: "What are incident forks?",
    answer:
      "A fork is a complete copy of an incident report or response plan that you can duplicate and customize for a new scenario.",
  },
];

export default function Home() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setActiveIndex((current) => (current === index ? null : index));
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-500/30 overflow-hidden relative">
      {/* Background Blurs / Glows (Light theme style matching Qvery) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-pink-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 transition-all pointer-events-none" />

      {/* Floating Pill Navbar */}
      <header className="fixed top-4 left-0 right-0 z-50 w-full px-4 flex justify-center pointer-events-none">
        <div className="w-full max-w-6xl bg-[#FFFFFF] rounded-xl shadow-sm border border-slate-200 flex h-16 items-center justify-between px-4 sm:px-6 pointer-events-auto">
          
          {/* Logo Section */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center bg-teal-400 text-white p-1 rounded-full shadow-sm">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-black">Respond MIS</span>
          </div>
          
          {/* Centered Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-[15px] font-medium text-black">
            <div className="flex items-center gap-1 cursor-pointer hover:text-slate-600 transition-colors">
              Operations <ChevronDown className="h-4 w-4 text-slate-500" />
            </div>
            <div className="flex items-center gap-1 cursor-pointer hover:text-slate-600 transition-colors">
              Sectors <ChevronDown className="h-4 w-4 text-slate-500" />
            </div>
            <Link href="/dashboard/finance" className="cursor-pointer hover:text-slate-600 transition-colors">
              Finances
            </Link>
            <div className="flex items-center gap-1 cursor-pointer hover:text-slate-600 transition-colors">
              Resources <ChevronDown className="h-4 w-4 text-slate-500" />
            </div>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link href="/signup" className="hidden sm:inline-flex h-9 items-center justify-center rounded-md bg-[#051522] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0a243a]">
              Sign Up
            </Link>
            <Link href="/login" className="inline-flex h-9 items-center justify-center rounded-md border-2 border-slate-200 bg-[#FFFFFF] px-5 text-sm font-semibold text-black transition-colors hover:bg-slate-50 hover:border-slate-300">
              Log In
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 pt-24">
        <section className="w-full py-20 md:py-32 lg:py-48 flex items-center justify-center">
          <div className="container px-4 md:px-6 flex flex-col items-center text-center space-y-10 animate-fade-in-up">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 backdrop-blur-md mb-4 shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
              <Sparkles className="mr-2 h-3.5 w-3.5 text-teal-500" />
              <span>Next-Gen Incident Management</span>
            </div>
            <div className="space-y-6 max-w-[800px]">
              <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl text-black">
                Smart Disaster <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-500">
                  Response MIS
                </span>
              </h1>
              <p className="mx-auto max-w-[600px] text-lg text-slate-600 md:text-xl/relaxed lg:text-xl/relaxed leading-relaxed font-medium">
                A highly secure, real-time management information system for tracking emergencies, managing rescues, and coordinating resources efficiently.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/report" className="relative group inline-flex h-12 items-center justify-center rounded-md bg-[#051522] px-8 text-base font-semibold text-white shadow-lg transition-all hover:scale-105 hover:bg-[#0a243a]">
                <ShieldAlert className="mr-2 h-5 w-5" />
                Report Incident
              </Link>
              <Link href="/dashboard" className="relative group inline-flex h-12 items-center justify-center rounded-md border-2 border-slate-200 bg-[#FFFFFF] px-8 text-base font-semibold text-black shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 hover:scale-105">
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5 text-slate-400 group-hover:text-black transition-colors group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-16 md:py-24 border-t border-slate-200 bg-white/50 backdrop-blur-sm flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4 animate-[fade-in-up_1s_ease-out_0.2s_both] opacity-0">
              
              <div className="group flex flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-slate-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-400/10 rounded-full blur-3xl transition-opacity opacity-0 group-hover:opacity-100" />
                <Activity className="h-8 w-8 text-pink-500" />
                <h3 className="text-xl font-bold text-black tracking-tight">Real-time Coordination</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Track emergencies, teams, and resources in real-time with continuous AI-driven updates.</p>
              </div>

              <div className="group flex flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-slate-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl transition-opacity opacity-0 group-hover:opacity-100" />
                <BarChart3 className="h-8 w-8 text-blue-500" />
                <h3 className="text-xl font-bold text-black tracking-tight">Advanced Analytics</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Insightful dashboards directly reflecting current operations and financial statuses.</p>
              </div>

              <div className="group flex flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-slate-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl transition-opacity opacity-0 group-hover:opacity-100" />
                <Users className="h-8 w-8 text-teal-500" />
                <h3 className="text-xl font-bold text-black tracking-tight">Role-Based Access</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Robust RBAC ensuring admins, operators, field agents, and warehouse managers see what they need.</p>
              </div>

              <div className="group flex flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-slate-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl transition-opacity opacity-0 group-hover:opacity-100" />
                <ShieldAlert className="h-8 w-8 text-orange-500" />
                <h3 className="text-xl font-bold text-black tracking-tight">Secure Transactions</h3>
                <p className="text-sm text-slate-600 leading-relaxed">ACID compliant workflows, transparent approval states, and full audit logs.</p>
              </div>

            </div>
          </div>
        </section>

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
              {faqs.map((item, index) => {
                const isOpen = activeIndex === index;
                return (
                  <div
                    key={item.question}
                    className="rounded-2xl border border-slate-200 bg-white shadow-[0_5px_10px_rgba(0,0,0,0.08)] transition-all"
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
                        className={`absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-3xl text-slate-500 transition-transform duration-75 ${
                          isOpen ? "rotate-45 text-black" : "rotate-0"
                        }`}
                      >
                        +
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen ? (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.1, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 sm:px-6 pb-5 text-sm sm:text-base text-slate-600 leading-relaxed">
                            {item.answer}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
