"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Transaction, SavingsGoal, DebtAccount, NetWorthSnapshot, TxType } from "./types";
import {
  buildSeedTransactions,
  buildSeedSavingsGoals,
  buildSeedDebts,
  buildSeedNetWorth,
} from "./seed-data";
import { uid } from "./format";

interface FinanceState {
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  debts: DebtAccount[];
  netWorth: NetWorthSnapshot[];
  currency: string;
  selectedYear: number;
  hydrated: boolean;
  setHydrated: () => void;
  setSelectedYear: (year: number) => void;
  setCurrency: (c: string) => void;
  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addGoal: (g: Omit<SavingsGoal, "id">) => void;
  updateGoal: (id: string, patch: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  contributeGoal: (id: string, amount: number) => void;
  addDebt: (d: Omit<DebtAccount, "id">) => void;
  updateDebt: (id: string, patch: Partial<DebtAccount>) => void;
  deleteDebt: (id: string) => void;
  addNetWorth: (s: Omit<NetWorthSnapshot, "id">) => void;
  updateNetWorth: (id: string, patch: Partial<NetWorthSnapshot>) => void;
  deleteNetWorth: (id: string) => void;
  resetAll: () => void;
}

function buildInitialState() {
  const txs = buildSeedTransactions();
  return {
    transactions: txs,
    savingsGoals: buildSeedSavingsGoals(),
    debts: buildSeedDebts(),
    netWorth: buildSeedNetWorth(txs),
    currency: "USD",
    selectedYear: 2025,
  };
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      ...buildInitialState(),
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      setSelectedYear: (year) => set({ selectedYear: year }),
      setCurrency: (c) => set({ currency: c }),
      addTransaction: (t) =>
        set((s) => ({ transactions: [{ ...t, id: uid("tx") }, ...s.transactions] })),
      updateTransaction: (id, patch) =>
        set((s) => ({
          transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      deleteTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),
      addGoal: (g) => set((s) => ({ savingsGoals: [...s.savingsGoals, { ...g, id: uid("g") }] })),
      updateGoal: (id, patch) =>
        set((s) => ({
          savingsGoals: s.savingsGoals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),
      deleteGoal: (id) =>
        set((s) => ({ savingsGoals: s.savingsGoals.filter((g) => g.id !== id) })),
      contributeGoal: (id, amount) =>
        set((s) => ({
          savingsGoals: s.savingsGoals.map((g) =>
            g.id === id ? { ...g, saved: Math.max(0, g.saved + amount) } : g
          ),
        })),
      addDebt: (d) => set((s) => ({ debts: [...s.debts, { ...d, id: uid("d") }] })),
      updateDebt: (id, patch) =>
        set((s) => ({
          debts: s.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),
      deleteDebt: (id) => set((s) => ({ debts: s.debts.filter((d) => d.id !== id) })),
      addNetWorth: (n) => set((s) => ({ netWorth: [...s.netWorth, { ...n, id: uid("nw") }] })),
      updateNetWorth: (id, patch) =>
        set((s) => ({
          netWorth: s.netWorth.map((n) => (n.id === id ? { ...n, ...patch } : n)),
        })),
      deleteNetWorth: (id) =>
        set((s) => ({ netWorth: s.netWorth.filter((n) => n.id !== id) })),
      resetAll: () => set({ ...buildInitialState() }),
    }),
    {
      name: "ultimate-finance-dashboard-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        transactions: s.transactions,
        savingsGoals: s.savingsGoals,
        debts: s.debts,
        netWorth: s.netWorth,
        currency: s.currency,
        selectedYear: s.selectedYear,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

// Derived helpers

export interface Totals {
  income: number;
  expense: number;
  bill: number;
  debt: number;
  savings: number;
  investment: number;
  net: number;
}

export function computeTotals(transactions: Transaction[], year?: number): Totals {
  const out: Totals = { income: 0, expense: 0, bill: 0, debt: 0, savings: 0, investment: 0, net: 0 };
  for (const t of transactions) {
    if (year && Number(t.date.slice(0, 4)) !== year) continue;
    out[t.type] += t.amount;
  }
  out.net = out.income - (out.expense + out.bill + out.debt + out.savings + out.investment);
  return out;
}

export function monthlyTotals(transactions: Transaction[], year: number) {
  const out = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    income: 0,
    expense: 0,
    bill: 0,
    debt: 0,
    savings: 0,
    investment: 0,
  }));
  for (const t of transactions) {
    if (Number(t.date.slice(0, 4)) !== year) continue;
    const m = Number(t.date.slice(5, 7)) - 1;
    out[m][t.type] += t.amount;
  }
  return out;
}

export function categoryBreakdown(transactions: Transaction[], type: TxType, year?: number) {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== type) continue;
    if (year && Number(t.date.slice(0, 4)) !== year) continue;
    map.set(t.category, (map.get(t.category) || 0) + t.amount);
  }
  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}
