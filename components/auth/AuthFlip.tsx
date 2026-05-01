"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowRight, ArrowLeft, Mail, Lock, User, Phone, Shield, Eye, EyeOff, Home } from "lucide-react";
import { api, setToken, setUser } from "@/lib/api";

const roles = [
  { id: 2, name: "Emergency Operator", desc: "Manage reports" },
  { id: 3, name: "Field Officer", desc: "Coordinate teams" },
  { id: 4, name: "Warehouse Manager", desc: "Manage resources" },
  { id: 5, name: "Finance Officer", desc: "Financial records" },
];

interface AuthFlipProps {
  initialView?: "login" | "register";
}

export default function AuthFlip({ initialView = "login" }: AuthFlipProps) {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(initialView === "login");
  
  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup State
  const [signupForm, setSignupForm] = useState({ full_name: "", email: "", password: "", phone: "", role_id: 2 });
  const [signupShowPassword, setSignupShowPassword] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSignupForm({ ...signupForm, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: { email: loginEmail, password: loginPassword },
      });
      setToken(data.token);
      setUser(data.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    setSignupLoading(true);
    try {
      const data = await api("/auth/signup", {
        method: "POST",
        body: { ...signupForm, role_id: parseInt(String(signupForm.role_id)) },
      });
      setToken(data.token);
      setUser(data.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      setSignupError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 perspective-[1500px] relative overflow-hidden">
      {/* Background Blurs / Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[5%] left-[5%] w-[35%] h-[35%] rounded-full bg-[#fecaca]/40 blur-[100px]" />
        <div className="absolute top-[0%] right-[0%] w-[40%] h-[40%] rounded-full bg-[#ccfbf1]/50 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-[#fde8e8]/30 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[35%] h-[35%] rounded-full bg-[#e0f2fe]/30 blur-[120px]" />
      </div>

      {/* Home Button */}
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-black font-semibold transition-colors z-50">
        <Home className="w-5 h-5" />
        Back to Home
      </Link>

      <div className="relative z-10 w-full max-w-[900px] h-[600px] bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl [transform-style:preserve-3d] overflow-hidden">
        
        {/* --- LEFT SIDE: LOGIN FORM (STATIC) --- */}
        <div
          className={`absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center px-8 sm:px-12 transition-all duration-700 ease-in-out ${
            isLogin ? "opacity-100 z-10 delay-300" : "opacity-0 -z-10"
          }`}
        >
          <div className="text-center mb-8">
            <h2 className="text-4xl font-extrabold text-black">Log In</h2>
            <p className="text-sm text-slate-500 mt-2">Sign in to your account</p>
          </div>
          {loginError && <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded-lg text-center">{loginError}</div>}
          <form className="space-y-5" onSubmit={handleLoginSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-bold text-black flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" /> Email Address
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg bg-slate-100 border-transparent focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-black flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" /> Password
              </label>
              <div className="relative">
                <input
                  type={loginShowPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-3 rounded-lg bg-slate-100 border-transparent focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all pr-12"
                />
                <button type="button" onClick={() => setLoginShowPassword(!loginShowPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black">
                  {loginShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button disabled={loginLoading} className="w-full py-3 mt-4 bg-[#051522] text-white rounded-lg font-bold shadow-lg hover:bg-[#0a243a] hover:scale-[1.02] transition-all disabled:opacity-50">
              {loginLoading ? "Signing in..." : "Log In"}
            </button>
          </form>
        </div>

        {/* --- RIGHT SIDE: REGISTER FORM (STATIC) --- */}
        <div
          className={`absolute top-0 right-0 w-1/2 h-full flex flex-col justify-center px-8 sm:px-12 transition-all duration-700 ease-in-out ${
            !isLogin ? "opacity-100 z-10 delay-300" : "opacity-0 -z-10"
          }`}
        >
          <div className="text-center mb-6">
            <h2 className="text-3xl font-extrabold text-black">Sign Up</h2>
            <p className="text-sm text-slate-500 mt-1">Join the response network</p>
          </div>
          {signupError && <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded-lg text-center">{signupError}</div>}
          <form className="space-y-3" onSubmit={handleSignupSubmit}>
            <div className="space-y-1">
              <label className="text-xs font-bold text-black flex items-center gap-2"><User className="w-3 h-3 text-slate-400" /> Full Name</label>
              <input type="text" name="full_name" required value={signupForm.full_name} onChange={handleSignupChange} placeholder="John Doe" className="w-full px-3 py-2 text-sm rounded-lg bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-black flex items-center gap-2"><Mail className="w-3 h-3 text-slate-400" /> Email</label>
              <input type="email" name="email" required value={signupForm.email} onChange={handleSignupChange} placeholder="you@example.com" className="w-full px-3 py-2 text-sm rounded-lg bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-black flex items-center gap-2"><Lock className="w-3 h-3 text-slate-400" /> Password</label>
                <div className="relative">
                  <input type={signupShowPassword ? "text" : "password"} name="password" required minLength={6} value={signupForm.password} onChange={handleSignupChange} placeholder="Min 6 chars" className="w-full px-3 py-2 text-sm rounded-lg bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all pr-8" />
                  <button type="button" onClick={() => setSignupShowPassword(!signupShowPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black">
                    {signupShowPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-black flex items-center gap-2"><Phone className="w-3 h-3 text-slate-400" /> Phone</label>
                <input type="tel" name="phone" value={signupForm.phone} onChange={handleSignupChange} placeholder="Optional" className="w-full px-3 py-2 text-sm rounded-lg bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-black flex items-center gap-2"><Shield className="w-3 h-3 text-slate-400" /> Role</label>
              <select name="role_id" value={signupForm.role_id} onChange={handleSignupChange} className="w-full px-3 py-2 text-sm rounded-lg bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all">
                {roles.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
              </select>
            </div>
            <button disabled={signupLoading} className="w-full py-2.5 mt-2 bg-[#051522] text-white rounded-lg font-bold shadow-lg hover:bg-[#0a243a] hover:scale-[1.02] transition-all disabled:opacity-50">
              {signupLoading ? "Creating..." : "Create Account"}
            </button>
          </form>
        </div>

        {/* --- THE FLIPPING OVERLAY (RIGHT TO LEFT) --- */}
        <div
          className={`absolute top-0 left-1/2 w-1/2 h-full bg-gradient-to-br from-teal-600 via-blue-700 to-indigo-800 text-white transition-transform duration-1000 ease-in-out origin-left z-20 overflow-hidden shadow-2xl [backface-visibility:hidden] flex items-center justify-center ${
            !isLogin ? "-rotate-y-180" : "rotate-y-0"
          }`}
        >
          {/* Front Face of Overlay (Visible when isLogin is true) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-12">
            <ShieldAlert className="w-16 h-16 mb-6 text-white/90" />
            <h2 className="text-4xl font-extrabold mb-4">Hello, friend!</h2>
            <p className="text-lg text-white/90 mb-8 font-medium">
              Enter your personal details and start your journey with us.
            </p>
            <button
              onClick={() => setIsLogin(false)}
              className="px-8 py-3 rounded-full border-2 border-white font-bold tracking-wide hover:bg-white hover:text-blue-600 transition-colors flex items-center gap-2"
            >
              Sign Up <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          className={`absolute top-0 left-1/2 w-1/2 h-full bg-gradient-to-tl from-teal-600 via-blue-700 to-indigo-800 text-white transition-transform duration-1000 ease-in-out origin-left z-20 overflow-hidden shadow-2xl [backface-visibility:hidden] flex items-center justify-center ${
            !isLogin ? "rotate-y-0 -translate-x-full" : "rotate-y-180 -translate-x-full"
          }`}
        >
          {/* Back Face of Overlay (Visible when isLogin is false) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-12">
            <ShieldAlert className="w-16 h-16 mb-6 text-white/90" />
            <h2 className="text-4xl font-extrabold mb-4">Welcome Back!</h2>
            <p className="text-lg text-white/90 mb-8 font-medium">
              To keep connected with us, please login with your personal info.
            </p>
            <button
              onClick={() => setIsLogin(true)}
              className="px-8 py-3 rounded-full border-2 border-white font-bold tracking-wide hover:bg-white hover:text-blue-600 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" /> Log In
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
