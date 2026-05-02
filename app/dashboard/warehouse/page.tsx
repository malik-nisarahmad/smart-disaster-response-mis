"use client";

import { useEffect, useState, useCallback } from "react";
import { PackageOpen, AlertTriangle, RefreshCw, Plus, X, Send, Box, Droplets, Pill, Home, Wrench, Shirt } from "lucide-react";
import { api } from "@/lib/api";

interface Resource {
  id: number; name: string; category: string; quantity: number; unit: string;
  threshold_min: number; warehouse_name: string; stock_status: string;
}

const catIcon: Record<string, any> = {
  Food: "🍚", Water: "💧", Medicine: "💊", Shelter: "⛺", Equipment: "🔧", Clothing: "👕", Other: "📦",
};
const catColor: Record<string, string> = {
  Food:      "bg-amber-50 text-amber-700 border-amber-200",
  Water:     "bg-blue-50 text-blue-700 border-blue-200",
  Medicine:  "bg-red-50 text-red-700 border-red-200",
  Shelter:   "bg-indigo-50 text-indigo-700 border-indigo-200",
  Equipment: "bg-violet-50 text-violet-700 border-violet-200",
  Clothing:  "bg-pink-50 text-pink-700 border-pink-200",
  Other:     "bg-slate-50 text-slate-600 border-slate-200",
};

export default function WarehousePage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [alerts, setAlerts]       = useState<Resource[]>([]);
  const [loading, setLoading]     = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAllocate, setShowAllocate] = useState<Resource | null>(null);
  const [allocForm, setAllocForm]       = useState({ emergency_id: "", quantity_allocated: "", notes: "" });
  const [showAdd, setShowAdd]   = useState(false);
  const [addForm, setAddForm]   = useState({ name: "", category: "Food", warehouse_id: "1", quantity: "", unit: "units", threshold_min: "50" });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resData, alertData] = await Promise.all([api("/resources"), api("/resources/alerts")]);
      setResources(resData.data);
      setAlerts(alertData.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const allocateResource = async () => {
    if (!showAllocate) return;
    setSubmitting(true);
    try {
      await api("/resources/allocate", {
        method: "POST",
        body: {
          resource_id: showAllocate.id,
          emergency_id: allocForm.emergency_id ? parseInt(allocForm.emergency_id) : null,
          quantity_allocated: parseInt(allocForm.quantity_allocated),
          notes: allocForm.notes,
        },
      });
      setShowAllocate(null);
      setAllocForm({ emergency_id: "", quantity_allocated: "", notes: "" });
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Allocation failed");
    } finally { setSubmitting(false); }
  };

  const addResource = async () => {
    setSubmitting(true);
    try {
      await api("/resources", {
        method: "POST",
        body: { ...addForm, warehouse_id: parseInt(addForm.warehouse_id), quantity: parseInt(addForm.quantity), threshold_min: parseInt(addForm.threshold_min) },
      });
      setShowAdd(false);
      setAddForm({ name: "", category: "Food", warehouse_id: "1", quantity: "", unit: "units", threshold_min: "50" });
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally { setSubmitting(false); }
  };

  const categories = ["all", ...Array.from(new Set(resources.map(r => r.category)))];
  const filtered   = resources.filter(r => categoryFilter === "all" || r.category === categoryFilter);
  const lowStock   = resources.filter(r => r.stock_status === "LOW STOCK").length;
  const totalQty   = resources.reduce((s, r) => s + r.quantity, 0);
  const totalItems = resources.length;

  const inputCls = "w-full px-4 py-2.5 bg-[#f4f7fe] border-0 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4318FF]/30 transition-all";

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#051522] tracking-tight">Resource Inventory</h1>
          <p className="text-slate-500 font-medium mt-1">Monitor warehouse stock levels and dispatch resources.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#051522] text-white text-sm font-bold hover:bg-[#0a243a] shadow-md transition-all">
            <Plus className="h-4 w-4" /> Add Resource
          </button>
          <button onClick={fetchData} className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-[#f4f7fe] shadow-sm transition-colors">
            <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Items",   val: totalItems, sub: "resource types", icon: "📦", bg: "from-blue-600 to-indigo-700" },
          { label: "Total Stock",   val: totalQty.toLocaleString(), sub: "combined units", icon: "📊", bg: "from-[#051522] to-[#0a243a]" },
          { label: "Low Stock Alerts", val: lowStock, sub: "need restocking", icon: "⚠️", bg: lowStock > 0 ? "from-red-500 to-rose-600" : "from-slate-500 to-slate-700" },
        ].map(c => (
          <div key={c.label} className={`bg-gradient-to-br ${c.bg} rounded-[28px] p-6 text-white shadow-lg`}>
            <div className="text-3xl mb-3">{c.icon}</div>
            <div className="text-3xl font-extrabold">{c.val}</div>
            <div className="text-sm font-semibold opacity-80 mt-1">{c.label}</div>
            <div className="text-xs opacity-60 mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Low Stock Banner */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 border-l-4 border-red-500">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h3 className="font-extrabold text-slate-900">Low Stock Alerts — {alerts.length} item{alerts.length > 1 ? "s" : ""} need restocking</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.map(a => (
              <span key={a.id} className="bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold">
                {a.name} · {a.quantity} {a.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
              categoryFilter === cat
                ? "bg-[#051522] text-white shadow-md"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-[#f4f7fe]"
            }`}>
            {cat === "all" ? "All Categories" : `${catIcon[cat] || "📦"} ${cat}`}
          </button>
        ))}
      </div>

      {/* Resource Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(r => {
          const pct = Math.max(0, Math.min(100, (r.quantity / Math.max(r.threshold_min * 3, 1)) * 100));
          const isLow = r.stock_status === "LOW STOCK";
          return (
            <div key={r.id} className={`bg-white rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all ${isLow ? "ring-2 ring-red-200" : ""}`}>
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#f4f7fe] flex items-center justify-center text-2xl">
                    {catIcon[r.category] || "📦"}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#051522] leading-tight">{r.name}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${catColor[r.category]}`}>{r.category}</span>
                  </div>
                </div>
                {isLow && (
                  <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full text-xs font-extrabold">LOW</span>
                )}
              </div>

              {/* Stock level bar */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-500">Stock Level</span>
                  <span className={`${isLow ? "text-red-600" : "text-slate-900"}`}>{r.quantity.toLocaleString()} {r.unit}</span>
                </div>
                <div className="w-full bg-[#f4f7fe] rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${isLow ? "bg-red-500" : "bg-[#4318FF]"}`}
                    style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className="text-xs text-slate-400 mt-1">Min threshold: {r.threshold_min} {r.unit}</div>
              </div>

              {/* Warehouse */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Warehouse</span>
                <span className="font-bold text-slate-700 bg-[#f4f7fe] px-2 py-1 rounded-lg">{r.warehouse_name}</span>
              </div>

              {/* Allocate button */}
              <button onClick={() => setShowAllocate(r)}
                className="w-full py-2.5 bg-[#051522] text-white rounded-xl text-sm font-bold hover:bg-[#0a243a] transition-all flex items-center justify-center gap-2 shadow-md">
                <Send className="h-4 w-4" /> Dispatch Resource
              </button>
            </div>
          );
        })}
      </div>

      {/* Allocate Modal */}
      {showAllocate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowAllocate(null)}>
          <div className="bg-white rounded-[28px] shadow-2xl max-w-md w-full p-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-[#051522]">Dispatch Resource</h2>
                <p className="text-sm text-slate-500 mt-1">{showAllocate.name} · {showAllocate.quantity} {showAllocate.unit} available</p>
              </div>
              <button onClick={() => setShowAllocate(null)} className="p-2 hover:bg-[#f4f7fe] rounded-xl transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">Quantity to Dispatch *</label>
                <input type="number" value={allocForm.quantity_allocated}
                  onChange={e => setAllocForm({ ...allocForm, quantity_allocated: e.target.value })}
                  max={showAllocate.quantity} placeholder={`Max ${showAllocate.quantity}`} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">Emergency ID (optional)</label>
                <input type="number" value={allocForm.emergency_id}
                  onChange={e => setAllocForm({ ...allocForm, emergency_id: e.target.value })}
                  placeholder="Link to an emergency" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">Notes</label>
                <textarea value={allocForm.notes} onChange={e => setAllocForm({ ...allocForm, notes: e.target.value })} rows={2}
                  placeholder="Reason or destination..." className={`${inputCls} resize-none`} />
              </div>
              <button onClick={allocateResource} disabled={submitting || !allocForm.quantity_allocated}
                className="w-full py-3 bg-[#051522] text-white rounded-xl text-sm font-extrabold hover:bg-[#0a243a] disabled:opacity-50 transition-all shadow-lg">
                {submitting ? "Submitting..." : "Submit Dispatch Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-[28px] shadow-2xl max-w-md w-full p-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold text-[#051522]">Add New Resource</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-[#f4f7fe] rounded-xl transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <input placeholder="Resource Name *" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} className={inputCls} />
              <div className="grid grid-cols-2 gap-3">
                <select value={addForm.category} onChange={e => setAddForm({ ...addForm, category: e.target.value })} className={inputCls}>
                  <option>Food</option><option>Water</option><option>Medicine</option>
                  <option>Shelter</option><option>Equipment</option><option>Clothing</option><option>Other</option>
                </select>
                <select value={addForm.warehouse_id} onChange={e => setAddForm({ ...addForm, warehouse_id: e.target.value })} className={inputCls}>
                  <option value="1">Islamabad</option><option value="2">Lahore</option>
                  <option value="3">Karachi</option><option value="4">Peshawar</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input type="number" placeholder="Qty *" value={addForm.quantity} onChange={e => setAddForm({ ...addForm, quantity: e.target.value })} className={inputCls} />
                <input placeholder="Unit" value={addForm.unit} onChange={e => setAddForm({ ...addForm, unit: e.target.value })} className={inputCls} />
                <input type="number" placeholder="Min" value={addForm.threshold_min} onChange={e => setAddForm({ ...addForm, threshold_min: e.target.value })} className={inputCls} />
              </div>
              <button onClick={addResource} disabled={submitting || !addForm.name || !addForm.quantity}
                className="w-full py-3 bg-[#051522] text-white rounded-xl text-sm font-extrabold hover:bg-[#0a243a] disabled:opacity-50 transition-all shadow-lg">
                {submitting ? "Adding..." : "Add Resource"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
