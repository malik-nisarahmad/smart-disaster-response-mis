"use client";

import { useEffect, useState } from "react";
import { ScrollText, RefreshCw, Filter, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";

interface AuditLog {
  id: number; action: string; table_name: string; record_id: number;
  old_values: string; new_values: string; ip_address: string;
  logged_at: string; user_name: string; user_email: string; user_role: string;
}

const actionColors: Record<string, string> = {
  LOGIN: "bg-green-100 text-green-800",
  FINANCIAL_TRANSACTION_CREATED: "bg-blue-100 text-blue-800",
  UPDATE_EMERGENCY_STATUS: "bg-orange-100 text-orange-800",
  ASSIGN_TEAM: "bg-purple-100 text-purple-800",
  APPROVAL_APPROVED: "bg-green-100 text-green-800",
  APPROVAL_REJECTED: "bg-red-100 text-red-800",
  CREATE_RESOURCE: "bg-teal-100 text-teal-800",
  CREATE_TEAM: "bg-blue-100 text-blue-800",
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try { const data = await api("/analytics/audit-logs"); setLogs(data.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-slate-500">Complete traceability of all system actions.</p>
        </div>
        <button onClick={fetchLogs} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 shadow-sm">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-slate-400" />
          <h2 className="font-bold text-lg">Activity Log</h2>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">{logs.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Timestamp</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">User</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Action</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Table</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Record</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-500 font-mono">{new Date(log.logged_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-xs">{log.user_name || "System"}</div>
                    <div className="text-xs text-slate-400">{log.user_email || ""}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{log.user_role || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${actionColors[log.action] || "bg-slate-100 text-slate-800"}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 font-mono">{log.table_name || "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">#{log.record_id || "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{log.ip_address || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && !loading && (
          <div className="p-8 text-center text-slate-400">No audit logs found.</div>
        )}
      </div>
    </div>
  );
}
