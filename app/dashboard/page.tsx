"use client";

import { useEffect, useState } from "react";
import { Activity, ShieldAlert, Plus, MapPin, Calendar, CheckCircle2, Navigation } from "lucide-react";
import { api, getUser } from "@/lib/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Link from "next/link";

interface DashboardStats {
  active_emergencies: number;
  available_teams: number;
  total_teams: number;
  low_stock_resources: number;
  total_donations: number;
  total_expenses: number;
  pending_approvals: number;
  operational_hospitals: number;
}

const incidentTrends = [
  { name: "Jan", incidents: 20 }, { name: "Feb", incidents: 38 },
  { name: "Mar", incidents: 25 }, { name: "Apr", incidents: 32 },
  { name: "May", incidents: 48 }, { name: "Jun", incidents: 40 },
  { name: "Jul", incidents: 64 }, { name: "Aug", incidents: 75 },
  { name: "Sep", incidents: 42 }, { name: "Oct", incidents: 41 },
];

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEmergencies, setRecentEmergencies] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{full_name: string, role: string} | null>(null);

  useEffect(() => {
    setUser(getUser() as {full_name: string, role: string});
    async function fetchData() {
      try {
        const [dashData, emergData] = await Promise.all([
          api("/analytics/dashboard"),
          api("/emergencies?limit=5"),
        ]);
        setStats(dashData.data);
        setRecentEmergencies(emergData.data);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#051522] animate-spin"></div>
          <div className="text-slate-500 font-semibold tracking-wide animate-pulse">Initializing Dashboard...</div>
        </div>
      </div>
    );
  }

  const firstName = user?.full_name?.split(" ")[0] || "Operator";
  const deployedTeamsPercent = stats?.total_teams ? Math.round(((stats.total_teams - stats.available_teams) / stats.total_teams) * 100) : 0;
  const activeEmergenciesGoal = 50; // Mock goal
  const emergenciesPercent = Math.round(((stats?.active_emergencies || 0) / activeEmergenciesGoal) * 100);

  return (
    <div className="pb-12 max-w-[1600px] mx-auto">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Main Dashboard (Spans 2 columns on XL screens) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-[28px] p-8 sm:p-10 relative overflow-hidden shadow-lg animate-fade-in-up">
            {/* Decorative background circles */}
            <div className="absolute top-[-20%] left-[-10%] w-64 h-64 rounded-full bg-white/5 blur-2xl"></div>
            <div className="absolute bottom-[-20%] right-[20%] w-64 h-64 rounded-full bg-blue-500/20 blur-3xl"></div>
            
            <div className="relative z-10 w-full sm:w-2/3">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Welcome Back, {firstName}!</h1>
              <p className="text-blue-100 font-medium mb-8">Check your daily intelligence feed and allocate active resources.</p>
              
              <div className="flex items-center gap-4">
                <Link href="/report" className="px-6 py-2.5 bg-white text-blue-700 rounded-full font-bold text-sm shadow-md hover:bg-slate-50 hover:scale-105 transition-all flex items-center gap-2">
                  <Plus className="w-4 h-4" /> New Report
                </Link>
                <Link href="/dashboard/operator" className="px-6 py-2.5 bg-transparent border border-blue-400 text-white rounded-full font-bold text-sm hover:bg-white/10 transition-colors">
                  Discover
                </Link>
              </div>
            </div>

            {/* Isometric Illustration (using CSS/shapes as placeholder or the generated image if working) */}
            <div className="hidden sm:block absolute right-[-20px] bottom-[-20px] w-64 h-64 mix-blend-screen opacity-90 pointer-events-none">
               <img src="/isometric_server.png" alt="Command Center" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Radial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Card 1: Active Incidents */}
            <div className="relative overflow-hidden bg-white rounded-[24px] p-6 sm:p-8 shadow-xl shadow-slate-200/50 transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 group flex items-center justify-between" style={{ animationDelay: "100ms" }}>
              {/* Background accent glow */}
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 rounded-full bg-blue-100 blur-2xl group-hover:bg-blue-200 transition-all duration-500"></div>
              
              <div className="relative z-10">
                <div className="flex items-end gap-2 mb-2">
                  <h3 className="text-5xl font-black text-slate-800 tracking-tight">{stats?.active_emergencies || 0}</h3>
                  <span className="text-lg font-bold text-slate-400 mb-1">/ {activeEmergenciesGoal}</span>
                </div>
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Active<br />Emergencies</p>
              </div>
              <div className="relative w-28 h-28 z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{value: emergenciesPercent}, {value: 100 - emergenciesPercent}]} cx="50%" cy="50%" innerRadius={35} outerRadius={48} dataKey="value" startAngle={90} endAngle={-270} stroke="none" isAnimationActive={true}>
                      <Cell fill="url(#colorBlueGrad)" />
                      <Cell fill="#F1F5F9" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center font-extrabold text-blue-600 text-lg">
                  {emergenciesPercent}%
                </div>
              </div>
            </div>

            {/* Card 2: Deployed Teams */}
            <div className="relative overflow-hidden bg-white rounded-[24px] p-6 sm:p-8 shadow-xl shadow-slate-200/50 transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 group flex items-center justify-between" style={{ animationDelay: "200ms" }}>
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 rounded-full bg-emerald-100 blur-2xl group-hover:bg-emerald-200 transition-all duration-500"></div>
              
              <div className="relative z-10">
                <div className="flex items-end gap-2 mb-2">
                  <h3 className="text-5xl font-black text-slate-800 tracking-tight">{(stats?.total_teams || 0) - (stats?.available_teams || 0)}</h3>
                  <span className="text-lg font-bold text-slate-400 mb-1">/ {stats?.total_teams || 0}</span>
                </div>
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Deployed<br />Rescue Teams</p>
              </div>
              <div className="relative w-28 h-28 z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{value: deployedTeamsPercent}, {value: 100 - deployedTeamsPercent}]} cx="50%" cy="50%" innerRadius={35} outerRadius={48} dataKey="value" startAngle={90} endAngle={-270} stroke="none" isAnimationActive={true}>
                      <Cell fill="url(#colorGreenGrad)" />
                      <Cell fill="#F1F5F9" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center font-extrabold text-emerald-600 text-lg">
                  {deployedTeamsPercent}%
                </div>
              </div>
            </div>

            <svg width="0" height="0">
              <defs>
                <linearGradient id="colorBlueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={1}/>
                  <stop offset="95%" stopColor="#1e3a8a" stopOpacity={1}/>
                </linearGradient>
                <linearGradient id="colorGreenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={1}/>
                  <stop offset="95%" stopColor="#065f46" stopOpacity={1}/>
                </linearGradient>
              </defs>
            </svg>

          </div>

          {/* Area Chart: Productivity / Trends */}
          <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-900">Incident Velocity Metrics</h3>
              <select className="bg-transparent text-slate-500 font-bold text-sm outline-none cursor-pointer">
                <option>Monthly</option>
                <option>Weekly</option>
              </select>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={incidentTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTrends" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4318FF" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4318FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A3AED0', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A3AED0', fontWeight: 'bold' }} />
                  <Tooltip 
                    cursor={{ stroke: '#4318FF', strokeWidth: 1, strokeDasharray: '4 4' }}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#2B3674', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="incidents" stroke="#4318FF" strokeWidth={3} fillOpacity={1} fill="url(#colorTrends)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Sidebar Content */}
        <div className="space-y-6">
          
          {/* Upcoming Tasks (Recent Incidents) */}
          <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-fade-in-up" style={{ animationDelay: "400ms" }}>
            <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Reports</h3>
            
            {recentEmergencies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 bg-[#f4f7fe] rounded-2xl">
                <CheckCircle2 className="h-8 w-8 text-blue-400 mb-2" />
                <p className="text-sm font-bold text-slate-400">All clear. No active alerts.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentEmergencies.map((em, idx) => (
                  <div key={String(em.id)} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-[#f4f7fe] transition-colors cursor-pointer group border border-transparent hover:border-blue-100">
                    <div className="w-1 bg-blue-500 h-10 rounded-full mt-1"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">{String(em.disaster_type_name)}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-slate-500">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{String(em.location_description || "Unknown Location")}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <button className="w-full mt-6 py-3 rounded-xl border-2 border-[#f4f7fe] text-blue-600 font-bold text-sm hover:bg-[#f4f7fe] transition-colors">
              View All Incidents
            </button>
          </div>

          {/* Quick Stats Box */}
          <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-fade-in-up" style={{ animationDelay: "500ms" }}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-500 mb-1">Operational Hospitals</h4>
                <p className="text-2xl font-extrabold text-slate-900">{stats?.operational_hospitals || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
                <Activity className="h-6 w-6 text-teal-600" />
              </div>
            </div>
            
            <div className="w-full h-[1px] bg-slate-100 my-5"></div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-500 mb-1">Pending Approvals</h4>
                <p className="text-2xl font-extrabold text-slate-900">{stats?.pending_approvals || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                <Navigation className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
