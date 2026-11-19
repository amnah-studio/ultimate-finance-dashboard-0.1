"use client";

import { CreditCard, PiggyBank, Landmark } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinanceStore, categoryBreakdown } from "@/lib/store";
import { formatCurrency, pct } from "@/lib/format";
import type { TxType } from "@/lib/types";

interface Props {
  type: TxType;
  title: string;
  description: string;
  icon: React.ElementType;
  tone: string;
}

function BreakdownCard({ type, title, description, icon: Icon, tone }: Props) {
  const txs = useFinanceStore((s) => s.transactions);
  const year = useFinanceStore((s) => s.selectedYear);
  const currency = useFinanceStore((s) => s.currency);

  const data = categoryBreakdown(txs, type, year);
  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <Card className="card-glow border-border/60 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className={`h-4 w-4 ${tone}`} /> {title}
        </CardTitle>
        <CardDescription>{description} — {year}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-2 flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 p-2">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</span>
          <span className={`font-mono text-sm font-semibold tabular-nums ${tone}`}>{formatCurrency(total, currency)}</span>
        </div>
        <div className="space-y-1.5">
          {data.map((d) => {
            const share = pct(d.amount, total, 1);
            return (
              <div key={d.category} className="rounded-md border border-border/40 p-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium">{d.category}</span>
                  <span className="font-mono tabular-nums">{formatCurrency(d.amount, currency)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted/40">
                    <div
                      className={`h-full rounded-full ${tone.includes("rose") ? "bg-pink-400" : tone.includes("sky") ? "bg-sky-400" : "bg-violet-400"}`}
                      style={{ width: `${share}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-[10px] text-muted-foreground tabular-nums">{share.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
          {data.length === 0 && (
            <div className="rounded-md border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
              No data for {year}.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DebtBreakdown() {
  return (
    <BreakdownCard
      type="debt"
      title="Debt Payments"
      description="Payments toward debts by category"
      icon={CreditCard}
      tone="text-pink-300"
    />
  );
}
export function SavingsBreakdown() {
  return (
    <BreakdownCard
      type="savings"
      title="Savings Allocation"
      description="Where your savings go"
      icon={PiggyBank}
      tone="text-sky-300"
    />
  );
}
export function InvestmentBreakdown() {
  return (
    <BreakdownCard
      type="investment"
      title="Investment Allocation"
      description="Allocation across investment types"
      icon={Landmark}
      tone="text-violet-300"
    />
  );
}
