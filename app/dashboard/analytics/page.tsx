"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart, Line, Scatter, Sector
} from "recharts";
import { Filter, RefreshCw, Zap, ClipboardList, Activity } from "lucide-react";
import { api } from "@/lib/api";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const GRADIENTS = ['url(#gradBlue)', 'url(#gradGreen)', 'url(#gradYellow)', 'url(#gradRed)', 'url(#gradPurple)', 'url(#gradCyan)'];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill={fill} className="font-bold text-lg">
        {payload.disaster_type}
      </text>
      <text x={cx} y={cy + 15} dy={8} textAnchor="middle" fill="#64748b" className="text-sm">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 10} startAngle={startAngle} endAngle={endAngle} fill={fill} filter="url(#shadow3d)" />
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 14} outerRadius={outerRadius + 18} fill={fill} />
    </g>
  );
};

type Tab = "incidents" | "approvals" | "performance";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("incidents");
  const [pieActiveIndex, setPieActiveIndex] = useState(0);
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
      setResourcesData(Array.isArray(res.byCategory) ? res.byCategory : []);
      setResponseTimes(Array.isArray(rTimes.data) ? rTimes.data : []);
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
      setPerfData(Array.isArray(data.data) ? data.data : []);
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
      <svg width="0" height="0">
        <defs>
          <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="3" dy="10" stdDeviation="6" floodColor="#000" floodOpacity="0.3" />
          </filter>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={1}/>
            <stop offset="95%" stopColor="#1e3a8a" stopOpacity={1}/>
          </linearGradient>
          <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={1}/>
            <stop offset="95%" stopColor="#065f46" stopOpacity={1}/>
          </linearGradient>
          <linearGradient id="gradYellow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={1}/>
            <stop offset="95%" stopColor="#78350f" stopOpacity={1}/>
          </linearGradient>
          <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={1}/>
            <stop offset="95%" stopColor="#7f1d1d" stopOpacity={1}/>
          </linearGradient>
          <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={1}/>
            <stop offset="95%" stopColor="#4c1d95" stopOpacity={1}/>
          </linearGradient>
          <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={1}/>
            <stop offset="95%" stopColor="#164e63" stopOpacity={1}/>
          </linearGradient>
          <linearGradient id="colorInd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
      </svg>
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
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm transform transition duration-500 hover:scale-[1.02]">
              <h3 className="font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Incidents by Disaster Type</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={incidentsData?.byType || []} 
                      cx="50%" cy="50%" 
                      innerRadius={60} 
                      outerRadius={90} 
                      dataKey="count" 
                      nameKey="disaster_type"
                      // @ts-ignore Recharts activeIndex type issue in some versions
                      activeIndex={pieActiveIndex}
                      // @ts-ignore
                      activeShape={renderActiveShape}
                      onMouseEnter={(_, index) => setPieActiveIndex(index)}
                      isAnimationActive={true}
                      animationDuration={1200}
                      animationEasing="ease-out"
                    >
                      {(incidentsData?.byType || []).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={GRADIENTS[index % GRADIENTS.length]} filter="url(#shadow3d)" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '10px', boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Incidents by Severity — Bar (drill-down applied) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm transform transition duration-500 hover:scale-[1.02]">
              <h3 className="font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-500">Incidents by Severity</h3>
              <p className="text-xs text-slate-400 mb-3">{severityFilter !== "all" ? `Filtered: ${severityFilter}` : "All severities"}</p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredBySeverity} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                    <XAxis dataKey="severity" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive={true}>
                      {filteredBySeverity.map((_: any, i: number) => <Cell key={i} fill={GRADIENTS[i % GRADIENTS.length]} filter="url(#glow)" />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Incidents by Status — Area (drill-down applied) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm transform transition duration-500 hover:scale-[1.02]">
              <h3 className="font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">Incidents by Status</h3>
              <p className="text-xs text-slate-400 mb-3">{statusFilter !== "all" ? `Filtered: ${statusFilter}` : "All statuses"}</p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredByStatus} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                    <XAxis dataKey="status" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ stroke: '#8b5cf6', strokeWidth: 2 }} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorInd)" filter="url(#glow)" isAnimationActive={true} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Response Times — Composed */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm transform transition duration-500 hover:scale-[1.02]">
              <h3 className="font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-500">Avg Response Time (Minutes)</h3>
              <p className="text-xs text-slate-400 mb-3">{severityFilter !== "all" ? `Filtered by: ${severityFilter}` : "All severities"}</p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={filteredResponseTimes} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                    <XAxis dataKey="disaster_type" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="avg_response_minutes" name="Avg Mins" fill="url(#gradCyan)" radius={[6, 6, 0, 0]} maxBarSize={40} isAnimationActive={true}>
                      {filteredResponseTimes.map((_: any, i: number) => <Cell key={`r-${i}`} filter="url(#shadow3d)" />)}
                    </Bar>
                    <Line type="monotone" dataKey="avg_response_minutes" stroke="#10b981" strokeWidth={3} dot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Resource Inventory by Category */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-2 transform transition duration-500 hover:scale-[1.01]">
              <h3 className="font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-green-500">Resource Stock by Category</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={resourcesData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                    <XAxis dataKey="category" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="total_quantity" name="Total Quantity" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" filter="url(#glow)" isAnimationActive={true} />
                  </AreaChart>
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
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm transform transition duration-500 hover:scale-[1.02]">
            <h3 className="font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Approvals by Request Type</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={approvalsData?.byType || []} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                  <XAxis dataKey="request_type" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="approved" name="Approved" fill="url(#gradGreen)" stackId="a" radius={[0, 0, 0, 0]} filter="url(#shadow3d)" />
                  <Bar dataKey="rejected" name="Rejected" fill="url(#gradRed)" stackId="a" filter="url(#shadow3d)" />
                  <Bar dataKey="pending" name="Pending" fill="url(#gradYellow)" stackId="a" radius={[6, 6, 0, 0]} filter="url(#shadow3d)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* By Priority — Pie */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm transform transition duration-500 hover:scale-[1.02]">
            <h3 className="font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">Approvals by Priority</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={approvalsData?.byPriority || []} 
                    cx="50%" cy="50%" 
                    innerRadius={60} 
                    outerRadius={90} 
                    dataKey="total" 
                    nameKey="priority" 
                    // @ts-ignore
                    activeIndex={pieActiveIndex}
                    // @ts-ignore
                    activeShape={renderActiveShape}
                    onMouseEnter={(_, index) => setPieActiveIndex(index)}
                    isAnimationActive={true}
                    animationDuration={1200}
                  >
                    {(approvalsData?.byPriority || []).map((_: any, i: number) => <Cell key={i} fill={GRADIENTS[i % GRADIENTS.length]} filter="url(#shadow3d)" />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
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
