"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/finance/header";
import { SummaryCards } from "@/components/finance/summary-cards";
import { CashflowChart } from "@/components/finance/cashflow-chart";
import { ExpensePieChart } from "@/components/finance/expense-pie-chart";
import { AnnualChart } from "@/components/finance/annual-chart";
import { MonthlyTable } from "@/components/finance/monthly-table";
import { TransactionsTable } from "@/components/finance/transactions-table";
import { TopRankings } from "@/components/finance/top-rankings";
import { SavingsGoals } from "@/components/finance/savings-goals";
import { DebtCalculator } from "@/components/finance/debt-calculator";
import { NetWorthTracker } from "@/components/finance/net-worth-tracker";
import {
  DebtBreakdown,
  SavingsBreakdown,
  InvestmentBreakdown,
} from "@/components/finance/breakdowns";
import { TransactionDialog } from "@/components/finance/transaction-dialog";
import { useFinanceStore, computeTotals } from "@/lib/store";
import { CalendarPlus, Heart } from "lucide-react";

export default function Home() {
  const hydrated = useFinanceStore((s) => s.hydrated);
  const txs = useFinanceStore((s) => s.transactions);
  const year = useFinanceStore((s) => s.selectedYear);

  const [addOpen, setAddOpen] = useState(false);

  // Compute previous-year totals for delta badges
  const prevTotals = computeTotals(txs, year - 1);

  const yearHasData = useMemo(
    () => txs.some((t) => Number(t.date.slice(0, 4)) === year),
    [txs, year]
  );

  useEffect(() => {
    document.title = `Ultimate Finance • ${year}`;
  }, [year]);

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 pb-10 sm:px-6">
      <Header onAddTransaction={() => setAddOpen(true)} />

      {/* Empty-year notice */}
      {!yearHasData && (
        <div className="mt-6 flex flex-col items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <CalendarPlus className="h-5 w-5 shrink-0 text-emerald-500" />
            <div>
              <div className="font-medium">No transactions recorded for {year} yet</div>
              <div className="text-xs text-muted-foreground">
                Add a transaction, import from .ics via the Calendar button, or pick a different year.
                Years 2023 → 2070 are available for long-term planning.
              </div>
            </div>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-emerald-950 hover:bg-emerald-400 transition"
          >
            Add first transaction
          </button>
        </div>
      )}

      {/* Summary cards */}
      <section className="mt-6">
        <SummaryCards prevTotals={prevTotals} />
      </section>

      {/* Charts row */}
      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CashflowChart />
        </div>
        <ExpensePieChart />
      </section>

      {/* Annual + Net Worth */}
      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <AnnualChart />
        <NetWorthTracker />
      </section>

      {/* Monthly summary table */}
      <section className="mt-4">
        <MonthlyTable />
      </section>

      {/* Transactions + Top rankings */}
      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TransactionsTable />
        </div>
        <TopRankings />
      </section>

      {/* Savings goals + Debt calculator */}
      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <SavingsGoals />
        <DebtCalculator />
      </section>

      {/* Breakdowns */}
      <section className="mt-4 grid gap-4 md:grid-cols-3">
        <DebtBreakdown />
        <SavingsBreakdown />
        <InvestmentBreakdown />
      </section>

      {/* Footer */}
      <footer className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-border/40 pt-6 text-xs text-muted-foreground sm:flex-row">
        <span>
          Data persists in your browser only. Reset to return to demo data.
        </span>
        <span className="inline-flex items-center gap-1.5">
          Built with <Heart className="h-3 w-3 text-rose-400" /> using Next.js, Tailwind &amp; Recharts
        </span>
      </footer>

      {/* Floating Add Transaction dialog (driven from header) */}
      <TransactionDialog open={addOpen} onOpenChange={setAddOpen} editing={null} />
    </main>
  );
}
