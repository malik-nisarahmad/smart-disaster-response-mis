"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Filter, RefreshCw, Clock, MapPin, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";

interface Emergency {
  id: number;
  reporter_name: string;
  disaster_type_name: string;
  severity: string;
  latitude: number;
  longitude: number;
  location_description: string;
  description: string;
  status: string;
  operator_name: string | null;
  reported_at: string;
}

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Acknowledged: "bg-blue-100 text-blue-800",
  "In Progress": "bg-orange-100 text-orange-800",
  Resolved: "bg-green-100 text-green-800",
  Closed: "bg-slate-100 text-slate-800",
};

const severityColors: Record<string, string> = {
  Critical: "bg-red-100 text-red-800 border-red-200",
  High: "bg-orange-100 text-orange-800 border-orange-200",
  Moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Low: "bg-green-100 text-green-800 border-green-200",
};

export default function OperatorPage() {
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [selected, setSelected] = useState<Emergency | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchEmergencies = async () => {
    setLoading(true);
    try {
      let url = "/emergencies?limit=50";
      if (filterStatus) url += `&status=${filterStatus}`;
      if (filterSeverity) url += `&severity=${filterSeverity}`;
      const data = await api(url);
      setEmergencies(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmergencies(); }, [filterStatus, filterSeverity]);

  const updateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await api(`/emergencies/${id}/status`, { method: "PATCH", body: { status } });
      await fetchEmergencies();
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleString();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Emergency Reports</h1>
          <p className="text-slate-500">Manage and respond to incoming emergency reports.</p>
        </div>
        <button onClick={fetchEmergencies} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-all shadow-sm">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
          <Filter className="h-4 w-4 text-slate-400" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-sm font-medium bg-transparent border-none focus:outline-none appearance-none pr-6 cursor-pointer">
            <option value="">All Statuses</option>
            <option>Pending</option>
            <option>Acknowledged</option>
            <option>In Progress</option>
            <option>Resolved</option>
            <option>Closed</option>
          </select>
          <ChevronDown className="h-3 w-3 text-slate-400 -ml-4" />
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
          <AlertTriangle className="h-4 w-4 text-slate-400" />
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
            className="text-sm font-medium bg-transparent border-none focus:outline-none appearance-none pr-6 cursor-pointer">
            <option value="">All Severities</option>
            <option>Critical</option>
            <option>High</option>
            <option>Moderate</option>
            <option>Low</option>
          </select>
          <ChevronDown className="h-3 w-3 text-slate-400 -ml-4" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">ID</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Location</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Severity</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Reporter</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Time</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {emergencies.map((em) => (
                <tr key={em.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelected(em)}>
                  <td className="px-4 py-3 font-mono text-xs">#{em.id}</td>
                  <td className="px-4 py-3 font-medium">{em.disaster_type_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-slate-600">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[150px]">{em.location_description || `${em.latitude}, ${em.longitude}`}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${severityColors[em.severity]}`}>{em.severity}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[em.status]}`}>{em.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{em.reporter_name || "Anonymous"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(em.reported_at)}</div>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    {em.status === "Pending" && (
                      <button onClick={() => updateStatus(em.id, "Acknowledged")} disabled={updatingId === em.id}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        Acknowledge
                      </button>
                    )}
                    {em.status === "Acknowledged" && (
                      <button onClick={() => updateStatus(em.id, "In Progress")} disabled={updatingId === em.id}
                        className="px-3 py-1 bg-orange-600 text-white rounded-md text-xs font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors">
                        Start
                      </button>
                    )}
                    {em.status === "In Progress" && (
                      <button onClick={() => updateStatus(em.id, "Resolved")} disabled={updatingId === em.id}
                        className="px-3 py-1 bg-green-600 text-white rounded-md text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors">
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {emergencies.length === 0 && !loading && (
          <div className="p-8 text-center text-slate-400">No emergency reports found.</div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Emergency #{selected.id}</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-black text-2xl leading-none">&times;</button>
            </div>
            <div className="space-y-3 text-sm">
              <div><strong>Type:</strong> {selected.disaster_type_name}</div>
              <div><strong>Severity:</strong> <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${severityColors[selected.severity]}`}>{selected.severity}</span></div>
              <div><strong>Status:</strong> <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[selected.status]}`}>{selected.status}</span></div>
              <div><strong>Location:</strong> {selected.location_description || "Not specified"}</div>
              <div><strong>Coordinates:</strong> {selected.latitude}, {selected.longitude}</div>
              <div><strong>Reporter:</strong> {selected.reporter_name || "Anonymous"}</div>
              <div><strong>Operator:</strong> {selected.operator_name || "Unassigned"}</div>
              <div><strong>Reported At:</strong> {formatDate(selected.reported_at)}</div>
              {selected.description && <div><strong>Description:</strong> {selected.description}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
