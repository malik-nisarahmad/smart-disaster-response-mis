import Link from "next/link";
import React from "react";

interface ButtonProps {
  href: string;
  variant?: "primary" | "outline";
  children: React.ReactNode;
  className?: string;
}

export default function Button({ href, variant = "primary", children, className = "" }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-md font-semibold transition-all";
  const variants = {
    primary: "bg-[#051522] text-white shadow-lg hover:scale-105 hover:bg-[#0a243a]",
    outline: "border-2 border-slate-200 bg-white text-black shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:scale-105",
  };

  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}
