"use client";

import { ArrowDownRight, ArrowUpRight, Banknote, CreditCard, Landmark, PiggyBank, Receipt, ShoppingCart, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useFinanceStore, computeTotals } from "@/lib/store";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { TxType } from "@/lib/types";

const CARD_DEFS: { key: TxType | "net"; label: string; icon: React.ElementType; colorVar: string; glow: string }[] = [
  { key: "income",     label: "Income",      icon: Banknote,     colorVar: "--chart-1", glow: "rgba(52,211,153,0.18)" },
  { key: "expense",    label: "Expenses",    icon: ShoppingCart, colorVar: "--chart-4", glow: "rgba(248,113,113,0.18)" },
  { key: "bill",       label: "Bills",       icon: Receipt,     colorVar: "--chart-3", glow: "rgba(251,146,60,0.18)" },
  { key: "debt",       label: "Debt",        icon: CreditCard,  colorVar: "--chart-5", glow: "rgba(244,114,182,0.18)" },
  { key: "savings",    label: "Savings",     icon: PiggyBank,   colorVar: "--chart-2", glow: "rgba(96,165,250,0.18)" },
  { key: "investment", label: "Investments", icon: Landmark,    colorVar: "--chart-2", glow: "rgba(167,139,250,0.18)" },
];

interface SummaryCardsProps {
  prevTotals?: ReturnType<typeof computeTotals>;
}

export function SummaryCards({ prevTotals }: SummaryCardsProps) {
  const txs = useFinanceStore((s) => s.transactions);
  const year = useFinanceStore((s) => s.selectedYear);
  const currency = useFinanceStore((s) => s.currency);
  const totals = computeTotals(txs, year);

  const net = totals.income - totals.expense - totals.bill - totals.debt - totals.savings - totals.investment;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
      {CARD_DEFS.map((c) => {
        const value = (totals as any)[c.key] as number;
        const prevValue = prevTotals ? ((prevTotals as any)[c.key] as number) : undefined;
        const change = prevValue && prevValue > 0 ? ((value - prevValue) / prevValue) * 100 : undefined;
        const positive = c.key === "income" ? true : false;
        const Icon = c.icon;
        return (
          <Card
            key={c.key}
            className="card-glow relative overflow-hidden border-border/60 px-4 py-4"
          >
            <div
              className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-40 blur-2xl"
              style={{ background: `var(${c.colorVar})` }}
            />
            <div className="flex items-center justify-between">
              <div
                className="grid h-9 w-9 place-items-center rounded-lg"
                style={{ background: `color-mix(in oklch, var(${c.colorVar}) 18%, transparent)`, color: `var(${c.colorVar})` }}
              >
                <Icon className="h-4 w-4" />
              </div>
              {change !== undefined && (
                <span
                  className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                    (positive && change > 0) || (!positive && change < 0)
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {formatPercent(Math.abs(change), 1)}
                </span>
              )}
            </div>
            <div className="mt-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {c.label}
              </div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums sm:text-xl">
                {formatCurrency(value, currency)}
              </div>
            </div>
          </Card>
        );
      })}

      {/* Net cash flow card */}
      <Card
        className={`card-glow col-span-2 sm:col-span-3 lg:col-span-6 px-4 py-4 ${
          net >= 0
            ? "border-emerald-500/20 bg-gradient-to-r from-emerald-500/8 to-transparent"
            : "border-rose-500/20 bg-gradient-to-r from-rose-500/8 to-transparent"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-9 w-9 place-items-center rounded-lg ${
                net >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
              }`}
            >
              {net >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Net Cash Flow (after savings & investments)
              </div>
              <div className="text-xs text-muted-foreground">
                Income − Expenses − Bills − Debt − Savings − Investments
              </div>
            </div>
          </div>
          <div
            className={`text-2xl font-semibold tabular-nums ${
              net >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatCurrency(net, currency)}
          </div>
        </div>
      </Card>
    </div>
  );
}
