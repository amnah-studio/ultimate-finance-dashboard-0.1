"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinanceStore, categoryBreakdown } from "@/lib/store";
import { formatCurrency, pct } from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TxType } from "@/lib/types";

const PALETTE = ["#34d399", "#f87171", "#fb923c", "#f472b6", "#60a5fa", "#a78bfa", "#facc15", "#22d3ee", "#fb7185", "#4ade80"];

const TYPE_OPTIONS: { key: TxType; label: string }[] = [
  { key: "expense", label: "Expenses" },
  { key: "bill", label: "Bills" },
  { key: "income", label: "Income" },
  { key: "savings", label: "Savings" },
  { key: "investment", label: "Investments" },
];

export function ExpensePieChart() {
  const txs = useFinanceStore((s) => s.transactions);
  const year = useFinanceStore((s) => s.selectedYear);
  const currency = useFinanceStore((s) => s.currency);
  const [type, setType] = useState<TxType>("expense");
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const data = categoryBreakdown(txs, type, year);
  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <Card className="card-glow border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Category Breakdown</CardTitle>
            <CardDescription>By {TYPE_OPTIONS.find((o) => o.key === type)?.label.toLowerCase()} — {year}</CardDescription>
          </div>
          <Select value={type} onValueChange={(v) => setType(v as TxType)}>
            <SelectTrigger className="h-8 w-[130px]" aria-label="Category type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.key} value={o.key}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-3 sm:grid-cols-[160px_1fr] sm:items-center">
          <div className="relative mx-auto h-[160px] w-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius={50}
                  outerRadius={76}
                  paddingAngle={2}
                  stroke="none"
                  onMouseEnter={(_, i) => setActiveIdx(i)}
                  onMouseLeave={() => setActiveIdx(null)}
                  activeIndex={activeIdx ?? undefined}
                  activeShape={(props: any) => (
                    <Sector
                      {...props}
                      outerRadius={props.outerRadius + 6}
                      innerRadius={props.innerRadius - 2}
                      cornerRadius={4}
                    />
                  )}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0];
                    const v = Number(p.value);
                    return (
                      <div className="rounded-lg border border-border/60 bg-popover px-3 py-2 text-xs shadow-xl">
                        <div className="font-medium">{p.name}</div>
                        <div className="font-mono tabular-nums">{formatCurrency(v, currency)}</div>
                        <div className="text-muted-foreground">{pct(v, total, 1).toFixed(1)}% of total</div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {TYPE_OPTIONS.find((o) => o.key === type)?.label}
              </span>
              <span className="text-base font-semibold tabular-nums">{formatCurrency(total, currency, true)}</span>
            </div>
          </div>

          <div className="grid max-h-[200px] grid-cols-1 gap-1.5 overflow-y-auto pr-1">
            {data.map((d, i) => (
              <div key={d.category} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                  style={{ background: PALETTE[i % PALETTE.length] }}
                />
                <span className="min-w-0 flex-1 truncate text-muted-foreground" title={d.category}>{d.category}</span>
                <span className="shrink-0 font-mono tabular-nums">{formatCurrency(d.amount, currency)}</span>
                <span className="w-10 shrink-0 text-right tabular-nums text-muted-foreground">
                  {pct(d.amount, total, 1).toFixed(1)}%
                </span>
              </div>
            ))}
            {data.length === 0 && (
              <div className="text-xs text-muted-foreground">No data for the selected year.</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
