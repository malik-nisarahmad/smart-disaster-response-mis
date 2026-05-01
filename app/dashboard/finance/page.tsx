"use client";

import { useEffect, useState } from "react";
import { Banknote, Plus, RefreshCw, X, TrendingUp, TrendingDown } from "lucide-react";
import { api } from "@/lib/api";

interface Transaction {
  id: number; transaction_type: string; category: string; amount: number;
  donor_name: string; description: string; status: string; transaction_date: string; recorded_by_name: string;
}

interface Totals {
  total_donations: number; total_expenses: number; total_procurement: number; total_distribution: number;
}

const typeColors: Record<string, string> = {
  Donation: "bg-green-100 text-green-800",
  Expense: "bg-red-100 text-red-800",
  Procurement: "bg-blue-100 text-blue-800",
  Distribution: "bg-purple-100 text-purple-800",
};

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ transaction_type: "Donation", category: "", amount: "", donor_name: "", emergency_id: "", description: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txData, sumData] = await Promise.all([api("/finance/transactions"), api("/finance/summary")]);
      setTransactions(txData.data);
      setTotals(sumData.totals);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const addTransaction = async () => {
    try {
      await api("/finance/transactions", {
        method: "POST",
        body: { ...form, amount: parseFloat(form.amount), emergency_id: form.emergency_id ? parseInt(form.emergency_id) : null },
      });
      setShowAdd(false);
      setForm({ transaction_type: "Donation", category: "", amount: "", donor_name: "", emergency_id: "", description: "" });
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
          <p className="text-slate-500">Track donations, expenses, and budget allocations.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 shadow-sm">
            <Plus className="h-4 w-4" /> Record Transaction
          </button>
          <button onClick={fetchData} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 shadow-sm">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {totals && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-500">Total Donations</span>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-700">${totals.total_donations.toLocaleString()}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-500">Total Expenses</span>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-700">${totals.total_expenses.toLocaleString()}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-500">Procurement</span>
              <Banknote className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700">${totals.total_procurement.toLocaleString()}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-500">Net Balance</span>
              <Banknote className="h-4 w-4 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-teal-700">
              ${(totals.total_donations - totals.total_expenses - totals.total_procurement).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">ID</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Donor/Source</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">#{tx.id}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeColors[tx.transaction_type]}`}>{tx.transaction_type}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{tx.category || "—"}</td>
                  <td className="px-4 py-3 font-bold">${tx.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600">{tx.donor_name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      tx.status === "Completed" ? "bg-green-100 text-green-800" :
                      tx.status === "Approved" ? "bg-blue-100 text-blue-800" :
                      tx.status === "Pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                    }`}>{tx.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{tx.recorded_by_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Record Transaction</h2>
              <button onClick={() => setShowAdd(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <select value={form.transaction_type} onChange={e => setForm({ ...form, transaction_type: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50">
                <option>Donation</option><option>Expense</option><option>Procurement</option><option>Distribution</option>
              </select>
              <input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              {form.transaction_type === "Donation" && (
                <input placeholder="Donor Name" value={form.donor_name} onChange={e => setForm({ ...form, donor_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              )}
              <input type="number" placeholder="Emergency ID (optional)" value={form.emergency_id} onChange={e => setForm({ ...form, emergency_id: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none" />
              <button onClick={addTransaction} disabled={!form.amount}
                className="w-full py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-all">
                Record Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
