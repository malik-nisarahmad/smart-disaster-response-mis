"use client";

import { useEffect, useState, useCallback } from "react";
import { Banknote, Plus, RefreshCw, X, TrendingUp, TrendingDown, Wallet, DollarSign, ShoppingCart, Scale, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api";

interface Transaction {
  id: number; transaction_type: string; category: string; amount: number;
  donor_name: string; description: string; status: string;
  transaction_date: string; recorded_by_name: string;
}
interface Totals { total_donations: number; total_expenses: number; total_procurement: number; total_distribution: number; }
interface Budget {
  id: number; emergency_id: number; total_budget: number; spent: number;
  remaining: number; utilization_pct: number; emergency_location: string;
  disaster_type: string; severity: string; emergency_status: string; created_at: string;
}

const typeCfg: Record<string, { badge: string; icon: React.ElementType }> = {
  Donation:     { badge: "bg-blue-50 text-blue-700 border-blue-200",    icon: ArrowDownRight },
  Expense:      { badge: "bg-red-50 text-red-700 border-red-200",       icon: ArrowUpRight },
  Procurement:  { badge: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: ShoppingCart },
  Distribution: { badge: "bg-violet-50 text-violet-700 border-violet-200", icon: Wallet },
};
const statusCfg: Record<string, string> = {
  Completed: "bg-blue-50 text-blue-700 border-blue-200",
  Approved:  "bg-indigo-50 text-indigo-700 border-indigo-200",
  Pending:   "bg-amber-50 text-amber-700 border-amber-200",
  Rejected:  "bg-red-50 text-red-700 border-red-200",
};
const severityBadge: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200",
  High:     "bg-orange-50 text-orange-700 border-orange-200",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200",
  Low:      "bg-blue-50 text-blue-700 border-blue-200",
};

type Tab = "transactions" | "budgets";

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<Tab>("transactions");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totals, setTotals]             = useState<Totals | null>(null);
  const [budgets, setBudgets]           = useState<Budget[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [typeFilter, setTypeFilter]     = useState("all");
  const [showAddTx, setShowAddTx]       = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [txForm, setTxForm] = useState({ transaction_type: "Donation", category: "", amount: "", donor_name: "", emergency_id: "", description: "" });
  const [budgetForm, setBudgetForm] = useState({ emergency_id: "", total_budget: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const [txData, sumData] = await Promise.all([api("/finance/transactions"), api("/finance/summary")]);
      setTransactions(txData.data); setTotals(sumData.totals);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const [bData, bSum] = await Promise.all([api("/budgets"), api("/budgets/summary")]);
      setBudgets(bData.data); setBudgetSummary(bSum.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
  useEffect(() => { if (activeTab === "budgets") fetchBudgets(); }, [activeTab, fetchBudgets]);

  const addTransaction = async () => {
    setSubmitting(true);
    try {
      await api("/finance/transactions", { method: "POST", body: { ...txForm, amount: parseFloat(txForm.amount), emergency_id: txForm.emergency_id ? parseInt(txForm.emergency_id) : null } });
      setShowAddTx(false);
      setTxForm({ transaction_type: "Donation", category: "", amount: "", donor_name: "", emergency_id: "", description: "" });
      await fetchTransactions();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  const addBudget = async () => {
    setSubmitting(true);
    try {
      await api("/budgets", { method: "POST", body: { emergency_id: parseInt(budgetForm.emergency_id), total_budget: parseFloat(budgetForm.total_budget) } });
      setShowAddBudget(false); setBudgetForm({ emergency_id: "", total_budget: "" });
      await fetchBudgets();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  const filteredTx = transactions.filter(tx => typeFilter === "all" || tx.transaction_type === typeFilter);
  const utilBar    = (pct: number) => pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-orange-400" : pct >= 50 ? "bg-amber-400" : "bg-[#4318FF]";
  const inputCls   = "w-full px-4 py-2.5 bg-[#f4f7fe] border-0 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4318FF]/30 transition-all";

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "transactions", label: "Transactions",     icon: Banknote },
    { id: "budgets",      label: "Disaster Budgets", icon: Wallet },
  ];

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#051522] tracking-tight">Financial Management</h1>
          <p className="text-slate-500 font-medium mt-1">Track donations, expenses, procurement, and disaster budgets.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "transactions" && (
            <button onClick={() => setShowAddTx(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#051522] text-white text-sm font-bold hover:bg-[#0a243a] shadow-md transition-all">
              <Plus className="h-4 w-4" /> Record Transaction
            </button>
          )}
          {activeTab === "budgets" && (
            <button onClick={() => setShowAddBudget(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4318FF] text-white text-sm font-bold hover:bg-indigo-700 shadow-md transition-all">
              <Plus className="h-4 w-4" /> Allocate Budget
            </button>
          )}
          <button onClick={() => activeTab === "transactions" ? fetchTransactions() : fetchBudgets()}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-[#f4f7fe] shadow-sm">
            <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Banners — Transactions */}
      {activeTab === "transactions" && totals && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Total Donations",  val: totals.total_donations,  icon: ArrowDownRight, bg: "from-blue-600 to-blue-800", shadow: "shadow-blue-500/30" },
            { label: "Total Expenses",   val: totals.total_expenses,   icon: ArrowUpRight, bg: "from-rose-500 to-rose-700", shadow: "shadow-rose-500/30" },
            { label: "Procurement",      val: totals.total_procurement, icon: ShoppingCart, bg: "from-purple-600 to-indigo-700", shadow: "shadow-purple-500/30" },
            { label: "Net Balance",      val: totals.total_donations - totals.total_expenses - totals.total_procurement, icon: Scale, bg: "from-slate-700 to-slate-900", shadow: "shadow-slate-500/30" },
          ].map((c, i) => (
            <div key={c.label} className={`relative overflow-hidden bg-gradient-to-br ${c.bg} rounded-[24px] p-6 text-white shadow-xl ${c.shadow} transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 group`}>
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 rounded-full bg-white/10 blur-xl group-hover:bg-white/20 transition-all duration-500"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 rounded-full bg-black/10 blur-lg"></div>
              
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold opacity-90 uppercase tracking-widest mb-1">{c.label}</div>
                  <div className="text-3xl font-black mt-2 tracking-tight">${Number(c.val).toLocaleString()}</div>
                </div>
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                  <c.icon className="h-7 w-7 text-white" />
                </div>
              </div>
              
              <div className="absolute bottom-0 left-0 h-1 w-full bg-black/10">
                <div className="h-full bg-white/40" style={{ width: '40%', animation: `shimmer ${2 + i * 0.5}s infinite linear` }}></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Banners — Budgets */}
      {activeTab === "budgets" && budgetSummary && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Budgets",       val: budgetSummary.total_budgets,            fmt: false, suffix: "",  bg: "from-[#051522] to-[#0a243a]" },
            { label: "Total Allocated",     val: budgetSummary.total_allocated,           fmt: true,  suffix: "",  bg: "from-blue-600 to-indigo-700" },
            { label: "Total Spent",         val: budgetSummary.total_spent,               fmt: true,  suffix: "",  bg: "from-red-500 to-rose-600" },
            { label: "Avg Utilization",     val: budgetSummary.overall_utilization_pct,   fmt: false, suffix: "%", bg: (budgetSummary.overall_utilization_pct ?? 0) >= 80 ? "from-red-500 to-rose-600" : "from-violet-600 to-purple-700" },
          ].map(c => (
            <div key={c.label} className={`bg-gradient-to-br ${c.bg} rounded-[28px] p-5 text-white shadow-lg`}>
              <div className="text-2xl font-extrabold">{c.fmt ? `$${Number(c.val ?? 0).toLocaleString()}` : `${c.val ?? 0}${c.suffix}`}</div>
              <div className="text-xs font-semibold opacity-75 mt-1">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-1 bg-[#f4f7fe] p-1 rounded-2xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === t.id
                ? "bg-white text-[#051522] shadow-sm"
                : "text-slate-500 hover:text-[#051522]"
            }`}>
            <t.icon className="h-4 w-4 mr-2" /> {t.label}
          </button>
        ))}
      </div>

      {/* ── TRANSACTIONS TAB ── */}
      {activeTab === "transactions" && (
        <>
          {/* Type filter pills */}
          <div className="flex gap-2 flex-wrap">
            {["all", "Donation", "Expense", "Procurement", "Distribution"].map(f => {
              const Icon = typeCfg[f]?.icon;
              return (
              <button key={f} onClick={() => setTypeFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center ${
                  typeFilter === f ? "bg-[#051522] text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:bg-[#f4f7fe]"
                }`}>
                {f !== "all" && Icon && <Icon className="w-4 h-4 mr-2" />} {f === "all" ? "All Types" : f}
              </button>
            )})}
          </div>

          <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#f4f7fe]">
                    {["#", "Type", "Category", "Amount", "Donor / Source", "Status", "Date", "Recorded By"].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-extrabold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.map(tx => {
                    const TypeIcon = typeCfg[tx.transaction_type]?.icon;
                    return (
                    <tr key={tx.id} className="border-b border-slate-50 hover:bg-[#f4f7fe] transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-slate-400">#{tx.id}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-1 flex w-fit items-center rounded-full text-xs font-bold border ${typeCfg[tx.transaction_type]?.badge || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                          {TypeIcon && <TypeIcon className="w-3 h-3 mr-1" />} {tx.transaction_type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs">{tx.category || "—"}</td>
                      <td className="px-5 py-3 font-extrabold text-[#051522]">${Number(tx.amount).toLocaleString()}</td>
                      <td className="px-5 py-3 text-slate-600 text-xs">{tx.donor_name || "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${statusCfg[tx.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>{tx.status}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{tx.recorded_by_name}</td>
                    </tr>
                  )})}
                </tbody>
              </table>
              {filteredTx.length === 0 && !loading && (
                <div className="text-center py-16 text-slate-400 font-medium">No transactions found.</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── BUDGETS TAB ── */}
      {activeTab === "budgets" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.length === 0 && !loading && (
            <div className="col-span-3 text-center py-16 text-slate-400 bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] font-medium">
              No budgets allocated yet. Click "Allocate Budget" to create one.
            </div>
          )}
          {budgets.map(b => (
            <div key={b.id} className="bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex flex-col gap-4 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-extrabold text-[#051522]">Emergency #{b.emergency_id}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${severityBadge[b.severity] || "bg-slate-100 text-slate-600 border-slate-200"}`}>{b.severity}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#f4f7fe] text-slate-600">{b.disaster_type}</span>
                  </div>
                  <p className="text-xs text-slate-400">{b.emergency_location || "Location not specified"}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Allocated</div>
                  <div className="text-lg font-extrabold text-[#051522]">${Number(b.total_budget).toLocaleString()}</div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-500">Budget Utilization</span>
                  <span className={b.utilization_pct >= 90 ? "text-red-600" : "text-[#051522]"}>{b.utilization_pct ?? 0}%</span>
                </div>
                <div className="w-full bg-[#f4f7fe] rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${utilBar(b.utilization_pct ?? 0)}`}
                    style={{ width: `${Math.min(b.utilization_pct ?? 0, 100)}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Allocated", val: `$${Number(b.total_budget).toLocaleString()}`, cls: "text-[#051522]" },
                  { label: "Spent",     val: `$${Number(b.spent).toLocaleString()}`,        cls: "text-red-600" },
                  { label: "Remaining", val: `$${Number(b.remaining).toLocaleString()}`,    cls: "text-[#4318FF]" },
                ].map(s => (
                  <div key={s.label} className="bg-[#f4f7fe] rounded-2xl py-2 px-1">
                    <div className={`text-sm font-extrabold ${s.cls}`}>{s.val}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddTx && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowAddTx(false)}>
          <div className="bg-white rounded-[28px] shadow-2xl max-w-md w-full p-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-extrabold text-[#051522]">Record Transaction</h2>
              <button onClick={() => setShowAddTx(false)} className="p-2 hover:bg-[#f4f7fe] rounded-xl"><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <select value={txForm.transaction_type} onChange={e => setTxForm({ ...txForm, transaction_type: e.target.value })} className={inputCls}>
                <option>Donation</option><option>Expense</option><option>Procurement</option><option>Distribution</option>
              </select>
              <input placeholder="Category" value={txForm.category} onChange={e => setTxForm({ ...txForm, category: e.target.value })} className={inputCls} />
              <input type="number" placeholder="Amount ($) *" value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })} className={inputCls} />
              {txForm.transaction_type === "Donation" && (
                <input placeholder="Donor Name" value={txForm.donor_name} onChange={e => setTxForm({ ...txForm, donor_name: e.target.value })} className={inputCls} />
              )}
              <input type="number" placeholder="Emergency ID (optional)" value={txForm.emergency_id} onChange={e => setTxForm({ ...txForm, emergency_id: e.target.value })} className={inputCls} />
              <textarea placeholder="Description" value={txForm.description} onChange={e => setTxForm({ ...txForm, description: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
              <button onClick={addTransaction} disabled={submitting || !txForm.amount}
                className="w-full py-3 bg-[#051522] text-white rounded-xl text-sm font-extrabold hover:bg-[#0a243a] disabled:opacity-50 transition-all shadow-lg">
                {submitting ? "Recording..." : "Record Transaction"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Allocate Budget Modal */}
      {showAddBudget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowAddBudget(false)}>
          <div className="bg-white rounded-[28px] shadow-2xl max-w-md w-full p-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-extrabold text-[#051522]">Allocate Disaster Budget</h2>
              <button onClick={() => setShowAddBudget(false)} className="p-2 hover:bg-[#f4f7fe] rounded-xl"><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="bg-[#f4f7fe] text-[#4318FF] text-xs font-semibold p-4 rounded-2xl">
                Budgets over $10,000 automatically generate an approval request. One budget per emergency.
              </div>
              <input type="number" placeholder="Emergency ID *" value={budgetForm.emergency_id} onChange={e => setBudgetForm({ ...budgetForm, emergency_id: e.target.value })} className={inputCls} />
              <input type="number" placeholder="Total Budget Amount ($) *" value={budgetForm.total_budget} onChange={e => setBudgetForm({ ...budgetForm, total_budget: e.target.value })} className={inputCls} />
              <button onClick={addBudget} disabled={submitting || !budgetForm.emergency_id || !budgetForm.total_budget}
                className="w-full py-3 bg-[#4318FF] text-white rounded-xl text-sm font-extrabold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg">
                {submitting ? "Allocating..." : "Allocate Budget"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
