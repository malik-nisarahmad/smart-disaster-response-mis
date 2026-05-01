"use client";

import { useEffect, useState } from "react";
import { PackageOpen, AlertTriangle, RefreshCw, Plus, X, Send } from "lucide-react";
import { api } from "@/lib/api";

interface Resource {
  id: number; name: string; category: string; quantity: number; unit: string;
  threshold_min: number; warehouse_name: string; stock_status: string;
}

const categoryColors: Record<string, string> = {
  Food: "bg-amber-100 text-amber-800", Water: "bg-blue-100 text-blue-800",
  Medicine: "bg-red-100 text-red-800", Shelter: "bg-green-100 text-green-800",
  Equipment: "bg-purple-100 text-purple-800", Clothing: "bg-pink-100 text-pink-800",
  Other: "bg-slate-100 text-slate-800",
};

export default function WarehousePage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [alerts, setAlerts] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllocate, setShowAllocate] = useState<Resource | null>(null);
  const [allocForm, setAllocForm] = useState({ emergency_id: "", quantity_allocated: "", notes: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", category: "Food", warehouse_id: "1", quantity: "", unit: "units", threshold_min: "50" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resData, alertData] = await Promise.all([api("/resources"), api("/resources/alerts")]);
      setResources(resData.data);
      setAlerts(alertData.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const allocateResource = async () => {
    if (!showAllocate) return;
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
    }
  };

  const addResource = async () => {
    try {
      await api("/resources", {
        method: "POST",
        body: { ...addForm, warehouse_id: parseInt(addForm.warehouse_id), quantity: parseInt(addForm.quantity), threshold_min: parseInt(addForm.threshold_min) },
      });
      setShowAdd(false);
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resource Inventory</h1>
          <p className="text-slate-500">Manage warehouse resources and allocations.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 shadow-sm">
            <Plus className="h-4 w-4" /> Add Resource
          </button>
          <button onClick={fetchData} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 shadow-sm">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {alerts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h3 className="font-bold text-orange-800">Low Stock Alerts ({alerts.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.map(a => (
              <span key={a.id} className="bg-white px-3 py-1 rounded-full text-xs font-semibold border border-orange-200 text-orange-700">
                {a.name}: {a.quantity} {a.unit} ({a.warehouse_name})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Resource Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Resource</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Warehouse</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Qty</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Threshold</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map(r => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${categoryColors[r.category]}`}>{r.category}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.warehouse_name}</td>
                  <td className="px-4 py-3 font-mono font-bold">{r.quantity.toLocaleString()} <span className="text-slate-400 font-normal">{r.unit}</span></td>
                  <td className="px-4 py-3 text-slate-500">{r.threshold_min}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.stock_status === "LOW STOCK" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {r.stock_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setShowAllocate(r)} className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors">
                      <Send className="h-3 w-3" /> Allocate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocate Modal */}
      {showAllocate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowAllocate(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Allocate: {showAllocate.name}</h2>
              <button onClick={() => setShowAllocate(null)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Available: {showAllocate.quantity} {showAllocate.unit}</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold">Quantity</label>
                <input type="number" value={allocForm.quantity_allocated} onChange={e => setAllocForm({ ...allocForm, quantity_allocated: e.target.value })}
                  max={showAllocate.quantity} className="w-full mt-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              </div>
              <div>
                <label className="text-sm font-bold">Emergency ID (optional)</label>
                <input type="number" value={allocForm.emergency_id} onChange={e => setAllocForm({ ...allocForm, emergency_id: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              </div>
              <div>
                <label className="text-sm font-bold">Notes</label>
                <textarea value={allocForm.notes} onChange={e => setAllocForm({ ...allocForm, notes: e.target.value })} rows={2}
                  className="w-full mt-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none" />
              </div>
              <button onClick={allocateResource} disabled={!allocForm.quantity_allocated}
                className="w-full py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-all">
                Submit Allocation Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Add Resource</h2>
              <button onClick={() => setShowAdd(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Resource Name" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              <div className="grid grid-cols-2 gap-3">
                <select value={addForm.category} onChange={e => setAddForm({ ...addForm, category: e.target.value })}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50">
                  <option>Food</option><option>Water</option><option>Medicine</option><option>Shelter</option><option>Equipment</option><option>Clothing</option><option>Other</option>
                </select>
                <select value={addForm.warehouse_id} onChange={e => setAddForm({ ...addForm, warehouse_id: e.target.value })}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50">
                  <option value="1">Islamabad</option><option value="2">Lahore</option><option value="3">Karachi</option><option value="4">Peshawar</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input type="number" placeholder="Quantity" value={addForm.quantity} onChange={e => setAddForm({ ...addForm, quantity: e.target.value })}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
                <input placeholder="Unit" value={addForm.unit} onChange={e => setAddForm({ ...addForm, unit: e.target.value })}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
                <input type="number" placeholder="Min" value={addForm.threshold_min} onChange={e => setAddForm({ ...addForm, threshold_min: e.target.value })}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              </div>
              <button onClick={addResource}
                className="w-full py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">
                Add Resource
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
