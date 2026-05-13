"use client";

import { useEffect, useState } from "react";
import { ScrollText, RefreshCw, Search, X, Activity, LogIn, Users, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

interface AuditLog {
  id: number; action: string; table_name: string; record_id: number;
  old_values: string; new_values: string; ip_address: string;
  logged_at: string; user_name: string; user_email: string; user_role: string;
}

const actionCfg: Record<string, { badge: string; emoji: string }> = {
  LOGIN: { badge: "bg-blue-50 text-blue-700 border-blue-200", emoji: "🔑" },
  FINANCIAL_TRANSACTION_CREATED: { badge: "bg-indigo-50 text-indigo-700 border-indigo-200", emoji: "💰" },
  UPDATE_EMERGENCY_STATUS: { badge: "bg-orange-50 text-orange-700 border-orange-200", emoji: "🚨" },
  ASSIGN_TEAM: { badge: "bg-violet-50 text-violet-700 border-violet-200", emoji: "👥" },
  APPROVAL_APPROVED: { badge: "bg-blue-50 text-blue-700 border-blue-200", emoji: "✅" },
  APPROVAL_REJECTED: { badge: "bg-red-50 text-red-700 border-red-200", emoji: "❌" },
  CREATE_RESOURCE: { badge: "bg-amber-50 text-amber-700 border-amber-200", emoji: "📦" },
  CREATE_TEAM: { badge: "bg-indigo-50 text-indigo-700 border-indigo-200", emoji: "🚁" },
  LOCATION_UPDATE: { badge: "bg-teal-50 text-teal-700 border-teal-200", emoji: "📍" },
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const fetchLogs = async () => {
    setLoading(true);
    try { const data = await api<{ data: AuditLog[] }>("/analytics/audit-logs"); setLogs(data.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, []);

  const actions = ["all", ...Array.from(new Set(logs.map(l => l.action)))];
  const filtered = logs.filter(l => {
    const matchSearch = search === "" || l.user_name?.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === "all" || l.action === actionFilter;
    return matchSearch && matchAction;
  });

  const loginCount = logs.filter(l => l.action === "LOGIN").length;
  const errorCount = logs.filter(l => l.action.includes("REJECTED") || l.action.includes("FAIL")).length;
  const uniqueUsers = new Set(logs.map(l => l.user_name).filter(Boolean)).size;

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#051522] tracking-tight">Audit Logs</h1>
          <p className="text-slate-500 font-medium mt-1">Complete traceability of all system actions.</p>
        </div>
        <button onClick={fetchLogs} className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-[#f4f7fe] shadow-sm">
          <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* KPI Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Events", val: logs.length, icon: Activity, bg: "from-[#051522] to-[#0a243a]", shadow: "shadow-slate-500/30" },
          { label: "Login Events", val: loginCount, icon: LogIn, bg: "from-blue-600 to-indigo-700", shadow: "shadow-blue-500/30" },
          { label: "Active Users", val: uniqueUsers, icon: Users, bg: "from-violet-600 to-purple-700", shadow: "shadow-purple-500/30" },
          { label: "Error Events", val: errorCount, icon: AlertTriangle, bg: errorCount > 0 ? "from-red-500 to-rose-600" : "from-slate-500 to-slate-600", shadow: errorCount > 0 ? "shadow-rose-500/30" : "shadow-slate-500/30" },
        ].map((c, i) => (
          <div key={c.label} className={`relative overflow-hidden bg-gradient-to-br ${c.bg} rounded-[24px] p-6 text-white shadow-xl ${c.shadow} transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 group`}>
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 rounded-full bg-white/10 blur-xl group-hover:bg-white/20 transition-all duration-500"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 rounded-full bg-black/10 blur-lg"></div>
            
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold opacity-90 uppercase tracking-widest mb-1">{c.label}</div>
                <div className="text-3xl font-black mt-2 tracking-tight">{c.val}</div>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                <c.icon className="h-7 w-7 text-white" />
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 h-1 w-full bg-black/10">
              <div className="h-full bg-white/40" style={{ width: '40%', animation: `shimmer ${2 + i * 0.5}s infinite linear` }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex-1 min-w-52 shadow-sm">
          <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <input placeholder="Search by user or action..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none w-full placeholder-slate-400 text-slate-800" />
          {search && <button onClick={() => setSearch("")}><X className="h-3.5 w-3.5 text-slate-400" /></button>}
        </div>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none shadow-sm">
          {actions.map(a => <option key={a} value={a}>{a === "all" ? "All Actions" : a}</option>)}
        </select>
        <span className="text-xs text-slate-400 font-medium">{filtered.length} of {logs.length} entries</span>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <ScrollText className="h-5 w-5 text-slate-400" />
          <h2 className="font-extrabold text-[#051522]">System Activity Log</h2>
          <span className="text-xs bg-[#f4f7fe] text-slate-600 px-2.5 py-1 rounded-full font-bold">{filtered.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-[#f4f7fe]">
                {["Timestamp", "User", "Role", "Action", "Table", "Record", "IP"].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-extrabold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => {
                const cfg = actionCfg[log.action];
                return (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-[#f4f7fe] transition-colors">
                    <td className="px-5 py-3 text-xs text-slate-400 font-mono whitespace-nowrap">
                      {new Date(log.logged_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-bold text-[#051522] text-xs">{log.user_name || "System"}</div>
                      <div className="text-xs text-slate-400">{log.user_email || ""}</div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{log.user_role || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cfg?.badge || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                        {cfg?.emoji} {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400 font-mono">{log.table_name || "—"}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">#{log.record_id || "—"}</td>
                    <td className="px-5 py-3 text-xs text-slate-400 font-mono">{log.ip_address || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && !loading && (
            <div className="p-12 text-center text-slate-400 font-medium">No audit logs found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
