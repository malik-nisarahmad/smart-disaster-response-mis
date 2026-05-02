"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Filter, RefreshCw, Zap, ClipboardList, Activity } from "lucide-react";
import { api } from "@/lib/api";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

type Tab = "incidents" | "approvals" | "performance";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("incidents");
  const [incidentsData, setIncidentsData] = useState<any>(null);
  const [approvalsData, setApprovalsData] = useState<any>(null);
  const [perfData, setPerfData] = useState<any[]>([]);
  const [resourcesData, setResourcesData] = useState<any[]>([]);
  const [responseTimes, setResponseTimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");

  // Drill-down filters
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [inc, res, rTimes] = await Promise.all([
        api(`/analytics/incidents${timeRange !== "all" ? "?range=" + timeRange : ""}`),
        api("/analytics/resources"),
        api("/analytics/response-times"),
      ]);
      setIncidentsData(inc);
      setResourcesData(res.byCategory || []);
      setResponseTimes(rTimes.data || []);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  const fetchApprovals = useCallback(async () => {
    try {
      const data = await api("/analytics/approvals");
      setApprovalsData(data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchPerformance = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/analytics/performance");
      setPerfData(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (activeTab === "approvals") fetchApprovals();
    if (activeTab === "performance") fetchPerformance();
  }, [activeTab, fetchApprovals, fetchPerformance]);

  // Real-time polling for incidents tab every 60s
  useEffect(() => {
    if (activeTab !== "incidents") return;
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [activeTab, fetchData]);

  // Apply drill-down filters client-side
  const filteredBySeverity = (incidentsData?.bySeverity || []).filter(
    (d: any) => severityFilter === "all" || d.severity === severityFilter
  );
  const filteredByStatus = (incidentsData?.byStatus || []).filter(
    (d: any) => statusFilter === "all" || d.status === statusFilter
  );
  const filteredResponseTimes = responseTimes.filter(
    (d: any) => severityFilter === "all" || d.severity === severityFilter
  );

  if (loading && !incidentsData && activeTab === "incidents") {
    return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Reporting</h1>
          <p className="text-slate-500">Real-time system insights with interactive drill-down filtering.</p>
        </div>
        <div className="flex gap-2 items-center">
          {activeTab === "incidents" && (
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
              <Filter className="w-4 h-4 text-slate-500" />
              <select className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
                value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                <option value="all">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          )}
          <button onClick={() => { if (activeTab === "incidents") fetchData(); else if (activeTab === "approvals") fetchApprovals(); else fetchPerformance(); }}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {([
          { id: "incidents", label: "Incident Analytics", icon: Activity },
          { id: "approvals", label: "Approval Reports", icon: ClipboardList },
          { id: "performance", label: "DB Performance", icon: Zap },
        ] as { id: Tab; label: string; icon: any }[]).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ── INCIDENTS TAB ── */}
      {activeTab === "incidents" && (
        <>
          {/* Drill-down filters */}
          <div className="flex gap-3 items-center flex-wrap">
            <span className="text-sm text-slate-500 font-medium">Drill-down:</span>
            <div className="flex gap-2">
              <label className="text-xs text-slate-500">Severity:</label>
              <select className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
                <option value="all">All</option>
                {["Critical", "High", "Moderate", "Low"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <label className="text-xs text-slate-500">Status:</label>
              <select className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All</option>
                {["Pending", "Acknowledged", "In Progress", "Resolved", "Closed"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {(severityFilter !== "all" || statusFilter !== "all") && (
              <button onClick={() => { setSeverityFilter("all"); setStatusFilter("all"); }}
                className="text-xs text-blue-600 hover:underline">Clear filters</button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Incidents by Type — Pie */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold mb-4">Incidents by Disaster Type</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={incidentsData?.byType || []} cx="50%" cy="50%" outerRadius={90} dataKey="count" nameKey="disaster_type" label={({ disaster_type, count }) => `${disaster_type}: ${count}`}>
                      {(incidentsData?.byType || []).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Incidents by Severity — Bar (drill-down applied) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold mb-1">Incidents by Severity</h3>
              <p className="text-xs text-slate-400 mb-3">{severityFilter !== "all" ? `Filtered: ${severityFilter}` : "All severities"}</p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredBySeverity}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="severity" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {filteredBySeverity.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Incidents by Status — Bar (drill-down applied) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold mb-1">Incidents by Status</h3>
              <p className="text-xs text-slate-400 mb-3">{statusFilter !== "all" ? `Filtered: ${statusFilter}` : "All statuses"}</p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredByStatus}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="status" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Response Times — Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold mb-1">Avg Response Time (Minutes)</h3>
              <p className="text-xs text-slate-400 mb-3">{severityFilter !== "all" ? `Filtered by: ${severityFilter}` : "All severities"}</p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredResponseTimes}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="disaster_type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avg_response_minutes" name="Avg Mins" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Resource Inventory by Category */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-2">
              <h3 className="font-bold mb-4">Resource Stock by Category</h3>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resourcesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total_quantity" name="Total Quantity" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── APPROVAL REPORTS TAB ── */}
      {activeTab === "approvals" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Type */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-bold mb-4">Approvals by Request Type</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={approvalsData?.byType || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="request_type" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="approved" name="Approved" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="rejected" name="Rejected" fill="#ef4444" stackId="a" />
                  <Bar dataKey="pending" name="Pending" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* By Priority — Pie */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-bold mb-4">Approvals by Priority</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={approvalsData?.byPriority || []} cx="50%" cy="50%" outerRadius={90} dataKey="total" nameKey="priority" label={({ priority, total }) => `${priority}: ${total}`}>
                    {(approvalsData?.byPriority || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Avg Resolution Time Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-2">
            <h3 className="font-bold mb-4">Approval Resolution Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 text-left text-slate-500 text-xs">
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Total</th>
                  <th className="pb-2 font-medium text-green-600">Approved</th>
                  <th className="pb-2 font-medium text-red-600">Rejected</th>
                  <th className="pb-2 font-medium text-yellow-600">Pending</th>
                  <th className="pb-2 font-medium">Avg Resolution (min)</th>
                </tr></thead>
                <tbody>
                  {(approvalsData?.byType || []).map((row: any) => (
                    <tr key={row.request_type} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 font-medium">{row.request_type}</td>
                      <td className="py-2">{row.total}</td>
                      <td className="py-2 text-green-600">{row.approved}</td>
                      <td className="py-2 text-red-600">{row.rejected}</td>
                      <td className="py-2 text-yellow-600">{row.pending}</td>
                      <td className="py-2">{row.avg_resolution_minutes ? `${Math.round(row.avg_resolution_minutes)} min` : "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Approvals */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-2">
            <h3 className="font-bold mb-4">Recent Approval Activity</h3>
            <div className="space-y-2">
              {(approvalsData?.recent || []).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.status === "Approved" ? "bg-green-100 text-green-700" :
                        a.status === "Rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                      }`}>{a.status}</span>
                    <span className="font-medium">{a.request_type}</span>
                    <span className="text-slate-400 text-xs">by {a.requested_by}</span>
                  </div>
                  <span className="text-xs text-slate-400">{new Date(a.requested_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DB PERFORMANCE TAB ── */}
      {activeTab === "performance" && (
        <div className="flex flex-col gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
            <strong>Index Benchmark:</strong> Each query is timed using <code>process.hrtime.bigint()</code> on the live database.
            Queries targeting indexed columns run faster. View queries abstract complex joins into single reads.
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>
          ) : (
            <>
              {/* Performance bar chart */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold mb-4">Query Execution Time (ms) — Live Benchmark</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={perfData.filter(d => d.status === "ok")} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" unit=" ms" />
                      <YAxis type="category" dataKey="name" width={280} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => `${v} ms`} />
                      <Bar dataKey="duration_ms" name="Duration (ms)" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                        {perfData.filter(d => d.status === "ok").map((d: any, i: number) => (
                          <Cell key={i} fill={d.duration_ms < 5 ? "#10b981" : d.duration_ms < 20 ? "#f59e0b" : "#ef4444"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Fast (&lt;5ms)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500 inline-block" /> Moderate (5-20ms)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> Slow (&gt;20ms)</span>
                </div>
              </div>

              {/* Detailed results table */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold mb-4">Detailed Performance Results</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100 text-left text-slate-500 text-xs">
                      <th className="pb-2 font-medium">Benchmark Query</th>
                      <th className="pb-2 font-medium">Duration</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Assessment</th>
                    </tr></thead>
                    <tbody>
                      {perfData.map((row, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="py-2 text-xs text-slate-600 max-w-xs">{row.name}</td>
                          <td className="py-2 font-mono font-bold">
                            {row.duration_ms !== null ? `${row.duration_ms} ms` : "—"}
                          </td>
                          <td className="py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${row.status === "ok" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              }`}>{row.status}</span>
                          </td>
                          <td className="py-2 text-xs">
                            {row.status === "error" ? <span className="text-red-600">{row.error}</span> :
                              row.duration_ms < 5 ? <span className="text-green-600">✓ Excellent — index utilized</span> :
                                row.duration_ms < 20 ? <span className="text-yellow-600">~ Acceptable</span> :
                                  <span className="text-red-600">⚠ Slow — consider optimization</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-4 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-700">Index vs View Analysis Notes:</p>
                  <p>• <strong>Views</strong> (vw_active_emergencies etc.) pre-join multiple tables, reducing repeated join overhead in reports.</p>
                  <p>• <strong>Indexed columns</strong> (status, severity, transaction_date) allow the SQL Server query optimizer to use B-tree seeks instead of full table scans.</p>
                  <p>• <strong>INSERT/UPDATE overhead</strong>: Each index adds ~5-15% write overhead — acceptable given the read-heavy nature of this MIS system.</p>
                  <p>• <strong>Composite indexes</strong> (status+severity on emergency_reports) benefit filtered dashboard queries significantly.</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
