"use client";

import React from "react";
import { ShieldAlert, BarChart3, Users, Activity, MapPin } from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/ui/HeroSection";
import FeatureSection from "@/components/ui/FeatureSection";
import FAQSection from "@/components/ui/FAQSection";

const faqs = [
  {
    question: "How do I verify my email?",
    answer:
      'Click the link in the verification email from verify@codepen.io (check spam or other tabs if needed). Or email verify@codepen.io with the subject "Verify" from your account email.',
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

/* ── Feature Visuals ── */
function CoordinationVisual() {
  return (
    <>
      <div className="absolute top-4 right-6 w-20 h-20 rounded-full bg-pink-300/40 blur-lg" />
      <div className="absolute bottom-6 left-8 w-16 h-16 rounded-full bg-teal-300/50 blur-lg" />
      <div className="relative flex items-center gap-4">
        <div className="bg-white rounded-xl shadow-lg p-5 flex flex-col items-center gap-2">
          <Activity className="h-10 w-10 text-pink-500" />
          <div className="w-16 h-2 bg-pink-200 rounded-full" />
          <div className="w-12 h-2 bg-slate-200 rounded-full" />
        </div>
        <div className="bg-white rounded-xl shadow-lg p-5 flex flex-col items-center gap-2 translate-y-6">
          <Users className="h-10 w-10 text-teal-500" />
          <div className="w-16 h-2 bg-teal-200 rounded-full" />
          <div className="w-12 h-2 bg-slate-200 rounded-full" />
        </div>
        <div className="bg-white rounded-xl shadow-lg p-5 flex flex-col items-center gap-2 -translate-y-4">
          <MapPin className="h-10 w-10 text-blue-500" />
          <div className="w-16 h-2 bg-blue-200 rounded-full" />
          <div className="w-12 h-2 bg-slate-200 rounded-full" />
        </div>
      </div>
    </>
  );
}

function AnalyticsVisual() {
  return (
    <>
      <div className="absolute top-6 left-6 w-20 h-20 rounded-full bg-blue-300/40 blur-lg" />
      <div className="absolute bottom-4 right-8 w-16 h-16 rounded-full bg-indigo-300/40 blur-lg" />
      <div className="relative bg-white rounded-xl shadow-lg p-6 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-8 w-8 text-blue-500" />
          <span className="font-bold text-black text-sm">Analytics Dashboard</span>
        </div>
        <div className="flex items-end gap-2 h-20">
          <div className="w-6 bg-blue-400 rounded-t-md" style={{ height: "40%" }} />
          <div className="w-6 bg-blue-500 rounded-t-md" style={{ height: "70%" }} />
          <div className="w-6 bg-blue-400 rounded-t-md" style={{ height: "55%" }} />
          <div className="w-6 bg-teal-400 rounded-t-md" style={{ height: "85%" }} />
          <div className="w-6 bg-teal-500 rounded-t-md" style={{ height: "65%" }} />
          <div className="w-6 bg-blue-300 rounded-t-md" style={{ height: "90%" }} />
        </div>
        <div className="flex gap-4 text-xs text-slate-400 pt-1">
          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>
      </div>
    </>
  );
}

function RolesVisual() {
  const roles = [
    { role: "Administrator", color: "bg-red-100 text-red-700", icon: "🛡️" },
    { role: "Emergency Operator", color: "bg-orange-100 text-orange-700", icon: "📡" },
    { role: "Field Officer", color: "bg-blue-100 text-blue-700", icon: "🗺️" },
    { role: "Warehouse Manager", color: "bg-green-100 text-green-700", icon: "📦" },
  ];

  return (
    <>
      <div className="absolute top-4 right-8 w-16 h-16 rounded-full bg-purple-300/40 blur-lg" />
      <div className="absolute bottom-6 left-6 w-20 h-20 rounded-full bg-teal-300/40 blur-lg" />
      <div className="relative flex flex-col gap-3">
        {roles.map((item) => (
          <div key={item.role} className="bg-white rounded-lg shadow-md px-5 py-3 flex items-center gap-3">
            <span className="text-lg">{item.icon}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.color}`}>{item.role}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function SecureVisual() {
  const steps = [
    { label: "Request Created", status: "✓" },
    { label: "Admin Approved", status: "✓" },
    { label: "Funds Released", status: "✓" },
    { label: "Log Recorded", status: "✓" },
  ];

  return (
    <>
      <div className="absolute top-6 left-8 w-20 h-20 rounded-full bg-orange-300/30 blur-lg" />
      <div className="absolute bottom-4 right-6 w-16 h-16 rounded-full bg-emerald-300/40 blur-lg" />
      <div className="relative bg-white rounded-xl shadow-lg p-6 space-y-4 w-56">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-7 w-7 text-orange-500" />
          <span className="font-bold text-black text-sm">Audit Trail</span>
        </div>
        {steps.map((step) => (
          <div key={step.label} className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">
              {step.status}
            </span>
            <span className="text-sm text-slate-700">{step.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Main Page ── */
export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900 selection:bg-teal-500/30 overflow-hidden relative">
      {/* Background Blurs / Glows (Qvery-style subtle gradient) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[5%] left-[5%] w-[35%] h-[35%] rounded-full bg-[#fecaca]/40 blur-[100px]" />
        <div className="absolute top-[0%] right-[0%] w-[40%] h-[40%] rounded-full bg-[#ccfbf1]/50 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-[#fde8e8]/30 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[35%] h-[35%] rounded-full bg-[#e0f2fe]/30 blur-[120px]" />
      </div>

      <Navbar />

      <main className="flex-1 relative z-10 pt-24">
        <HeroSection />

        <FeatureSection
          title="Real-time Coordination"
          description="Track emergencies, teams, and resources in real-time with continuous updates. Monitor field agents, dispatch rescue teams, and coordinate response efforts all from a single live dashboard."
          visual={<CoordinationVisual />}
        />

        <FeatureSection
          title="Advanced Analytics"
          description="Insightful dashboards directly reflecting current operations and financial statuses. Visualize incident trends, resource utilization, and response times with powerful real-time charts."
          visual={<AnalyticsVisual />}
          reverse
        />

        <FeatureSection
          title="Role-Based Access"
          description="Robust RBAC ensuring admins, operators, field agents, and warehouse managers see exactly what they need. Each role has a tailored dashboard with precise permissions and workflows."
          visual={<RolesVisual />}
        />

        <FeatureSection
          title="Secure Transactions"
          description="ACID compliant workflows, transparent approval states, and full audit logs. Every resource allocation and financial transaction goes through a verified approval chain with complete traceability."
          visual={<SecureVisual />}
          reverse
        />

        <FAQSection items={faqs} />
      </main>
    </div>
  );
}
