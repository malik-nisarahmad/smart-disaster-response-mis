"use client";

import Link from "next/link";
import { ShieldAlert, ChevronDown } from "lucide-react";

interface NavDropdownProps {
  label: string;
  links: { label: string; href: string }[];
  alignRight?: boolean;
}

function NavDropdown({ label, links, alignRight }: NavDropdownProps) {
  return (
    <div className="relative group h-full flex items-center cursor-pointer transition-colors">
      <span className="flex items-center gap-1 text-black group-hover:text-[#00d2b2] transition-colors">
        {label}{" "}
        <ChevronDown className="h-4 w-4 text-slate-500 group-hover:text-[#00d2b2] group-hover:-rotate-180 transition-all duration-200" />
      </span>
      <div
        className={`absolute top-full ${alignRight ? "right-0" : "left-1/2 -translate-x-1/2"} opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out pt-2 z-50`}
      >
        <div className="bg-white text-slate-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 p-3 flex flex-col gap-1 w-56">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[15px] font-medium px-4 py-2.5 rounded-lg hover:bg-slate-50 hover:text-[#00d2b2] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const navMenus: { label: string; links: { label: string; href: string }[]; alignRight?: boolean }[] = [
  {
    label: "Operations",
    links: [
      { label: "System Overview", href: "/dashboard" },
      { label: "Command Center", href: "/dashboard/operator" },
      { label: "Audit Logs", href: "/dashboard/audit" },
      { label: "Report Incident", href: "/report" },
      { label: "Field Agents", href: "/dashboard/field" },
    ],
  },
  {
    label: "Sectors",
    links: [
      { label: "Hospital Network", href: "/dashboard/hospitals" },
      { label: "Bed Capacity", href: "/dashboard/hospitals" },
      { label: "Urban Zones", href: "/dashboard" },
      { label: "Rural Areas", href: "/dashboard" },
    ],
  },
  {
    label: "Resources",
    alignRight: true,
    links: [
      { label: "Warehouses & Stock", href: "/dashboard/warehouse" },
      { label: "Allocations", href: "/dashboard/warehouse" },
      { label: "Pending Requests", href: "/dashboard/approvals" },
      { label: "Dispatch Logs", href: "/dashboard/field" },
    ],
  },
];

export default function Navbar() {
  return (
    <header className="fixed top-4 left-0 right-0 z-50 w-full px-4 flex justify-center pointer-events-none">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-sm border border-slate-200 flex h-16 items-center justify-between px-4 sm:px-6 pointer-events-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center bg-teal-400 text-white p-1 rounded-full shadow-sm">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-black">Respond MIS</span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 text-[15px] font-medium text-black h-full">
          {navMenus.map((menu) => (
            <NavDropdown key={menu.label} label={menu.label} links={menu.links} alignRight={menu.alignRight} />
          ))}
          <Link href="/dashboard/finance" className="flex items-center h-full cursor-pointer text-black hover:text-[#00d2b2] transition-colors">
            Finances
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/signup"
            className="hidden sm:inline-flex h-9 items-center justify-center rounded-md bg-[#051522] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0a243a]"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-md border-2 border-slate-200 bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-slate-50 hover:border-slate-300"
          >
            Log In
          </Link>
        </div>
      </div>
    </header>
  );
}
