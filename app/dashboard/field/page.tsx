"use client";

import { useEffect, useState } from "react";
import { Users, Plus, RefreshCw, X } from "lucide-react";
import { api } from "@/lib/api";

interface Team {
  id: number;
  team_name: string;
  team_type: string;
  leader_name: string;
  member_count: number;
  status: string;
  total_assignments: number;
  completed_assignments: number;
}

const statusColors: Record<string, string> = {
  Available: "bg-green-100 text-green-800",
  Assigned: "bg-blue-100 text-blue-800",
  Busy: "bg-orange-100 text-orange-800",
  Completed: "bg-teal-100 text-teal-800",
  "Off Duty": "bg-slate-100 text-slate-800",
};

const typeColors: Record<string, string> = {
  Medical: "bg-red-50 text-red-700 border-red-200",
  Fire: "bg-orange-50 text-orange-700 border-orange-200",
  Rescue: "bg-blue-50 text-blue-700 border-blue-200",
  Search: "bg-purple-50 text-purple-700 border-purple-200",
  Hazmat: "bg-yellow-50 text-yellow-700 border-yellow-200",
};

export default function FieldPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [emergencyId, setEmergencyId] = useState("");
  const [newTeam, setNewTeam] = useState({ team_name: "", team_type: "Rescue", leader_name: "", member_count: 5 });

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const data = await api("/rescue-teams");
      setTeams(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTeams(); }, []);

  const assignTeam = async (teamId: number) => {
    if (!emergencyId) return;
    try {
      await api(`/rescue-teams/${teamId}/assign`, { method: "POST", body: { emergency_id: parseInt(emergencyId) } });
      setShowAssign(null);
      setEmergencyId("");
      await fetchTeams();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Assignment failed");
    }
  };

  const updateStatus = async (teamId: number, status: string) => {
    try {
      await api(`/rescue-teams/${teamId}/status`, { method: "PATCH", body: { status } });
      await fetchTeams();
    } catch (err) { console.error(err); }
  };

  const createTeam = async () => {
    try {
      await api("/rescue-teams", { method: "POST", body: newTeam });
      setShowCreate(false);
      setNewTeam({ team_name: "", team_type: "Rescue", leader_name: "", member_count: 5 });
      await fetchTeams();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Creation failed");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rescue Teams</h1>
          <p className="text-slate-500">Manage rescue team assignments and availability.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all shadow-sm">
            <Plus className="h-4 w-4" /> Add Team
          </button>
          <button onClick={fetchTeams} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <div key={team.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-400" />
                <h3 className="font-bold text-black">{team.team_name}</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[team.status]}`}>
                {team.status}
              </span>
            </div>
            <div className="space-y-2 text-sm text-slate-600 mb-4">
              <div className="flex justify-between">
                <span>Type</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${typeColors[team.team_type]}`}>{team.team_type}</span>
              </div>
              <div className="flex justify-between"><span>Leader</span><span className="font-medium text-black">{team.leader_name || "N/A"}</span></div>
              <div className="flex justify-between"><span>Members</span><span className="font-medium">{team.member_count}</span></div>
              <div className="flex justify-between"><span>Missions</span><span className="font-medium">{team.completed_assignments}/{team.total_assignments}</span></div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-100">
              {team.status === "Available" && (
                <button onClick={() => setShowAssign(team.id)} className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                  Assign
                </button>
              )}
              {(team.status === "Assigned" || team.status === "Busy") && (
                <button onClick={() => updateStatus(team.id, "Available")} className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors">
                  Mark Available
                </button>
              )}
              {team.status === "Off Duty" && (
                <button onClick={() => updateStatus(team.id, "Available")} className="flex-1 px-3 py-1.5 bg-slate-600 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors">
                  Activate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Assign Modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowAssign(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Assign to Emergency</h2>
              <button onClick={() => setShowAssign(null)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-black">Emergency ID</label>
                <input type="number" value={emergencyId} onChange={e => setEmergencyId(e.target.value)}
                  className="w-full mt-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  placeholder="Enter emergency ID" />
              </div>
              <button onClick={() => assignTeam(showAssign)} disabled={!emergencyId}
                className="w-full py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-all">
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Create Rescue Team</h2>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold">Team Name</label>
                <input value={newTeam.team_name} onChange={e => setNewTeam({ ...newTeam, team_name: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold">Type</label>
                  <select value={newTeam.team_type} onChange={e => setNewTeam({ ...newTeam, team_type: e.target.value })}
                    className="w-full mt-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50">
                    <option>Medical</option><option>Fire</option><option>Rescue</option><option>Search</option><option>Hazmat</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold">Members</label>
                  <input type="number" value={newTeam.member_count} onChange={e => setNewTeam({ ...newTeam, member_count: parseInt(e.target.value) })}
                    className="w-full mt-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold">Leader Name</label>
                <input value={newTeam.leader_name} onChange={e => setNewTeam({ ...newTeam, leader_name: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              </div>
              <button onClick={createTeam}
                className="w-full py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
