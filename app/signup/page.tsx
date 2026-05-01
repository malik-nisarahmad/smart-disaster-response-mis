"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, Shield } from "lucide-react";
import { api, setToken, setUser } from "@/lib/api";

const roles = [
  { id: 2, name: "Emergency Operator", desc: "Manage emergency reports" },
  { id: 3, name: "Field Officer", desc: "Coordinate rescue teams" },
  { id: 4, name: "Warehouse Manager", desc: "Manage resources & inventory" },
  { id: 5, name: "Finance Officer", desc: "Handle financial records" },
];

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "", role_id: 2 });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/auth/signup", {
        method: "POST",
        body: { ...form, role_id: parseInt(String(form.role_id)) },
      });
      setToken(data.token);
      setUser(data.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 selection:bg-teal-500/30 relative overflow-hidden p-4">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-pink-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-400/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-8 sm:p-10 animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex items-center justify-center bg-teal-400 text-white p-1.5 rounded-full">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <span className="text-xl font-extrabold">Respond MIS</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-black">Create Account</h1>
            <p className="mt-2 text-sm text-slate-500 font-medium">Join the disaster response network</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="full_name" className="text-sm font-bold text-black flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" /> Full Name
              </label>
              <input id="full_name" name="full_name" type="text" value={form.full_name} onChange={handleChange} required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                placeholder="Your full name" />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-bold text-black flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" /> Email Address
              </label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                placeholder="you@example.com" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-bold text-black flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" /> Password
                </label>
                <div className="relative">
                  <input id="password" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} required minLength={6}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all pr-12"
                    placeholder="Min 6 chars" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-bold text-black flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" /> Phone
                </label>
                <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                  placeholder="Optional" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="role_id" className="text-sm font-bold text-black flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-400" /> Role
              </label>
              <select id="role_id" name="role_id" value={form.role_id} onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all appearance-none">
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} — {r.desc}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#051522] text-white text-sm font-bold rounded-xl shadow-lg hover:bg-[#0a243a] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-6">
              {loading ? "Creating account..." : "Create Account"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-teal-600 hover:text-teal-700 transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
