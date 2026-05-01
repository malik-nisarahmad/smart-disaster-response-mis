"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { api, setToken, setUser } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setToken(data.token);
      setUser(data.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 selection:bg-teal-500/30 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-pink-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-400/20 blur-[120px] pointer-events-none" />

      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative">
        <div className="max-w-md space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-teal-400 text-white p-2 rounded-full shadow-lg">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight">Respond MIS</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            Smart Disaster{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-500">
              Response System
            </span>
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Real-time emergency coordination, resource management, and secure role-based operations for disaster response teams.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-teal-600">24/7</div>
              <div className="text-sm text-slate-500">Real-time Monitoring</div>
            </div>
            <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">RBAC</div>
              <div className="text-sm text-slate-500">Secure Access Control</div>
            </div>
            <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-indigo-600">ACID</div>
              <div className="text-sm text-slate-500">Transaction Safety</div>
            </div>
            <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-pink-600">MIS</div>
              <div className="text-sm text-slate-500">Analytics & Reports</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-8 sm:p-10 animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
                <div className="flex items-center justify-center bg-teal-400 text-white p-1.5 rounded-full">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <span className="text-xl font-extrabold">Respond MIS</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-black">Welcome back</h1>
              <p className="mt-2 text-sm text-slate-500 font-medium">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-bold text-black flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" /> Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-bold text-black flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" /> Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all pr-12"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#051522] text-white text-sm font-bold rounded-xl shadow-lg hover:bg-[#0a243a] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? "Signing in..." : "Sign In"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="font-bold text-teal-600 hover:text-teal-700 transition-colors">
                  Sign up
                </Link>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center font-medium">
                Demo: admin@mis.gov / password123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
