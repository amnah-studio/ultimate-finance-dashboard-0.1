"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinanceStore, monthlyTotals } from "@/lib/store";
import { monthLabel, formatCurrency } from "@/lib/format";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const config: ChartConfig = {
  income:     { label: "Income",      color: "#34d399" },
  expense:    { label: "Expenses",     color: "#f87171" },
  bill:       { label: "Bills",        color: "#fb923c" },
  debt:       { label: "Debt",         color: "#f472b6" },
  savings:    { label: "Savings",      color: "#60a5fa" },
  investment: { label: "Investments",  color: "#a78bfa" },
};

export function CashflowChart() {
  const txs = useFinanceStore((s) => s.transactions);
  const year = useFinanceStore((s) => s.selectedYear);
  const currency = useFinanceStore((s) => s.currency);
  const data = monthlyTotals(txs, year).map((d) => ({
    month: monthLabel(d.month),
    income: d.income,
    expense: d.expense,
    bill: d.bill,
    debt: d.debt,
    savings: d.savings,
    investment: d.investment,
  }));

  return (
    <Card className="card-glow border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Monthly Cash Flow</CardTitle>
        <CardDescription>
          Stacked outflows vs. income — {year}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={config} className="h-[260px] w-full aspect-auto">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "currentColor", fillOpacity: 0.6 }} interval={0} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "currentColor", fillOpacity: 0.6 }} tickFormatter={(v) => formatCurrency(v, currency, true)} width={56} />
            <Tooltip
              content={<ChartTooltipContent
                formatter={(value, name) => (
                  <div className="flex w-full justify-between gap-3">
                    <span className="text-muted-foreground">{config[name as keyof typeof config]?.label ?? name}</span>
                    <span className="font-mono font-medium tabular-nums">{formatCurrency(Number(value), currency)}</span>
                  </div>
                )}
              />}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              iconType="circle"
            />
            <Bar dataKey="income" stackId="a" fill="var(--color-income)" radius={[0,0,0,0]} maxBarSize={36} />
            <Bar dataKey="expense" stackId="b" fill="var(--color-expense)" maxBarSize={36} />
            <Bar dataKey="bill" stackId="b" fill="var(--color-bill)" maxBarSize={36} />
            <Bar dataKey="debt" stackId="b" fill="var(--color-debt)" maxBarSize={36} />
            <Bar dataKey="savings" stackId="b" fill="var(--color-savings)" maxBarSize={36} />
            <Bar dataKey="investment" stackId="b" fill="var(--color-investment)" radius={[4,4,0,0]} maxBarSize={36} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
