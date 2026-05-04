"use client";

import { useEffect, useState, useCallback } from "react";
import { ClipboardCheck, RefreshCw, Check, X as XIcon, Clock, ChevronDown, ChevronUp, History } from "lucide-react";
import { api } from "@/lib/api";

interface Approval {
  id: number; request_type: string; description: string; priority: string;
  status: string; requested_at: string; requested_by_name: string; resolved_by_name: string | null;
}
interface HistoryEntry {
  id: number; action: string; action_by_name: string; comment: string | null; action_at: string;
}

const priorityBadge: Record<string, string> = {
  Urgent: "bg-red-50 text-red-700 border-red-200",
  High:   "bg-orange-50 text-orange-700 border-orange-200",
  Medium: "bg-blue-50 text-blue-700 border-blue-200",
  Low:    "bg-slate-100 text-slate-600 border-slate-200",
};
const statusBadge: Record<string, string> = {
  Pending:  "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-blue-50 text-blue-700 border-blue-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
};

export default function ApprovalsPage() {
  const [approvals, setApprovals]   = useState<Approval[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState("Pending");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [expandedId, setExpandedId]     = useState<number | null>(null);
  const [historyMap, setHistoryMap]     = useState<Record<number, HistoryEntry[]>>({});
  const [commentMap, setCommentMap]     = useState<Record<number, string>>({});

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter ? `/approvals?status=${filter}` : "/approvals";
      const data = await api(url);
      setApprovals(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);
  useEffect(() => { const i = setInterval(fetchApprovals, 30000); return () => clearInterval(i); }, [fetchApprovals]);

  const toggleHistory = async (id: number) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!historyMap[id]) {
      try { const data = await api(`/approvals/history/${id}`); setHistoryMap(p => ({ ...p, [id]: data.data })); }
      catch (err) { console.error(err); }
    }
  };

  const processApproval = async (id: number, action: string) => {
    setProcessingId(id);
    try {
      const comment = commentMap[id] || `${action} by administrator`;
      await api(`/approvals/${id}`, { method: "PATCH", body: { action, comment } });
      setCommentMap(p => { const n = { ...p }; delete n[id]; return n; });
      setHistoryMap(p => { const n = { ...p }; delete n[id]; return n; });
      await fetchApprovals();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setProcessingId(null); }
  };

  const pending  = approvals.filter(a => a.status === "Pending").length;
  const approved = approvals.filter(a => a.status === "Approved").length;
  const rejected = approvals.filter(a => a.status === "Rejected").length;

  const filters = [
    { val: "Pending",  emoji: "⏳", label: "Pending",  count: pending },
    { val: "Approved", emoji: "✅", label: "Approved", count: approved },
    { val: "Rejected", emoji: "❌", label: "Rejected", count: rejected },
    { val: "",         emoji: "📋", label: "All",      count: approvals.length },
  ];

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#051522] tracking-tight">Approval Workflows</h1>
          <p className="text-slate-500 font-medium mt-1">Review and process requests. Auto-refreshes every 30 seconds.</p>
        </div>
        <button onClick={fetchApprovals} className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-[#f4f7fe] shadow-sm">
          <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* KPI Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Pending",  val: pending,            icon: Clock, bg: "from-amber-500 to-orange-500", shadow: "shadow-orange-500/30" },
          { label: "Approved", val: approved,           icon: Check, bg: "from-blue-600 to-indigo-700", shadow: "shadow-blue-500/30" },
          { label: "Rejected", val: rejected,           icon: XIcon, bg: "from-red-500 to-rose-600", shadow: "shadow-rose-500/30" },
          { label: "Total",    val: approvals.length,   icon: ClipboardCheck, bg: "from-[#051522] to-[#0a243a]", shadow: "shadow-slate-500/30" },
        ].map((c, i) => (
          <div key={c.label} className={`relative overflow-hidden bg-gradient-to-br ${c.bg} rounded-[24px] p-6 text-white shadow-xl ${c.shadow} transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 group`}>
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 rounded-full bg-white/10 blur-xl group-hover:bg-white/20 transition-all duration-500"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 rounded-full bg-black/10 blur-lg"></div>
            
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold opacity-90 uppercase tracking-widest mb-1">{c.label} Requests</div>
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

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button key={f.val} onClick={() => setFilter(f.val)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
              filter === f.val ? "bg-[#051522] text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:bg-[#f4f7fe]"
            }`}>
            {f.emoji} {f.label} {f.count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === f.val ? "bg-white/20" : "bg-slate-100"}`}>{f.count}</span>}
          </button>
        ))}
      </div>

      {/* Approvals List */}
      <div className="space-y-3">
        {approvals.map(ap => (
          <div key={ap.id}
            className="bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Badges row */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-extrabold text-[#051522]">#{ap.id} — {ap.request_type}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${priorityBadge[ap.priority]}`}>{ap.priority}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadge[ap.status]}`}>{ap.status}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-3 leading-relaxed">{ap.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>Requested by: <strong className="text-slate-600">{ap.requested_by_name}</strong></span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(ap.requested_at).toLocaleString()}</span>
                    {ap.resolved_by_name && <span className="text-blue-600 font-semibold">Resolved by: {ap.resolved_by_name}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleHistory(ap.id)}
                    className="flex items-center gap-1 p-2 border border-slate-200 bg-[#f4f7fe] rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
                    <History className="h-3.5 w-3.5" />
                    {expandedId === ap.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                  {ap.status === "Pending" && (
                    <>
                      <button onClick={() => processApproval(ap.id, "Approved")} disabled={processingId === ap.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#4318FF] text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm">
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button onClick={() => processApproval(ap.id, "Rejected")} disabled={processingId === ap.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 disabled:opacity-50 transition-all shadow-sm">
                        <XIcon className="h-3.5 w-3.5" /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Comment field */}
              {ap.status === "Pending" && (
                <div className="mt-4">
                  <input
                    placeholder="Add a comment before deciding (optional)..."
                    value={commentMap[ap.id] || ""}
                    onChange={e => setCommentMap(p => ({ ...p, [ap.id]: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-[#f4f7fe] border-0 rounded-xl text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20"
                  />
                </div>
              )}
            </div>

            {/* History Panel */}
            {expandedId === ap.id && (
              <div className="border-t border-slate-100 bg-[#f4f7fe] px-6 py-5">
                <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" /> Approval History
                </p>
                {!historyMap[ap.id] ? (
                  <div className="text-xs text-slate-400 animate-pulse">Loading history...</div>
                ) : historyMap[ap.id].length === 0 ? (
                  <div className="text-xs text-slate-400">No history — this request has not been processed yet.</div>
                ) : (
                  <div className="space-y-3">
                    {historyMap[ap.id].map(h => (
                      <div key={h.id} className="flex items-start gap-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${
                          h.action === "Approved" ? "bg-blue-50 text-blue-700" :
                          h.action === "Rejected" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"
                        }`}>{h.action}</span>
                        <div className="text-xs">
                          <span className="font-bold text-[#051522]">{h.action_by_name}</span>
                          {h.comment && <span className="text-slate-500"> — {h.comment}</span>}
                          <div className="text-slate-400 mt-0.5">{new Date(h.action_at).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {approvals.length === 0 && !loading && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] font-medium">
            No approval requests found.
          </div>
        )}
      </div>
    </div>
  );
}
