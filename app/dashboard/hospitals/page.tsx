"use client";

import { useEffect, useState } from "react";
import { Building2, RefreshCw, Plus, X, UserPlus } from "lucide-react";
import { api } from "@/lib/api";

interface Hospital {
  id: number; name: string; location: string; total_beds: number; available_beds: number;
  icu_beds: number; available_icu: number; status: string; occupancy_pct: number; current_patients: number;
}

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdmit, setShowAdmit] = useState<Hospital | null>(null);
  const [form, setForm] = useState({ patient_name: "", age: "", gender: "Male", condition_severity: "Stable", emergency_id: "", notes: "" });

  const fetchData = async () => {
    setLoading(true);
    try { const data = await api("/hospitals"); setHospitals(data.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const admitPatient = async () => {
    if (!showAdmit) return;
    try {
      await api(`/hospitals/${showAdmit.id}/admit`, {
        method: "POST",
        body: { ...form, age: form.age ? parseInt(form.age) : null, emergency_id: form.emergency_id ? parseInt(form.emergency_id) : null },
      });
      setShowAdmit(null);
      setForm({ patient_name: "", age: "", gender: "Male", condition_severity: "Stable", emergency_id: "", notes: "" });
      await fetchData();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed"); }
  };

  const getOccupancyColor = (pct: number) => {
    if (pct >= 90) return "bg-red-500";
    if (pct >= 70) return "bg-orange-500";
    if (pct >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hospital Coordination</h1>
          <p className="text-slate-500">Monitor hospital capacity and manage patient admissions.</p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 shadow-sm">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {hospitals.map(h => (
          <div key={h.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-teal-500" />
                <h3 className="font-bold text-black text-sm">{h.name}</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                h.status === "Operational" ? "bg-green-100 text-green-800" :
                h.status === "Limited" ? "bg-yellow-100 text-yellow-800" :
                h.status === "Full" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-800"
              }`}>{h.status}</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">{h.location}</p>

            {/* Occupancy Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Occupancy</span>
                <span className="font-semibold">{h.occupancy_pct}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${getOccupancyColor(h.occupancy_pct)}`} style={{ width: `${Math.min(h.occupancy_pct, 100)}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-teal-600">{h.available_beds}</div>
                <div className="text-xs text-slate-500">Beds Free</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-blue-600">{h.available_icu}</div>
                <div className="text-xs text-slate-500">ICU Free</div>
              </div>
            </div>

            <button onClick={() => setShowAdmit(h)} disabled={h.available_beds <= 0}
              className="w-full flex items-center justify-center gap-2 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <UserPlus className="h-3 w-3" /> Admit Patient
            </button>
          </div>
        ))}
      </div>

      {/* Admit Modal */}
      {showAdmit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowAdmit(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Admit to {showAdmit.name}</h2>
              <button onClick={() => setShowAdmit(null)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Patient Name" value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              <div className="grid grid-cols-3 gap-3">
                <input type="number" placeholder="Age" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50">
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
                <select value={form.condition_severity} onChange={e => setForm({ ...form, condition_severity: e.target.value })}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50">
                  <option>Stable</option><option>Serious</option><option>Critical</option>
                </select>
              </div>
              <input type="number" placeholder="Emergency ID (optional)" value={form.emergency_id} onChange={e => setForm({ ...form, emergency_id: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none" />
              <button onClick={admitPatient} disabled={!form.patient_name}
                className="w-full py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-all">
                Admit Patient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
