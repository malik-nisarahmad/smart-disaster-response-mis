"use client";

import { useEffect, useState, useCallback } from "react";
import { Building2, RefreshCw, X, UserPlus, Zap, AlertTriangle, Bed, Activity } from "lucide-react";
import { api } from "@/lib/api";

interface Hospital {
  id: number; name: string; location: string; total_beds: number; available_beds: number;
  icu_beds: number; available_icu: number; status: string; occupancy_pct: number; current_patients: number;
}

type ModalMode = "manual" | "auto" | "escalate" | null;

export default function HospitalsPage() {
  const [hospitals, setHospitals]     = useState<Hospital[]>([]);
  const [loading, setLoading]         = useState(true);
  const [modalMode, setModalMode]     = useState<ModalMode>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [form, setForm] = useState({
    patient_name: "", age: "", gender: "Male", condition_severity: "Stable",
    emergency_id: "", notes: "", reason: "", target_hospital_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/hospitals");
      setHospitals(data.data);
      setLastUpdated(new Date());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const i = setInterval(fetchData, 30000); return () => clearInterval(i); }, [fetchData]);

  const resetForm  = () => setForm({ patient_name: "", age: "", gender: "Male", condition_severity: "Stable", emergency_id: "", notes: "", reason: "", target_hospital_id: "" });
  const openModal  = (mode: ModalMode, h?: Hospital) => { resetForm(); setModalMode(mode); setSelectedHospital(h || null); };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (modalMode === "manual" && selectedHospital) {
        await api(`/hospitals/${selectedHospital.id}/admit`, {
          method: "POST",
          body: { ...form, age: form.age ? parseInt(form.age) : null, emergency_id: form.emergency_id ? parseInt(form.emergency_id) : null },
        });
      } else if (modalMode === "auto") {
        const r = await api("/hospitals/auto-assign", {
          method: "POST",
          body: { ...form, age: form.age ? parseInt(form.age) : null, emergency_id: form.emergency_id ? parseInt(form.emergency_id) : null },
        });
        alert(`✓ ${r.message}`);
      } else if (modalMode === "escalate" && selectedHospital) {
        const r = await api(`/hospitals/patients/${form.emergency_id}/escalate`, {
          method: "POST",
          body: { reason: form.reason, target_hospital_id: form.target_hospital_id ? parseInt(form.target_hospital_id) : null },
        });
        alert(`✓ ${r.message}`);
      }
      setModalMode(null);
      await fetchData();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Operation failed"); }
    finally { setSubmitting(false); }
  };

  // Occupancy → color mapped to site palette (blue tones, not green)
  const occBar = (pct: number) => {
    if (pct >= 90) return "bg-red-500";
    if (pct >= 70) return "bg-orange-400";
    if (pct >= 50) return "bg-amber-400";
    return "bg-[#4318FF]";
  };

  const totalBeds  = hospitals.reduce((s, h) => s + h.total_beds,     0);
  const totalAvail = hospitals.reduce((s, h) => s + h.available_beds, 0);
  const totalICU   = hospitals.reduce((s, h) => s + h.available_icu,  0);
  const fullCount  = hospitals.filter(h => h.available_beds <= 0).length;

  const statusBadge = (s: string) => ({
    Operational: "bg-blue-50 text-blue-700 border-blue-200",
    Limited:     "bg-amber-50 text-amber-700 border-amber-200",
    Full:        "bg-red-50 text-red-700 border-red-200",
    Closed:      "bg-slate-100 text-slate-600 border-slate-200",
  }[s] || "bg-slate-100 text-slate-600 border-slate-200");

  const inputCls = "w-full px-4 py-2.5 bg-[#f4f7fe] border-0 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4318FF]/30 transition-all";

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#051522] tracking-tight">Hospital Coordination</h1>
          <p className="text-slate-500 font-medium mt-1">
            Monitor capacity and manage patient admissions.{" "}
            {lastUpdated && <span className="text-xs text-slate-400">Last updated: {lastUpdated.toLocaleTimeString()}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openModal("auto")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4318FF] text-white text-sm font-bold hover:bg-indigo-700 shadow-md transition-all">
            <Zap className="h-4 w-4" /> Auto-Assign Patient
          </button>
          <button onClick={fetchData} className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-[#f4f7fe] shadow-sm">
            <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Beds",      val: totalBeds.toLocaleString(),  icon: Building2, bg: "from-blue-600 to-blue-800", shadow: "shadow-blue-500/30" },
          { label: "Available Beds",  val: totalAvail.toLocaleString(), icon: Bed,  bg: "from-emerald-500 to-emerald-700", shadow: "shadow-emerald-500/30" },
          { label: "ICU Available",   val: totalICU,                   icon: Activity, bg: "from-purple-600 to-indigo-700", shadow: "shadow-purple-500/30" },
          { label: "At Full Capacity",val: fullCount,                  icon: AlertTriangle,  bg: fullCount > 0 ? "from-red-500 to-rose-700" : "from-slate-400 to-slate-600", shadow: fullCount > 0 ? "shadow-red-500/30" : "shadow-slate-400/20" },
        ].map((c, i) => (
          <div key={c.label} className={`relative overflow-hidden bg-gradient-to-br ${c.bg} rounded-[24px] p-6 text-white shadow-xl ${c.shadow} transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 group`}>
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 rounded-full bg-white/10 blur-xl group-hover:bg-white/20 transition-all duration-500"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 rounded-full bg-black/10 blur-lg"></div>
            
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold opacity-90 uppercase tracking-widest mb-1">{c.label}</div>
                <div className="text-4xl font-black mt-2 tracking-tight">{c.val}</div>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                <c.icon className="h-7 w-7 text-white" />
              </div>
            </div>
            
            {/* Animated Loading/Progress line decoration */}
            <div className="absolute bottom-0 left-0 h-1 w-full bg-black/10">
              <div className="h-full bg-white/40" style={{ width: '40%', animation: `shimmer ${2 + i * 0.5}s infinite linear` }}></div>
            </div>
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}} />

      {/* Hospital Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {hospitals.map(h => (
          <div key={h.id}
            className={`bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex flex-col gap-5 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all ${
              h.available_beds <= 0 ? "ring-2 ring-red-200" : ""
            }`}>

            {/* Hospital header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#f4f7fe] flex items-center justify-center text-2xl flex-shrink-0">
                  🏥
                </div>
                <div>
                  <h3 className="font-extrabold text-[#051522] leading-tight">{h.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{h.location}</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusBadge(h.status)}`}>
                {h.status}
              </span>
            </div>

            {/* Occupancy bar */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-500">Bed Occupancy</span>
                <span className={h.occupancy_pct >= 90 ? "text-red-600" : "text-[#051522]"}>{h.occupancy_pct}%</span>
              </div>
              <div className="w-full bg-[#f4f7fe] rounded-full h-2.5">
                <div className={`h-2.5 rounded-full transition-all ${occBar(h.occupancy_pct)}`}
                  style={{ width: `${Math.min(h.occupancy_pct, 100)}%` }} />
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Beds Free",  val: h.available_beds,  accent: h.available_beds <= 0 ? "text-red-600" : "text-[#4318FF]" },
                { label: "ICU Free",   val: h.available_icu,   accent: h.available_icu <= 0 ? "text-red-600" : "text-violet-600" },
                { label: "Patients",   val: h.current_patients, accent: "text-[#051522]" },
              ].map(s => (
                <div key={s.label} className="bg-[#f4f7fe] rounded-2xl py-3 text-center">
                  <div className={`text-xl font-extrabold ${s.accent}`}>{s.val}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Progress detail */}
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>{h.total_beds - h.available_beds} of {h.total_beds} beds occupied</span>
              <span>{h.icu_beds} ICU total</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => openModal("manual", h)} disabled={h.available_beds <= 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#051522] text-white rounded-xl text-xs font-extrabold hover:bg-[#0a243a] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md">
                <UserPlus className="h-3.5 w-3.5" /> Admit Patient
              </button>
              <button onClick={() => openModal("escalate", h)}
                title="Escalate a patient from this hospital"
                className="flex items-center justify-center gap-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-extrabold hover:bg-orange-600 transition-all shadow-md">
                <AlertTriangle className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── MODAL ── */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setModalMode(null)}>
          <div className="bg-white rounded-[28px] shadow-2xl max-w-md w-full p-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-[#051522]">
                  {modalMode === "auto"     && "⚡ Auto-Assign Patient"}
                  {modalMode === "manual"   && selectedHospital && `Admit to ${selectedHospital.name}`}
                  {modalMode === "escalate" && selectedHospital && `⚠ Escalate Patient`}
                </h2>
                {selectedHospital && (
                  <p className="text-sm text-slate-400 mt-1">{selectedHospital.name} · {selectedHospital.available_beds} beds free</p>
                )}
              </div>
              <button onClick={() => setModalMode(null)} className="p-2 hover:bg-[#f4f7fe] rounded-xl transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {/* Auto / Manual form */}
            {(modalMode === "auto" || modalMode === "manual") && (
              <div className="space-y-3">
                {modalMode === "auto" && (
                  <div className="bg-[#f4f7fe] text-[#4318FF] text-xs font-semibold p-4 rounded-2xl">
                    System selects the hospital with most available capacity. Critical patients are prioritized for ICU beds.
                  </div>
                )}
                <input placeholder="Patient Name *" value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} className={inputCls} />
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" placeholder="Age" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} className={inputCls} />
                  <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className={inputCls}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                  <select value={form.condition_severity} onChange={e => setForm({ ...form, condition_severity: e.target.value })} className={inputCls}>
                    <option>Stable</option><option>Serious</option><option>Critical</option>
                  </select>
                </div>
                <input type="number" placeholder="Emergency ID (optional)" value={form.emergency_id}
                  onChange={e => setForm({ ...form, emergency_id: e.target.value })} className={inputCls} />
                <textarea placeholder="Notes (optional)" value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                  className={`${inputCls} resize-none`} />
              </div>
            )}

            {/* Escalate form */}
            {modalMode === "escalate" && (
              <div className="space-y-3">
                <div className="bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold p-4 rounded-2xl">
                  Marks the patient as Critical and creates an Urgent ICU transfer approval request.
                </div>
                <input type="number" placeholder="Patient ID *" value={form.emergency_id}
                  onChange={e => setForm({ ...form, emergency_id: e.target.value })} className={inputCls} />
                <textarea placeholder="Reason for escalation *" value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })} rows={3}
                  className={`${inputCls} resize-none`} />
                <input type="number" placeholder="Target Hospital ID (leave blank for auto)" value={form.target_hospital_id}
                  onChange={e => setForm({ ...form, target_hospital_id: e.target.value })} className={inputCls} />
              </div>
            )}

            <button onClick={handleSubmit}
              disabled={submitting || (modalMode !== "escalate" && !form.patient_name) || (modalMode === "escalate" && !form.emergency_id)}
              className="mt-5 w-full py-3 bg-[#051522] text-white rounded-xl text-sm font-extrabold hover:bg-[#0a243a] disabled:opacity-50 transition-all shadow-lg">
              {submitting ? "Processing..." :
               modalMode === "auto"     ? "Auto-Assign to Best Hospital" :
               modalMode === "escalate" ? "Escalate Patient"             : "Admit Patient"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
