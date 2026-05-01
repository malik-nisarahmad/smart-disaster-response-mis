"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ShieldAlert, LayoutDashboard, BellRing, Users,
  PackageOpen, Banknote, Settings, LogOut, ClipboardCheck,
  ScrollText, Search, Building2, X, PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import { getUser, logout, api } from "@/lib/api";

interface UserData {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

const allNavItems = [
  { href: "/dashboard",            label: "Dashboard",   icon: LayoutDashboard, roles: ["Administrator", "Emergency Operator", "Field Officer", "Warehouse Manager", "Finance Officer"] },
  { href: "/dashboard/operator",   label: "Emergencies", icon: BellRing,        roles: ["Administrator", "Emergency Operator"] },
  { href: "/dashboard/field",      label: "Rescue Teams",icon: Users,           roles: ["Administrator", "Field Officer", "Emergency Operator"] },
  { href: "/dashboard/warehouse",  label: "Resources",   icon: PackageOpen,     roles: ["Administrator", "Warehouse Manager"] },
  { href: "/dashboard/hospitals",  label: "Hospitals",   icon: Building2,       roles: ["Administrator", "Emergency Operator"] },
  { href: "/dashboard/finance",    label: "Finances",    icon: Banknote,        roles: ["Administrator", "Finance Officer"] },
  { href: "/dashboard/approvals",  label: "Approvals",   icon: ClipboardCheck,  roles: ["Administrator"] },
  { href: "/dashboard/admin",      label: "Settings",    icon: Settings,        roles: ["Administrator"] },
  { href: "/dashboard/audit",      label: "Audit Logs",  icon: ScrollText,      roles: ["Administrator"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/login"); return; }
    setUser(u);
  }, [router]);

  const navItems = allNavItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const handleSwitchRole = async () => {
    if (!user) return;
    const roles = ["Administrator", "Emergency Operator", "Field Officer", "Warehouse Manager", "Finance Officer"];
    const currentIndex = roles.indexOf(user.role);
    const nextRole = roles[(currentIndex + 1) % roles.length];
    try {
      const response = await api("/auth/switch-role", { method: "POST", body: { role: nextRole } });
      if (response.token && response.user) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        setUser(response.user);
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to switch role:", error);
      alert("Failed to switch role. Please try logging in again.");
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f4f7fe]">
        <div className="animate-pulse text-slate-400 font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f4f7fe] overflow-hidden font-sans">

      {/* ── Sidebar ── */}
      <aside
        className={`
          flex-shrink-0 m-4 mr-0 rounded-3xl bg-white
          shadow-[0_8px_30px_rgb(0,0,0,0.06)]
          flex-col hidden lg:flex overflow-hidden relative z-20
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "w-[272px] opacity-100" : "w-0 opacity-0 m-0 pointer-events-none"}
        `}
      >
        {/* Logo row + close button */}
        <div className="h-20 flex items-center justify-between px-6 flex-shrink-0">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-[#051522] text-white p-2 rounded-xl shadow-lg">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-[#051522]">Respond.</span>
          </Link>
          {/* Close / collapse button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#051522] hover:bg-slate-100 transition-colors"
            title="Close sidebar"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <div className="flex-1 overflow-y-auto py-2 px-3 custom-scrollbar">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-bold
                    transition-all relative whitespace-nowrap
                    ${isActive
                      ? "text-blue-600 bg-blue-50"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}
                  `}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 bg-blue-600 rounded-r-full" />
                  )}
                  <item.icon className={`h-4.5 w-4.5 flex-shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Switch Role card */}
        <div className="p-4 mx-3 mb-3 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-center relative overflow-hidden">
          <div className="w-12 h-12 mx-auto bg-white rounded-xl shadow-sm flex items-center justify-center mb-2">
            <ShieldAlert className="h-6 w-6 text-blue-600" />
          </div>
          <h4 className="text-xs font-extrabold text-[#051522]">Switch Role</h4>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-3 leading-snug">Acting as<br /><span className="font-bold text-slate-700">{user.role}</span></p>
          <button
            onClick={handleSwitchRole}
            className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition-colors"
          >
            Switch Access
          </button>
        </div>

        {/* Logout */}
        <div className="px-3 pb-4 border-t border-slate-100 pt-3">
          <button
            onClick={logout}
            className="flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all w-full"
          >
            <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex flex-1 flex-col overflow-hidden relative z-10 min-w-0">

        {/* Header */}
        <header className="h-20 flex items-center justify-between flex-shrink-0 px-6">

          {/* Sidebar open toggle (visible when sidebar is closed) */}
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-[#051522] hover:bg-slate-50 transition-colors"
                title="Open sidebar"
              >
                <PanelLeftOpen className="h-5 w-5" />
              </button>
            )}
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-[#051522]" />
              <span className="text-xl font-extrabold">Respond.</span>
            </div>
          </div>

          {/* Search */}
          <div className="hidden md:flex items-center bg-white rounded-full px-4 py-2.5 shadow-sm w-[360px] border border-slate-200 focus-within:ring-2 focus-within:ring-[#051522]/10 focus-within:border-slate-300 transition-all">
            <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search reports, locations..."
              className="bg-transparent border-none outline-none ml-3 w-full text-sm font-medium placeholder-slate-400 text-slate-800"
            />
            <kbd className="hidden sm:block text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">⌘K</kbd>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 bg-white rounded-full shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">
              <BellRing className="h-5 w-5 text-slate-600" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#051522] flex items-center justify-center text-white text-xs font-bold shadow-md">
                {getInitials(user.full_name)}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-extrabold text-[#051522] leading-tight">{user.full_name}</span>
                <span className="text-xs font-semibold text-slate-500">{user.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
