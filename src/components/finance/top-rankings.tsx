"use client";

import { Trophy, ArrowDown, ArrowUp, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinanceStore } from "@/lib/store";
import { monthLabel, formatCurrency, pct } from "@/lib/format";
import type { TxType } from "@/lib/types";

export function TopRankings() {
  const txs = useFinanceStore((s) => s.transactions);
  const year = useFinanceStore((s) => s.selectedYear);
  const currency = useFinanceStore((s) => s.currency);

  const months = Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
    const month = m;
    const totals: Record<TxType, number> = { income: 0, expense: 0, bill: 0, debt: 0, savings: 0, investment: 0 };
    for (const t of txs) {
      if (Number(t.date.slice(0, 4)) !== year) continue;
      if (Number(t.date.slice(5, 7)) !== month) continue;
      totals[t.type] += t.amount;
    }
    return { month, ...totals, outflow: totals.expense + totals.bill + totals.debt };
  });

  const topIncome = [...months].sort((a, b) => b.income - a.income).slice(0, 5);
  const topExpense = [...months].sort((a, b) => b.outflow - a.outflow).slice(0, 5);
  const maxIncome = Math.max(1, ...topIncome.map((m) => m.income));
  const maxOutflow = Math.max(1, ...topExpense.map((m) => m.outflow));

  return (
    <Card className="card-glow border-border/60 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" /> Top 5 Months — {year}
        </CardTitle>
        <CardDescription>Best income months and biggest outflow months</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 grid gap-3 sm:grid-cols-2">
        <RankList
          title="Top income"
          icon={<ArrowUp className="h-3 w-3" />}
          tone="emerald"
          rows={topIncome.map((m) => ({ label: monthLabel(m.month), value: m.income }))}
          max={maxIncome}
          currency={currency}
        />
        <RankList
          title="Top outflow"
          icon={<ArrowDown className="h-3 w-3" />}
          tone="rose"
          rows={topExpense.map((m) => ({ label: monthLabel(m.month), value: m.outflow }))}
          max={maxOutflow}
          currency={currency}
        />
      </CardContent>
    </Card>
  );
}

function RankList({
  title,
  icon,
  tone,
  rows,
  max,
  currency,
}: {
  title: string;
  icon: React.ReactNode;
  tone: "emerald" | "rose";
  rows: { label: string; value: number }[];
  max: number;
  currency: string;
}) {
  const barColor = tone === "emerald" ? "from-emerald-500/70 to-emerald-400" : "from-rose-500/70 to-rose-400";
  const textTone = tone === "emerald" ? "text-emerald-300" : "text-rose-300";
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
      <div className={`mb-2 flex items-center gap-1.5 text-xs font-medium ${textTone}`}>
        {icon} {title}
      </div>
      <ol className="space-y-1.5">
        {rows.map((r, i) => (
          <li key={r.label} className="flex items-center gap-2 text-xs">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted/50 text-[10px] font-medium text-muted-foreground">
              {i === 0 ? <Crown className="h-3 w-3 text-amber-400" /> : i + 1}
            </span>
            <span className="w-10 shrink-0 text-muted-foreground">{r.label}</span>
            <div className="flex-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                  style={{ width: `${(r.value / max) * 100}%` }}
                />
              </div>
            </div>
            <span className={`w-16 shrink-0 text-right font-mono tabular-nums ${textTone}`}>
              {formatCurrency(r.value, currency, true)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
