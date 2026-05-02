"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Settings, Users, Shield, RefreshCw, Search,
  UserCheck, UserX, ChevronDown, Plus, X, Eye, EyeOff
} from "lucide-react";
import { api } from "@/lib/api";

interface User {
  id: number; full_name: string; email: string; phone: string;
  role: string; role_id: number; is_active: boolean; created_at: string;
}
interface Role { id: number; name: string; description: string; }

const roleBadge: Record<string, string> = {
  Administrator:         "bg-red-50 text-red-700",
  "Emergency Operator":  "bg-orange-50 text-orange-700",
  "Field Officer":       "bg-blue-50 text-blue-700",
  "Warehouse Manager":   "bg-violet-50 text-violet-700",
  "Finance Officer":     "bg-indigo-50 text-indigo-700",
};

type Tab = "users" | "create";

export default function AdminPage() {
  const [activeTab, setActiveTab]     = useState<Tab>("users");
  const [users, setUsers]             = useState<User[]>([]);
  const [roles, setRoles]             = useState<Role[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [roleFilter, setRoleFilter]   = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId]   = useState<number | null>(null);
  const [createForm, setCreateForm]   = useState({ full_name: "", email: "", password: "", phone: "", role_id: "2" });
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating]       = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try { const data = await api("/analytics/users"); setUsers(data.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  const fetchRoles = useCallback(async () => {
    try { const data = await api("/auth/roles"); setRoles(data.roles); }
    catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchUsers(); fetchRoles(); }, [fetchUsers, fetchRoles]);

  const toggleStatus = async (user: User) => {
    setUpdatingId(user.id);
    try { await api(`/auth/users/${user.id}`, { method: "PATCH", body: { is_active: !user.is_active } }); await fetchUsers(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setUpdatingId(null); }
  };

  const changeRole = async (userId: number, newRoleId: string) => {
    setUpdatingId(userId);
    try { await api(`/auth/users/${userId}`, { method: "PATCH", body: { role_id: parseInt(newRoleId) } }); await fetchUsers(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setUpdatingId(null); }
  };

  const handleCreate = async () => {
    if (!createForm.full_name || !createForm.email || !createForm.password) { alert("Name, email and password are required."); return; }
    setCreating(true);
    try {
      await api("/auth/signup", { method: "POST", body: createForm });
      setCreateForm({ full_name: "", email: "", password: "", phone: "", role_id: "2" });
      await fetchUsers(); setActiveTab("users");
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setCreating(false); }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = search === "" || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? u.is_active : !u.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  const totalActive   = users.filter(u => u.is_active).length;
  const totalInactive = users.filter(u => !u.is_active).length;

  const inputCls = "w-full px-4 py-2.5 bg-[#f4f7fe] border-0 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4318FF]/30 transition-all";

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: "users",  label: "User Management", emoji: "👥" },
    { id: "create", label: "Create New User",  emoji: "➕" },
  ];

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#051522] tracking-tight">Admin Panel</h1>
          <p className="text-slate-500 font-medium mt-1">Manage system users, roles, and access control.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab("create")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#051522] text-white text-sm font-bold hover:bg-[#0a243a] shadow-md transition-all">
            <Plus className="h-4 w-4" /> Create User
          </button>
          <button onClick={fetchUsers} className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-[#f4f7fe] shadow-sm">
            <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Banners */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Users",  val: users.length,   bg: "from-[#051522] to-[#0a243a]" },
          { label: "Active",       val: totalActive,    bg: "from-blue-600 to-indigo-700" },
          { label: "Inactive",     val: totalInactive,  bg: totalInactive > 0 ? "from-red-500 to-rose-600" : "from-slate-500 to-slate-600" },
          { label: "Roles",        val: roles.length,   bg: "from-violet-600 to-purple-700" },
        ].map(c => (
          <div key={c.label} className={`bg-gradient-to-br ${c.bg} rounded-[28px] p-5 text-white shadow-lg`}>
            <div className="text-3xl font-extrabold">{c.val}</div>
            <div className="text-sm font-semibold opacity-75 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-[#f4f7fe] p-1 rounded-2xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === t.id ? "bg-white text-[#051522] shadow-sm" : "text-slate-500 hover:text-[#051522]"
            }`}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ── */}
      {activeTab === "users" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex-1 min-w-52 shadow-sm">
              <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none w-full placeholder-slate-400 text-slate-800" />
              {search && <button onClick={() => setSearch("")}><X className="h-3.5 w-3.5 text-slate-400" /></button>}
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none shadow-sm">
              <option value="all">All Roles</option>
              {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none shadow-sm">
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <span className="text-xs text-slate-400 font-medium">{filteredUsers.length} of {users.length} users</span>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#f4f7fe]">
                    {["#", "Name", "Email", "Phone", "Role", "Status", "Joined", "Actions"].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-extrabold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} className={`border-b border-slate-50 hover:bg-[#f4f7fe] transition-colors ${!u.is_active ? "opacity-50" : ""}`}>
                      <td className="px-5 py-3 font-mono text-xs text-slate-400">#{u.id}</td>
                      <td className="px-5 py-3 font-extrabold text-[#051522]">{u.full_name}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{u.email}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{u.phone || "—"}</td>
                      <td className="px-5 py-3">
                        <div className="relative inline-block">
                          <select value={u.role_id} onChange={e => changeRole(u.id, e.target.value)}
                            disabled={updatingId === u.id}
                            className={`pr-6 pl-2.5 py-1 rounded-xl text-xs font-bold border-0 outline-none cursor-pointer appearance-none ${roleBadge[u.role] || "bg-slate-100 text-slate-700"}`}>
                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                          <ChevronDown className="absolute right-1 top-1.5 h-3 w-3 pointer-events-none opacity-50" />
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.is_active ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <button onClick={() => toggleStatus(u)} disabled={updatingId === u.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${
                            u.is_active ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          }`}>
                          {u.is_active ? <><UserX className="h-3 w-3" /> Deactivate</> : <><UserCheck className="h-3 w-3" /> Activate</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && !loading && (
                <div className="text-center py-14 text-slate-400 font-medium">No users match your filters.</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── CREATE USER TAB ── */}
      {activeTab === "create" && (
        <div className="max-w-lg">
          <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#f4f7fe] flex items-center justify-center">
                <Settings className="h-5 w-5 text-[#4318FF]" />
              </div>
              <h2 className="text-xl font-extrabold text-[#051522]">Create New System User</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">Full Name *</label>
                <input placeholder="e.g. Ahmad Khan" value={createForm.full_name}
                  onChange={e => setCreateForm({ ...createForm, full_name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">Email Address *</label>
                <input type="email" placeholder="user@example.com" value={createForm.email}
                  onChange={e => setCreateForm({ ...createForm, email: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">Password *</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="Min. 8 characters"
                    value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                    className={`${inputCls} pr-10`} />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">Phone (optional)</label>
                <input placeholder="+92 300 0000000" value={createForm.phone}
                  onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">Assign Role *</label>
                <select value={createForm.role_id} onChange={e => setCreateForm({ ...createForm, role_id: e.target.value })} className={inputCls}>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-700 font-medium">
                ⚠️ User is created active with the selected role. Password is hashed with bcrypt (salt 12).
              </div>
              <div className="flex gap-3">
                <button onClick={handleCreate} disabled={creating || !createForm.full_name || !createForm.email || !createForm.password}
                  className="flex-1 py-3 bg-[#051522] text-white rounded-xl text-sm font-extrabold hover:bg-[#0a243a] disabled:opacity-50 transition-all shadow-lg">
                  {creating ? "Creating..." : "Create User"}
                </button>
                <button onClick={() => setActiveTab("users")}
                  className="px-5 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-[#f4f7fe] transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
