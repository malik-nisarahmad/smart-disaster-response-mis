"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ShieldAlert, LayoutDashboard, BellRing, Users, MapPin,
  PackageOpen, Banknote, Settings, LogOut, ClipboardCheck,
  ScrollText, ChevronLeft, ChevronRight, Building2
} from "lucide-react";
import { getUser, logout } from "@/lib/api";

interface UserData {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

const allNavItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["Administrator", "Emergency Operator", "Field Officer", "Warehouse Manager", "Finance Officer"] },
  { href: "/dashboard/operator", label: "Emergencies", icon: BellRing, roles: ["Administrator", "Emergency Operator"] },
  { href: "/dashboard/field", label: "Rescue Teams", icon: Users, roles: ["Administrator", "Field Officer", "Emergency Operator"] },
  { href: "/dashboard/warehouse", label: "Resources", icon: PackageOpen, roles: ["Administrator", "Warehouse Manager"] },
  { href: "/dashboard/hospitals", label: "Hospitals", icon: Building2, roles: ["Administrator", "Emergency Operator"] },
  { href: "/dashboard/finance", label: "Finances", icon: Banknote, roles: ["Administrator", "Finance Officer"] },
  { href: "/dashboard/approvals", label: "Approvals", icon: ClipboardCheck, roles: ["Administrator"] },
  { href: "/dashboard/admin", label: "Admin Panel", icon: Settings, roles: ["Administrator"] },
  { href: "/dashboard/audit", label: "Audit Logs", icon: ScrollText, roles: ["Administrator"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push("/login");
      return;
    }
    setUser(u);
  }, [router]);

  const navItems = allNavItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      Administrator: "bg-red-100 text-red-700",
      "Emergency Operator": "bg-orange-100 text-orange-700",
      "Field Officer": "bg-blue-100 text-blue-700",
      "Warehouse Manager": "bg-green-100 text-green-700",
      "Finance Officer": "bg-purple-100 text-purple-700",
    };
    return colors[role] || "bg-slate-100 text-slate-700";
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-400 font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${collapsed ? "w-16" : "w-64"} border-r border-slate-200 bg-white flex flex-col hidden md:flex transition-all duration-300`}>
        <div className="h-16 flex items-center px-4 border-b border-slate-200 justify-between">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center bg-teal-400 text-white p-1 rounded-full">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight">Respond MIS</span>
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-black transition-colors">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-200 p-3">
          {!collapsed && (
            <div className="mb-3 px-2">
              <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                {user.role}
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all w-full"
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white">
          {/* Mobile menu button - shows on small screens */}
          <div className="md:hidden flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-teal-500" />
            <span className="text-lg font-bold">MIS</span>
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-black">{user.full_name}</span>
              <span className="text-xs text-slate-500">{user.email}</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {getInitials(user.full_name)}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
