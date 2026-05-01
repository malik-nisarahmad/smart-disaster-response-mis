"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ShieldAlert, ArrowLeft, MapPin, AlertTriangle, FileText, Send, User, Phone, CheckCircle, Navigation } from "lucide-react";
import { api } from "@/lib/api";

const MapPicker = dynamic(() => import("@/components/ui/MapPicker"), { 
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[400px] bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 font-medium">Loading Map...</div>
});

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
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [form, setForm] = useState({
    reporter_name: "",
    reporter_phone: "",
    disaster_type_id: "1",
    severity: "Moderate",
    location_description: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Reverse Geocoding: Auto-fill address when map is clicked
  useEffect(() => {
    if (position) {
      const fetchAddress = async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position[0]}&lon=${position[1]}`);
          const data = await res.json();
          if (data && data.display_name) {
            // Take the most relevant parts of the address to avoid overly long strings
            const addressParts = data.display_name.split(",").slice(0, 3).join(", ");
            setForm(prev => ({ ...prev, location_description: addressParts }));
          }
        } catch (error) {
          console.error("Failed to fetch address", error);
        }
      };
      fetchAddress();
    }
  }, [position]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!position) {
      setError("Please click on the map to pinpoint the exact location of the emergency.");
      setLoading(false);
      return;
    }

    try {
      await api("/emergencies", {
        method: "POST",
        body: {
          ...form,
          disaster_type_id: parseInt(form.disaster_type_id),
          latitude: position[0],
          longitude: position[1],
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
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl p-12 text-center max-w-md animate-fade-in-up relative z-10">
          <div className="inline-flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-full mb-6 shadow-inner">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-black mb-4 tracking-tight">Report Submitted</h2>
          <p className="text-slate-600 mb-8 font-medium leading-relaxed">
            Your emergency report has been received and verified. Response teams in your sector are being notified immediately.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => router.back()} className="px-8 py-3 bg-[#051522] text-white rounded-xl text-sm font-bold shadow-lg hover:bg-[#0a243a] transition-all hover:scale-105">
              Return
            </button>
            <button onClick={() => { setSuccess(false); setPosition(null); setForm({ reporter_name: "", reporter_phone: "", disaster_type_id: "1", severity: "Moderate", location_description: "", description: "" }); }}
              className="px-8 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all hover:scale-105">
              New Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-500/30 overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[5%] left-[5%] w-[35%] h-[35%] rounded-full bg-[#fecaca]/40 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[35%] h-[35%] rounded-full bg-[#e0f2fe]/30 blur-[120px]" />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10 min-h-screen">
        <div className="w-full max-w-6xl animate-fade-in-up">
          
          <div className="mb-6">
            <button onClick={() => router.back()} className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-black transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
              <ArrowLeft className="mr-2 w-4 h-4" /> Back to Safety
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
            
            {/* LEFT COLUMN: FORM */}
            <div className="w-full lg:w-1/2 p-8 sm:p-12">
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center justify-center bg-red-100 border border-red-200 p-3 rounded-2xl shadow-sm">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold text-black tracking-tight">Report Incident</h1>
                  <p className="text-sm text-slate-500 font-medium mt-1">Dispatch emergency teams instantly.</p>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-bold flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 group">
                    <label className="flex items-center text-xs font-bold text-slate-700 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                      <User className="w-3.5 h-3.5 mr-1.5" /> Your Name
                    </label>
                    <input name="reporter_name" type="text" value={form.reporter_name} onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border-transparent text-black font-medium rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
                      placeholder="Optional" />
                  </div>
                  <div className="space-y-1.5 group">
                    <label className="flex items-center text-xs font-bold text-slate-700 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                      <Phone className="w-3.5 h-3.5 mr-1.5" /> Phone Number
                    </label>
                    <input name="reporter_phone" type="tel" value={form.reporter_phone} onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border-transparent text-black font-medium rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
                      placeholder="Optional" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 group">
                    <label className="flex items-center text-xs font-bold text-slate-700 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Incident Type
                    </label>
                    <select name="disaster_type_id" value={form.disaster_type_id} onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border-transparent text-black font-medium rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm appearance-none">
                      {disasterTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5 group">
                    <label className="flex items-center text-xs font-bold text-slate-700 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                      Severity
                    </label>
                    <select name="severity" value={form.severity} onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border-transparent text-black font-medium rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm appearance-none">
                      <option>Low</option>
                      <option>Moderate</option>
                      <option>High</option>
                      <option>Critical</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 group">
                  <label className="flex items-center text-xs font-bold text-slate-700 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                    <MapPin className="w-3.5 h-3.5 mr-1.5" /> Location Address / Landmark
                  </label>
                  <input name="location_description" type="text" value={form.location_description} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border-transparent text-black font-medium rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                    placeholder="e.g. Sector G-10, near the main market" />
                </div>

                <div className="space-y-1.5 group">
                  <label className="flex items-center text-xs font-bold text-slate-700 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                    <FileText className="w-3.5 h-3.5 mr-1.5" /> Additional Details
                  </label>
                  <textarea name="description" rows={3} value={form.description} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border-transparent text-black font-medium rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm resize-none"
                    placeholder="Provide context like estimated people trapped, specific hazards, etc." />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex justify-center items-center py-4 px-4 bg-[#051522] hover:bg-[#0a243a] text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 hover:scale-[1.02] mt-4">
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? "Dispatching Signal..." : "Submit Emergency"}
                </button>
              </form>
            </div>

            {/* RIGHT COLUMN: MAP */}
            <div className="w-full lg:w-1/2 bg-slate-100 p-8 sm:p-12 flex flex-col border-l border-slate-200 relative">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-black flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-[#051522]" />
                    Pinpoint Location
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Tap on the map to drop a distress pin.</p>
                </div>
                {position && (
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 shadow-sm border border-green-200">
                    <CheckCircle className="w-3 h-3" /> Pinned
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-h-[400px] w-full relative group">
                {!position && (
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-800 group-hover:bg-transparent group-hover:backdrop-blur-none transition-all duration-300 pointer-events-none">
                    <div className="bg-[#051522] text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 animate-bounce">
                      <MapPin className="w-4 h-4" /> Tap map to select location
                    </div>
                  </div>
                )}
                <MapPicker position={position} setPosition={setPosition} />
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                False reporting is a serious offense. By submitting, you confirm the situation is real.
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
