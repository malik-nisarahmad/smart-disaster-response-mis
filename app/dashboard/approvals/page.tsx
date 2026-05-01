"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, RefreshCw, Check, X as XIcon, Clock } from "lucide-react";
import { api } from "@/lib/api";

interface Approval {
  id: number; request_type: string; description: string; priority: string;
  status: string; requested_at: string; requested_by_name: string; resolved_by_name: string | null;
}

const priorityColors: Record<string, string> = {
  Urgent: "bg-red-100 text-red-800 border-red-200",
  High: "bg-orange-100 text-orange-800 border-orange-200",
  Medium: "bg-blue-100 text-blue-800 border-blue-200",
  Low: "bg-green-100 text-green-800 border-green-200",
};

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Pending");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const url = filter ? `/approvals?status=${filter}` : "/approvals";
      const data = await api(url);
      setApprovals(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchApprovals(); }, [filter]);

  const processApproval = async (id: number, action: string) => {
    setProcessingId(id);
    try {
      await api(`/approvals/${id}`, { method: "PATCH", body: { action, comment: `${action} by administrator` } });
      await fetchApprovals();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally { setProcessingId(null); }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approval Workflows</h1>
          <p className="text-slate-500">Review and process approval requests.</p>
        </div>
        <button onClick={fetchApprovals} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 shadow-sm">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["", "Pending", "Approved", "Rejected"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f ? "bg-slate-900 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}>
            {f || "All"}
          </button>
        ))}
      </div>

      {/* Approvals List */}
      <div className="space-y-3">
        {approvals.map(ap => (
          <div key={ap.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardCheck className="h-4 w-4 text-slate-400" />
                  <span className="font-bold text-black">{ap.request_type}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${priorityColors[ap.priority]}`}>{ap.priority}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[ap.status]}`}>{ap.status}</span>
                </div>
                <p className="text-sm text-slate-600 mb-2">{ap.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>By: {ap.requested_by_name}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(ap.requested_at).toLocaleString()}</span>
                  {ap.resolved_by_name && <span>Resolved by: {ap.resolved_by_name}</span>}
                </div>
              </div>
              {ap.status === "Pending" && (
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => processApproval(ap.id, "Approved")} disabled={processingId === ap.id}
                    className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors">
                    <Check className="h-3 w-3" /> Approve
                  </button>
                  <button onClick={() => processApproval(ap.id, "Rejected")} disabled={processingId === ap.id}
                    className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
                    <XIcon className="h-3 w-3" /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {approvals.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-400">No approval requests found.</div>
        )}
      </div>
    </div>
  );
}
