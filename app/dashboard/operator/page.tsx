"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  ShieldAlert, MapPin, Clock, ChevronDown, Filter,
  CheckCircle2, AlertCircle, Timer, X,
  Plus, RefreshCw, ArrowUpRight, RotateCcw
} from "lucide-react";
import { api } from "@/lib/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// Dynamically import the map to avoid SSR issues
const EmergencyMap = dynamic(() => import("@/components/ui/EmergencyMap"), {
  ssr: false, loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-slate-400 text-sm font-medium">Loading Map...</div>
  )
});

interface Emergency {
  id: number;
  reporter_name: string;
  reporter_phone: string;
  disaster_type_name: string;
  severity: string;
  latitude: number;
  longitude: number;
  location_description: string;
  description: string;
  status: string;
  operator_name: string | null;
  reported_at: string;
  // New enriched fields from updated API
  active_teams: number;
  assigned_teams: string | null;
  admitted_patients: number;
  allocated_budget: number | null;
  spent_budget: number | null;
}

const severityConfig: Record<string, { color: string; bg: string; dot: string }> = {
  Critical: { color: "text-red-700", bg: "bg-red-50", dot: "bg-red-500" },
  High: { color: "text-orange-700", bg: "bg-orange-50", dot: "bg-orange-500" },
  Moderate: { color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-500" },
  Low: { color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
};

const statusConfig: Record<string, { color: string; bg: string }> = {
  Pending: { color: "text-amber-700", bg: "bg-amber-50" },
  Acknowledged: { color: "text-blue-700", bg: "bg-blue-50" },
  "In Progress": { color: "text-orange-700", bg: "bg-orange-50" },
  Resolved: { color: "text-emerald-700", bg: "bg-emerald-50" },
  Closed: { color: "text-slate-600", bg: "bg-slate-100" },
};

const disasterIcon: Record<string, string> = {
  Flood: "🌊", Earthquake: "🌍", "Urban Fire": "🔥",
  "Building Collapse": "🏚️", Landslide: "⛰️", Storm: "⛈️", Other: "⚠️",
};

const trendData = [
  { date: "Apr 26", count: 18 }, { date: "Apr 27", count: 22 },
  { date: "Apr 28", count: 15 }, { date: "Apr 29", count: 30 },
  { date: "Apr 30", count: 25 }, { date: "May 1", count: 40 },
  { date: "May 2", count: 35 },
];

export default function OperatorPage() {
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [selected, setSelected] = useState<Emergency | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [detail, setDetail] = useState<any>(null);          // full detail incl. teams/patients/budget
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);

  const fetchEmergencies = async () => {
    setLoading(true);
    try {
      let url = "/emergencies?limit=50";
      if (filterStatus) url += `&status=${filterStatus}`;
      if (filterSeverity) url += `&severity=${filterSeverity}`;
      const data = await api(url);
      setEmergencies(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id: number) => {
    setLoadingDetail(true);
    setDetail(null);
    try {
      const data = await api(`/emergencies/${id}`);
      setDetail(data);
    } catch (err) { console.error(err); }
    finally { setLoadingDetail(false); }
  };

  useEffect(() => { fetchEmergencies(); }, [filterStatus, filterSeverity]);

  const handleSelect = (em: Emergency | null) => {
    setSelected(em);
    if (em) fetchDetail(em.id);
    else setDetail(null);
  };

  const autoAssignTeam = async (emergencyId: number) => {
    setAutoAssigning(true);
    try {
      const result = await api("/rescue-teams/auto-assign", {
        method: "POST",
        body: { emergency_id: emergencyId }
      });
      alert(`✓ ${result.message}`);
      await fetchEmergencies();
      fetchDetail(emergencyId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Auto-assign failed");
    } finally { setAutoAssigning(false); }
  };

  const updateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await api(`/emergencies/${id}/status`, { method: "PATCH", body: { status } });
      await fetchEmergencies();
      if (selected?.id === id) {
        setSelected(prev => prev ? { ...prev, status } : null);
        fetchDetail(id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  // Derived stats
  const total = emergencies.length;
  const highSev = emergencies.filter(e => e.severity === "Critical" || e.severity === "High").length;
  const pending = emergencies.filter(e => e.status === "Pending").length;
  const resolved = emergencies.filter(e => e.status === "Resolved" || e.status === "Closed").length;

  // Severity chart data
  const critCount = emergencies.filter(e => e.severity === "Critical" || e.severity === "High").length;
  const modCount = emergencies.filter(e => e.severity === "Moderate").length;
  const lowCount = emergencies.filter(e => e.severity === "Low").length;
  const sevTotal = critCount + modCount + lowCount || 1;
  const severityPie = [
    { name: "High", value: critCount, color: "#ef4444" },
    { name: "Moderate", value: modCount, color: "#f59e0b" },
    { name: "Low", value: lowCount, color: "#22c55e" },
  ];

  // Top locations
  const locationCounts: Record<string, number> = {};
  emergencies.forEach(e => {
    const loc = e.location_description?.split(",")[0]?.trim() || "Unknown";
    locationCounts[loc] = (locationCounts[loc] || 0) + 1;
  });
  const topLocations = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const locationColors = ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e", "#8b5cf6"];

  const nextStatus: Record<string, string> = {
    Pending: "Acknowledged",
    Acknowledged: "In Progress",
    "In Progress": "Resolved",
  };

  return (
    <div className="flex flex-col gap-5 pb-8 max-w-[1600px] mx-auto">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Reports", value: total, icon: <ShieldAlert className="h-5 w-5 text-red-600" />, bg: "bg-red-50", trend: "+12 today", trendColor: "text-red-500" },
          { label: "High Severity", value: highSev, icon: <AlertCircle className="h-5 w-5 text-orange-600" />, bg: "bg-orange-50", trend: "+8 today", trendColor: "text-orange-500" },
          { label: "Pending", value: pending, icon: <Timer className="h-5 w-5 text-amber-600" />, bg: "bg-amber-50", trend: "+4 today", trendColor: "text-amber-600" },
          { label: "Resolved Today", value: resolved, icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-50", trend: "+8 today", trendColor: "text-emerald-600" },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${card.bg}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-0.5">{card.label}</p>
              <p className="text-3xl font-extrabold text-slate-900 leading-none">{card.value}</p>
              <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${card.trendColor}`}>
                <ArrowUpRight className="w-3 h-3" /> {card.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid: List | Map | Detail ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px_300px] gap-4">

        {/* Reports Overview */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col">
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900">Reports Overview</h2>
              <button onClick={fetchEmergencies} className="text-slate-400 hover:text-slate-700 transition-colors">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors">
                <Filter className="h-3.5 w-3.5" />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-transparent outline-none cursor-pointer">
                  <option value="">All Statuses</option>
                  <option>Pending</option><option>Acknowledged</option>
                  <option>In Progress</option><option>Resolved</option><option>Closed</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors">
                <ShieldAlert className="h-3.5 w-3.5" />
                <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="bg-transparent outline-none cursor-pointer">
                  <option value="">All Severities</option>
                  <option>Critical</option><option>High</option><option>Moderate</option><option>Low</option>
                </select>
              </div>
              <div className="ml-auto flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600">
                Sort: Newest <ChevronDown className="h-3 w-3" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 max-h-[380px] custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Loading...</div>
            ) : emergencies.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-slate-400 text-sm">No reports found.</div>
            ) : emergencies.slice(0, 10).map((em) => {
              const isSelected = selected?.id === em.id;
              const sev = severityConfig[em.severity] || severityConfig.Low;
              const sta = statusConfig[em.status] || statusConfig.Pending;
              return (
                 <button key={em.id} onClick={() => handleSelect(isSelected ? null : em)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${isSelected
                      ? "bg-blue-50 border-blue-200 shadow-sm"
                      : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                    }`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${sev.bg}`}>
                    {disasterIcon[em.disaster_type_name] || "⚠️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">{em.disaster_type_name}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{em.location_description?.split(",")[0] || "Unknown"}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sev.bg} ${sev.color}`}>{em.severity}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sta.bg} ${sta.color}`}>{em.status}</span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-1">
                    <p className="text-xs text-slate-500">{formatDate(em.reported_at)}</p>
                    <p className="text-xs text-slate-400">{formatTime(em.reported_at)}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-100 px-5 py-3">
            <button className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All Reports <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Live Map */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="text-base font-bold text-slate-900">Live Map</h2>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View Full Map <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1 px-4 pb-4 min-h-[320px]">
            <EmergencyMap emergencies={emergencies} selected={selected} onSelect={handleSelect} />
          </div>
          <div className="flex items-center gap-4 px-5 pb-4 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />High</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />Moderate</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Low</span>
          </div>
        </div>

        {/* Report Details Panel */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Report Details</h2>
            {selected && (
              <button onClick={() => handleSelect(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                <ShieldAlert className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-500">Select a report to view details</p>
              <p className="text-xs text-slate-400 mt-1">Click any incident from the list or map</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${severityConfig[selected.severity]?.bg || "bg-slate-100"}`}>
                  {disasterIcon[selected.disaster_type_name] || "⚠️"}
                </div>
                <div>
                  <p className="font-extrabold text-slate-900">{selected.disaster_type_name}</p>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${severityConfig[selected.severity]?.bg} ${severityConfig[selected.severity]?.color}`}>{selected.severity}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusConfig[selected.status]?.bg} ${statusConfig[selected.status]?.color}`}>{selected.status}</span>
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  <span className="font-semibold">{selected.location_description || "Location not specified"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  <span>{formatDate(selected.reported_at)}, {formatTime(selected.reported_at)}</span>
                </div>
              </div>

              {/* Description */}
              {selected.description && (
                <div>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{selected.description}</p>
                </div>
              )}

              {/* Reporter */}
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Reporter</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                    {(selected.reporter_name || "A")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{selected.reporter_name || "Anonymous"}</p>
                    <p className="text-xs text-slate-500">Citizen</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Actions</p>
                <div className="space-y-2">
                  {nextStatus[selected.status] && (
                    <button
                      onClick={() => updateStatus(selected.id, nextStatus[selected.status])}
                      disabled={updatingId === selected.id}
                      className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {updatingId === selected.id ? "Updating..." : nextStatus[selected.status] === "Resolved" ? "Resolve" : nextStatus[selected.status]}
                    </button>
                  )}
                  {/* Auto-assign nearest rescue team */}
                  {selected.status !== "Resolved" && selected.status !== "Closed" && (
                    <button
                      onClick={() => autoAssignTeam(selected.id)}
                      disabled={autoAssigning}
                      className="w-full py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                      <MapPin className="h-4 w-4" />
                      {autoAssigning ? "Finding nearest team..." : "Auto-Assign Nearest Team"}
                    </button>
                  )}
                </div>
              </div>

              {/* Assigned Rescue Teams */}
              {loadingDetail ? (
                <div className="text-xs text-slate-400">Loading details...</div>
              ) : detail && (
                <>
                  {detail.teams && detail.teams.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Rescue Teams ({detail.teams.length})</p>
                      <div className="space-y-1.5">
                        {detail.teams.map((t: any) => (
                          <div key={t.assignment_id} className="bg-orange-50 rounded-lg px-3 py-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-orange-800">{t.team_name}</span>
                              <span className={`px-1.5 py-0.5 rounded-full font-semibold ${
                                t.assignment_status === "Active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                              }`}>{t.assignment_status}</span>
                            </div>
                            <div className="text-slate-500 mt-0.5">{t.team_type} · Leader: {t.leader_name}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admitted Patients */}
                  {detail.patients && detail.patients.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Admitted Patients ({detail.patients.length})</p>
                      <div className="space-y-1.5">
                        {detail.patients.map((p: any) => (
                          <div key={p.id} className="bg-blue-50 rounded-lg px-3 py-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-blue-800">{p.patient_name}</span>
                              <span className={`px-1.5 py-0.5 rounded-full font-semibold ${
                                p.condition_severity === "Critical" ? "bg-red-100 text-red-700" :
                                p.condition_severity === "Serious" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                              }`}>{p.condition_severity}</span>
                            </div>
                            <div className="text-slate-500 mt-0.5">{p.hospital_name} · {p.gender}, {p.age ?? "?"} yrs</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Budget */}
                  {detail.budget && (
                    <div>
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Budget</p>
                      <div className="bg-emerald-50 rounded-lg px-3 py-2 text-xs space-y-1">
                        <div className="flex justify-between"><span className="text-slate-500">Allocated</span><span className="font-bold">${Number(detail.budget.total_budget).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Spent</span><span className="font-bold text-red-600">${Number(detail.budget.spent).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Remaining</span><span className="font-bold text-green-600">${Number(detail.budget.remaining).toLocaleString()}</span></div>
                        <div className="w-full bg-white rounded-full h-1.5 mt-1">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(detail.budget.utilization_pct ?? 0, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Finance Transactions */}
                  {detail.transactions && detail.transactions.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Financial ({detail.transactions.length})</p>
                      <div className="space-y-1">
                        {detail.transactions.slice(0,3).map((tx: any) => (
                          <div key={tx.id} className="flex justify-between text-xs">
                            <span className="text-slate-600">{tx.transaction_type}</span>
                            <span className="font-bold">${Number(tx.amount).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Timeline */}
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Updates (2)</p>
                <div className="space-y-3">
                  <div className="flex gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-700 font-semibold">Report assigned to emergency team</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(selected.reported_at)}, {formatTime(selected.reported_at)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-700 font-semibold">Report created</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(selected.reported_at)}</p>
                    </div>
                  </div>
                </div>
                <button className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  View All Updates <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Row: Trend | Severity | Top Locations ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px_280px] gap-4">

        {/* Reports Trend */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Reports Trend</h3>
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">This Week <ChevronDown className="h-3 w-3" /></span>
          </div>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "12px" }} />
                <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} fill="url(#trendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reports by Severity */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Reports by Severity</h3>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={severityPie} cx="50%" cy="50%" innerRadius={28} outerRadius={40} paddingAngle={3} dataKey="value" stroke="none">
                    {severityPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              {severityPie.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-slate-700">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{item.value} ({Math.round(item.value / sevTotal * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Locations */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Top Locations</h3>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-700">View All</button>
          </div>
          <div className="space-y-3">
            {topLocations.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No data yet</p>
            ) : topLocations.map(([loc, count], i) => (
              <div key={loc} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: locationColors[i] }} />
                  <span className="font-semibold text-slate-700 truncate max-w-[140px]">{loc}</span>
                </div>
                <span className="font-bold text-slate-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
