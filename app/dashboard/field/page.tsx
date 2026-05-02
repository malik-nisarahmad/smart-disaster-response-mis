"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Users, Plus, RefreshCw, X, MapPin, Navigation,
  Crosshair, Zap, CheckCircle, Clock, AlertTriangle
} from "lucide-react";
import { api } from "@/lib/api";

const MapPicker = dynamic(() => import("@/components/ui/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 bg-[#f4f7fe] animate-pulse rounded-2xl flex items-center justify-center text-slate-400 text-sm font-medium">
      Loading Map...
    </div>
  ),
});

interface Team {
  id: number;
  team_name: string;
  team_type: string;
  leader_name: string;
  member_count: number;
  status: string;
  phone: string;
  current_latitude: number | null;
  current_longitude: number | null;
  total_assignments: number;
  completed_assignments: number;
}

const statusBadge: Record<string, string> = {
  Available:  "bg-blue-50 text-blue-700 border-blue-200",
  Assigned:   "bg-indigo-50 text-indigo-700 border-indigo-200",
  Busy:       "bg-violet-50 text-violet-700 border-violet-200",
  Completed:  "bg-slate-100 text-slate-600 border-slate-200",
  "Off Duty": "bg-slate-100 text-slate-500 border-slate-200",
};

const statusDot: Record<string, string> = {
  Available: "bg-blue-500", Assigned: "bg-indigo-500",
  Busy: "bg-violet-500", Completed: "bg-slate-400", "Off Duty": "bg-slate-300",
};

const typeBadge: Record<string, string> = {
  Medical: "bg-red-50 text-red-700 border-red-200",
  Fire:    "bg-orange-50 text-orange-700 border-orange-200",
  Rescue:  "bg-blue-50 text-blue-700 border-blue-200",
  Search:  "bg-indigo-50 text-indigo-700 border-indigo-200",
  Hazmat:  "bg-yellow-50 text-yellow-700 border-yellow-200",
};

const typeEmoji: Record<string, string> = {
  Medical: "🏥", Fire: "🔥", Rescue: "🚁", Search: "🔍", Hazmat: "☢️",
};

type ModalType = "assign" | "create" | "location" | null;

export default function FieldPage() {
  const [teams, setTeams]     = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState<ModalType>(null);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);

  const [emergencyId, setEmergencyId] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [assigning, setAssigning]     = useState(false);

  const [newTeam, setNewTeam] = useState({
    team_name: "", team_type: "Rescue", leader_name: "",
    member_count: 5, phone: "", current_latitude: "", current_longitude: "",
  });
  const [creating, setCreating] = useState(false);

  const [locationPos, setLocationPos] = useState<[number, number] | null>(null);
  const [locationName, setLocationName] = useState("");
  const [updatingLoc, setUpdatingLoc]   = useState(false);
  const [gpsLoading, setGpsLoading]     = useState(false);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/rescue-teams");
      setTeams(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const openModal = (type: ModalType, team?: Team) => {
    setModal(type);
    setActiveTeam(team || null);
    setEmergencyId(""); setAssignNotes(""); setLocationName("");
    if (type === "location" && team?.current_latitude && team?.current_longitude) {
      setLocationPos([team.current_latitude, team.current_longitude]);
    } else { setLocationPos(null); }
  };

  const detectGPS = () => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setLocationPos([pos.coords.latitude, pos.coords.longitude]); setGpsLoading(false); },
      err => { alert("GPS error: " + err.message); setGpsLoading(false); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    if (!locationPos) return;
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${locationPos[0]}&lon=${locationPos[1]}`)
      .then(r => r.json())
      .then(d => { if (d?.display_name) setLocationName(d.display_name.split(",").slice(0, 3).join(", ")); })
      .catch(() => {});
  }, [locationPos]);

  const assignTeam = async () => {
    if (!emergencyId || !activeTeam) return;
    setAssigning(true);
    try {
      const res = await api(`/rescue-teams/${activeTeam.id}/assign`, {
        method: "POST", body: { emergency_id: parseInt(emergencyId), notes: assignNotes || null },
      });
      alert(`✓ ${res.message}`);
      setModal(null);
      await fetchTeams();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setAssigning(false); }
  };

  const createTeam = async () => {
    if (!newTeam.team_name || !newTeam.leader_name) { alert("Team name and leader are required."); return; }
    setCreating(true);
    try {
      await api("/rescue-teams", {
        method: "POST",
        body: {
          ...newTeam,
          member_count: parseInt(String(newTeam.member_count)),
          current_latitude:  newTeam.current_latitude  ? parseFloat(newTeam.current_latitude)  : null,
          current_longitude: newTeam.current_longitude ? parseFloat(newTeam.current_longitude) : null,
        },
      });
      setModal(null);
      setNewTeam({ team_name: "", team_type: "Rescue", leader_name: "", member_count: 5, phone: "", current_latitude: "", current_longitude: "" });
      await fetchTeams();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setCreating(false); }
  };

  const updateLocation = async () => {
    if (!activeTeam || !locationPos) { alert("Select a location on the map."); return; }
    setUpdatingLoc(true);
    try {
      await api(`/rescue-teams/${activeTeam.id}/location`, {
        method: "PATCH",
        body: { current_latitude: locationPos[0], current_longitude: locationPos[1], location_name: locationName },
      });
      setModal(null);
      await fetchTeams();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setUpdatingLoc(false); }
  };

  const updateStatus = async (teamId: number, status: string) => {
    try {
      await api(`/rescue-teams/${teamId}/status`, { method: "PATCH", body: { status } });
      await fetchTeams();
    } catch (err) { console.error(err); }
  };

  const hasLocation  = (t: Team) => t.current_latitude != null && t.current_longitude != null;
  const available    = teams.filter(t => t.status === "Available").length;
  const onMission    = teams.filter(t => t.status === "Assigned" || t.status === "Busy").length;
  const noGPS        = teams.filter(t => !hasLocation(t)).length;

  const inputCls = "w-full px-4 py-2.5 bg-[#f4f7fe] border-0 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4318FF]/30 transition-all";

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#051522] tracking-tight">Rescue Teams</h1>
          <p className="text-slate-500 font-medium mt-1">Manage field teams, locations, and emergency assignments.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openModal("create")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#051522] text-white text-sm font-bold hover:bg-[#0a243a] shadow-md transition-all">
            <Plus className="h-4 w-4" /> Add Team
          </button>
          <button onClick={fetchTeams} className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-[#f4f7fe] shadow-sm transition-colors">
            <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Banners */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Teams",   val: teams.length, icon: "👥", bg: "from-[#051522] to-[#0a243a]" },
          { label: "Available",     val: available,    icon: "✅", bg: "from-blue-600 to-indigo-700" },
          { label: "On Mission",    val: onMission,    icon: "⚡", bg: "from-violet-600 to-purple-700" },
          { label: "No GPS",        val: noGPS,        icon: "📍", bg: noGPS > 0 ? "from-red-500 to-rose-600" : "from-slate-500 to-slate-600" },
        ].map(c => (
          <div key={c.label} className={`bg-gradient-to-br ${c.bg} rounded-[28px] p-5 text-white shadow-lg`}>
            <div className="text-3xl mb-2">{c.icon}</div>
            <div className="text-3xl font-extrabold">{c.val}</div>
            <div className="text-sm font-semibold opacity-80 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* GPS Warning */}
      {noGPS > 0 && (
        <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 border-l-4 border-amber-400 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-slate-700">
            <strong>{noGPS} team{noGPS > 1 ? "s" : ""}</strong> {noGPS > 1 ? "have" : "has"} no GPS location.
            Auto-assign proximity skips teams without coordinates.
          </p>
        </div>
      )}

      {/* Teams Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams.map(team => (
          <div key={team.id}
            className={`bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all flex flex-col gap-5 ${
              !hasLocation(team) ? "ring-2 ring-amber-200" : ""
            }`}>
            {/* Header row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#f4f7fe] flex items-center justify-center text-2xl flex-shrink-0">
                  {typeEmoji[team.team_type] || "🚨"}
                </div>
                <div>
                  <h3 className="font-extrabold text-[#051522] leading-tight">{team.team_name}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${typeBadge[team.team_type]}`}>
                    {team.team_type}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[team.status]}`} />
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusBadge[team.status]}`}>
                  {team.status}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-center">
              {[
                { label: "Leader", val: team.leader_name || "—" },
                { label: "Members", val: `${team.member_count} pax` },
                { label: "Missions", val: `${team.completed_assignments}/${team.total_assignments}` },
                { label: "Phone", val: team.phone || "—" },
              ].map(s => (
                <div key={s.label} className="bg-[#f4f7fe] rounded-2xl py-2 px-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
                  <div className="text-xs font-extrabold text-[#051522] mt-0.5 truncate">{s.val}</div>
                </div>
              ))}
            </div>

            {/* Location Block */}
            <div className={`rounded-2xl p-3 ${hasLocation(team) ? "bg-blue-50 border border-blue-100" : "bg-amber-50 border border-amber-200"}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
                  <MapPin className="h-3.5 w-3.5" />
                  Current Location
                </div>
                <button onClick={() => openModal("location", team)}
                  className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-[#f4f7fe] transition-colors">
                  <Navigation className="h-3 w-3" /> Update
                </button>
              </div>
              {hasLocation(team) ? (
                <div className="font-mono text-xs text-blue-700 font-semibold">
                  {Number(team.current_latitude).toFixed(4)}°N, {Number(team.current_longitude).toFixed(4)}°E
                  <div className="text-[10px] font-bold text-blue-500 mt-0.5">✓ GPS active · used for auto-assign</div>
                </div>
              ) : (
                <div className="text-xs font-bold text-amber-700">⚠ No GPS — will be skipped in auto-assign</div>
              )}
            </div>

            {/* Action button */}
            <div>
              {team.status === "Available" && (
                <button onClick={() => openModal("assign", team)}
                  className="w-full py-2.5 bg-[#051522] text-white rounded-xl text-sm font-extrabold hover:bg-[#0a243a] transition-all shadow-md">
                  Assign to Emergency
                </button>
              )}
              {(team.status === "Assigned" || team.status === "Busy") && (
                <button onClick={() => updateStatus(team.id, "Available")}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-extrabold hover:bg-blue-700 transition-all shadow-md">
                  Mark Available
                </button>
              )}
              {team.status === "Off Duty" && (
                <button onClick={() => updateStatus(team.id, "Available")}
                  className="w-full py-2.5 bg-slate-600 text-white rounded-xl text-sm font-extrabold hover:bg-slate-700 transition-all shadow-md">
                  Activate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── UPDATE LOCATION MODAL ── */}
      {modal === "location" && activeTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-[28px] shadow-2xl max-w-lg w-full p-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-[#051522]">Update Team Location</h2>
                <p className="text-sm text-slate-500 mt-1">{activeTeam.team_name} · position used for proximity auto-assign</p>
              </div>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-[#f4f7fe] rounded-xl transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <button onClick={detectGPS} disabled={gpsLoading}
              className="w-full mb-4 flex items-center justify-center gap-2 py-2.5 bg-[#4318FF] text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md">
              <Crosshair className="h-4 w-4" />
              {gpsLoading ? "Detecting GPS..." : "Use My Current GPS Location"}
            </button>
            <p className="text-xs text-slate-400 text-center mb-3">— or tap on the map to pin location —</p>
            <div className="rounded-2xl overflow-hidden h-52 border border-slate-200 mb-4">
              <MapPicker position={locationPos} setPosition={setLocationPos} />
            </div>
            {locationPos && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-sm mb-4">
                <div className="font-extrabold text-[#051522]">
                  📌 {locationPos[0].toFixed(5)}°N, {locationPos[1].toFixed(5)}°E
                </div>
                {locationName && <div className="text-slate-500 text-xs mt-0.5">{locationName}</div>}
              </div>
            )}
            <input placeholder="Location label (optional)" value={locationName} onChange={e => setLocationName(e.target.value)}
              className={`${inputCls} mb-4`} />
            <button onClick={updateLocation} disabled={updatingLoc || !locationPos}
              className="w-full py-3 bg-[#051522] text-white rounded-xl text-sm font-extrabold hover:bg-[#0a243a] disabled:opacity-50 transition-all shadow-lg">
              {updatingLoc ? "Saving..." : "Save Location"}
            </button>
          </div>
        </div>
      )}

      {/* ── ASSIGN MODAL ── */}
      {modal === "assign" && activeTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-[28px] shadow-2xl max-w-sm w-full p-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-[#051522]">Assign to Emergency</h2>
                <p className="text-sm text-slate-500 mt-1">{activeTeam.team_name} · {activeTeam.team_type}</p>
              </div>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-[#f4f7fe] rounded-xl">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div className={`text-xs font-bold px-3 py-2 rounded-xl mb-4 ${hasLocation(activeTeam) ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
              {hasLocation(activeTeam)
                ? `📍 GPS: ${Number(activeTeam.current_latitude).toFixed(4)}°N — used for proximity`
                : "⚠ No GPS set for this team"}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">Emergency ID *</label>
                <input type="number" value={emergencyId} onChange={e => setEmergencyId(e.target.value)}
                  placeholder="e.g. 3" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">Notes (optional)</label>
                <textarea value={assignNotes} onChange={e => setAssignNotes(e.target.value)} rows={2}
                  placeholder="Priority, context..." className={`${inputCls} resize-none`} />
              </div>
              <button onClick={assignTeam} disabled={assigning || !emergencyId}
                className="w-full py-3 bg-[#051522] text-white rounded-xl text-sm font-extrabold hover:bg-[#0a243a] disabled:opacity-50 transition-all shadow-lg">
                {assigning ? "Assigning..." : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      {modal === "create" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-[28px] shadow-2xl max-w-md w-full p-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold text-[#051522]">Create Rescue Team</h2>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-[#f4f7fe] rounded-xl">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              <input placeholder="Team Name *" value={newTeam.team_name} onChange={e => setNewTeam({ ...newTeam, team_name: e.target.value })} className={inputCls} />
              <div className="grid grid-cols-2 gap-3">
                <select value={newTeam.team_type} onChange={e => setNewTeam({ ...newTeam, team_type: e.target.value })} className={inputCls}>
                  <option>Medical</option><option>Fire</option><option>Rescue</option><option>Search</option><option>Hazmat</option>
                </select>
                <input type="number" placeholder="Members" value={newTeam.member_count}
                  onChange={e => setNewTeam({ ...newTeam, member_count: parseInt(e.target.value) })} className={inputCls} />
              </div>
              <input placeholder="Leader Name *" value={newTeam.leader_name} onChange={e => setNewTeam({ ...newTeam, leader_name: e.target.value })} className={inputCls} />
              <input placeholder="Phone" value={newTeam.phone} onChange={e => setNewTeam({ ...newTeam, phone: e.target.value })} className={inputCls} />
              <div className="bg-[#f4f7fe] rounded-2xl p-4 space-y-2">
                <p className="text-xs font-extrabold text-slate-600">📍 Starting GPS Location</p>
                <p className="text-xs text-slate-400">Used for proximity-based auto-assignment</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" step="0.0001" placeholder="Latitude" value={newTeam.current_latitude}
                    onChange={e => setNewTeam({ ...newTeam, current_latitude: e.target.value })}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20" />
                  <input type="number" step="0.0001" placeholder="Longitude" value={newTeam.current_longitude}
                    onChange={e => setNewTeam({ ...newTeam, current_longitude: e.target.value })}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20" />
                </div>
              </div>
              <button onClick={createTeam} disabled={creating || !newTeam.team_name || !newTeam.leader_name}
                className="w-full py-3 bg-[#051522] text-white rounded-xl text-sm font-extrabold hover:bg-[#0a243a] disabled:opacity-50 transition-all shadow-lg">
                {creating ? "Creating..." : "Create Team"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
