"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, MapPin, AlertTriangle, FileText, Send, User, Phone, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

const disasterTypes = [
  { id: 1, name: "Flood" },
  { id: 2, name: "Earthquake" },
  { id: 3, name: "Urban Fire" },
  { id: 4, name: "Building Collapse" },
  { id: 5, name: "Landslide" },
  { id: 6, name: "Storm" },
  { id: 7, name: "Other" },
];

export default function ReportEmergency() {
  const router = useRouter();
  const [form, setForm] = useState({
    reporter_name: "",
    reporter_phone: "",
    disaster_type_id: "1",
    severity: "Moderate",
    latitude: "",
    longitude: "",
    location_description: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!form.latitude || !form.longitude) {
      setError("Please enter the location coordinates.");
      setLoading(false);
      return;
    }

    try {
      await api("/emergencies", {
        method: "POST",
        body: {
          ...form,
          disaster_type_id: parseInt(form.disaster_type_id),
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
        },
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 relative overflow-hidden p-4">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-pink-400/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-400/20 blur-[120px] pointer-events-none" />
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-10 text-center max-w-md animate-fade-in-up relative z-10">
          <div className="inline-flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-full mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-black mb-2">Report Submitted</h2>
          <p className="text-slate-600 mb-6">Your emergency report has been submitted successfully. Our team will respond immediately.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/" className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">
              Home
            </Link>
            <button onClick={() => { setSuccess(false); setForm({ reporter_name: "", reporter_phone: "", disaster_type_id: "1", severity: "Moderate", latitude: "", longitude: "", location_description: "", description: "" }); }}
              className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
              New Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-500/30 overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-pink-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-400/20 blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <header className="fixed top-4 left-0 right-0 z-50 w-full px-4 flex justify-center pointer-events-none">
        <div className="w-full max-w-6xl bg-[#FFFFFF] rounded-xl shadow-sm border border-slate-200 flex h-16 items-center justify-between px-4 sm:px-6 pointer-events-auto">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center bg-teal-400 text-white p-1 rounded-full shadow-sm transition-transform group-hover:scale-105">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tighter text-black">Respond MIS</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/" className="text-[15px] font-medium text-black hover:text-slate-600 transition-colors">Home</Link>
            <Link href="/login" className="inline-flex h-9 items-center justify-center rounded-md border-2 border-slate-200 bg-[#FFFFFF] px-5 text-sm font-semibold text-black transition-colors hover:bg-slate-50 hover:border-slate-300">
              Login
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl w-full mx-auto space-y-8 bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl shadow-xl animate-fade-in-up">
          <Link href="/" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-black transition-colors">
            <ArrowLeft className="mr-2 w-4 h-4" /> Back to Home
          </Link>

          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-red-50 border border-red-200 rounded-full mb-2 shadow-sm">
              <ShieldAlert className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-4xl font-extrabold text-black tracking-tight">Report an Emergency</h2>
            <p className="text-base text-slate-600 font-medium">
              Please provide accurate details of the incident. This information is critical for dispatching immediate response teams.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">{error}</div>
          )}

          <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 group">
                <label htmlFor="reporter_name" className="flex items-center text-sm font-bold text-black group-hover:text-teal-600 transition-colors">
                  <User className="w-4 h-4 mr-2" /> Your Name
                </label>
                <input id="reporter_name" name="reporter_name" type="text" value={form.reporter_name} onChange={handleChange}
                  className="block w-full px-4 py-3 bg-white border border-slate-200 text-black font-medium rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all sm:text-sm"
                  placeholder="Optional" />
              </div>
              <div className="space-y-2 group">
                <label htmlFor="reporter_phone" className="flex items-center text-sm font-bold text-black group-hover:text-teal-600 transition-colors">
                  <Phone className="w-4 h-4 mr-2" /> Phone Number
                </label>
                <input id="reporter_phone" name="reporter_phone" type="tel" value={form.reporter_phone} onChange={handleChange}
                  className="block w-full px-4 py-3 bg-white border border-slate-200 text-black font-medium rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all sm:text-sm"
                  placeholder="Optional" />
              </div>
            </div>

            <div className="space-y-2 group">
              <label htmlFor="location_description" className="flex items-center text-sm font-bold text-black group-hover:text-teal-600 transition-colors">
                <MapPin className="w-4 h-4 mr-2" /> Location Description
              </label>
              <input id="location_description" name="location_description" type="text" value={form.location_description} onChange={handleChange}
                className="block w-full px-4 py-3 bg-white border border-slate-200 text-black font-medium rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all sm:text-sm"
                placeholder="e.g. Sector G-10, near main market" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="latitude" className="text-sm font-bold text-black">Latitude</label>
                <input id="latitude" name="latitude" type="number" step="any" value={form.latitude} onChange={handleChange} required
                  className="block w-full px-4 py-3 bg-white border border-slate-200 text-black font-medium rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 sm:text-sm"
                  placeholder="33.6844" />
              </div>
              <div className="space-y-2">
                <label htmlFor="longitude" className="text-sm font-bold text-black">Longitude</label>
                <input id="longitude" name="longitude" type="number" step="any" value={form.longitude} onChange={handleChange} required
                  className="block w-full px-4 py-3 bg-white border border-slate-200 text-black font-medium rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 sm:text-sm"
                  placeholder="73.0479" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 group">
                <label htmlFor="disaster_type_id" className="flex items-center text-sm font-bold text-black group-hover:text-blue-600 transition-colors">
                  <AlertTriangle className="w-4 h-4 mr-2" /> Type of Disaster
                </label>
                <select id="disaster_type_id" name="disaster_type_id" value={form.disaster_type_id} onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 bg-white border border-slate-200 text-black font-medium rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 sm:text-sm">
                  {disasterTypes.map(dt => (
                    <option key={dt.id} value={dt.id}>{dt.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 group">
                <label htmlFor="severity" className="flex items-center text-sm font-bold text-black group-hover:text-pink-600 transition-colors">
                  Severity Level
                </label>
                <select id="severity" name="severity" value={form.severity} onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 bg-white border border-slate-200 text-black font-medium rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 sm:text-sm">
                  <option>Low</option>
                  <option>Moderate</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 group">
              <label htmlFor="description" className="flex items-center text-sm font-bold text-black group-hover:text-orange-600 transition-colors">
                <FileText className="w-4 h-4 mr-2" /> Additional Details
              </label>
              <textarea id="description" name="description" rows={4} value={form.description} onChange={handleChange}
                className="block w-full px-4 py-3 bg-white border border-slate-200 placeholder-slate-400 text-black font-medium rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 sm:text-sm resize-none"
                placeholder="Provide context like estimated people trapped, specific hazards, etc." />
            </div>

            <div className="pt-4">
              <button type="submit" disabled={loading}
                className="group relative w-full flex justify-center items-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[#051522] hover:bg-[#0a243a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] shadow-lg">
                <Send className="w-4 h-4 mr-2" />
                {loading ? "Submitting..." : "Submit Emergency Report"}
              </button>
            </div>

            <p className="text-center text-xs font-semibold text-slate-500 mt-4 px-12">
              False reporting is a serious offense. By submitting, you confirm the situation is real to the best of your knowledge.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
