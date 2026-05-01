"use client";

import { useEffect, useState } from "react";
import { Activity, Users, AlertTriangle, Banknote, ClipboardCheck, Building2 } from "lucide-react";
import { api } from "@/lib/api";

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

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEmergencies, setRecentEmergencies] = useState<Array<Record<string, unknown>>>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashData, emergData, approvalData] = await Promise.all([
          api("/analytics/dashboard"),
          api("/emergencies?limit=5"),
          api("/approvals?status=Pending"),
        ]);
        setStats(dashData.data);
        setRecentEmergencies(emergData.data);
        setPendingApprovals(approvalData.data);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const severityColor: Record<string, string> = {
    Critical: "text-red-600 bg-red-50",
    High: "text-orange-600 bg-orange-50",
    Moderate: "text-yellow-600 bg-yellow-50",
    Low: "text-green-600 bg-green-50",
  };

  const priorityColor: Record<string, string> = {
    Urgent: "text-red-600 bg-red-50",
    High: "text-orange-600 bg-orange-50",
    Medium: "text-blue-600 bg-blue-50",
    Low: "text-green-600 bg-green-50",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 font-medium animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-slate-500">Real-time snapshot of ongoing emergency responses and resources.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-600">Active Emergencies</h3>
            <Activity className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-3xl font-bold">{stats?.active_emergencies ?? 0}</div>
          <p className="text-xs text-slate-500 mt-1">Currently active incidents</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-600">Available Teams</h3>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-3xl font-bold">{stats?.available_teams ?? 0} / {stats?.total_teams ?? 0}</div>
          <p className="text-xs text-slate-500 mt-1">{(stats?.total_teams ?? 0) - (stats?.available_teams ?? 0)} deployed</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-600">Low Stock Alerts</h3>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-orange-600">{stats?.low_stock_resources ?? 0}</div>
          <p className="text-xs text-slate-500 mt-1">Resources below threshold</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-600">Available Funds</h3>
            <Banknote className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-3xl font-bold">${((stats?.total_donations ?? 0) - (stats?.total_expenses ?? 0)).toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-1">Donations - Expenses</p>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-600">Pending Approvals</h3>
            <ClipboardCheck className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-purple-600">{stats?.pending_approvals ?? 0}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-600">Operational Hospitals</h3>
            <Building2 className="h-4 w-4 text-teal-600" />
          </div>
          <div className="text-3xl font-bold text-teal-600">{stats?.operational_hospitals ?? 0}</div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Recent Incident Reports</h3>
          {recentEmergencies.length === 0 ? (
            <p className="text-sm text-slate-400">No emergencies found.</p>
          ) : (
            <div className="space-y-3">
              {recentEmergencies.map((em) => (
                <div key={String(em.id)} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <p className="text-sm font-semibold">{String(em.disaster_type_name)}</p>
                    <p className="text-xs text-slate-500">{String(em.location_description || "Location not specified")}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${severityColor[String(em.severity)] || ""}`}>
                    {String(em.severity)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Pending Approvals</h3>
          {pendingApprovals.length === 0 ? (
            <p className="text-sm text-slate-400">No pending approvals.</p>
          ) : (
            <div className="space-y-3">
              {pendingApprovals.slice(0, 5).map((ap) => (
                <div key={String(ap.id)} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <p className="text-sm font-semibold">{String(ap.request_type)}</p>
                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{String(ap.description || "")}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${priorityColor[String(ap.priority)] || ""}`}>
                    {String(ap.priority)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
