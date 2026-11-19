"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinanceStore, monthlyTotals } from "@/lib/store";
import { monthLabel, formatCurrency } from "@/lib/format";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Mode = "inflowOutflow" | "cumulative";

const config: ChartConfig = {
  income:      { label: "Income",      color: "#34d399" },
  outflow:     { label: "Outflow",     color: "#f87171" },
  savingsRate: { label: "Savings Rate", color: "#60a5fa" },
  cumIncome:   { label: "Cumulative Income", color: "#34d399" },
  cumOutflow:  { label: "Cumulative Outflow", color: "#f87171" },
};

export function AnnualChart() {
  const txs = useFinanceStore((s) => s.transactions);
  const year = useFinanceStore((s) => s.selectedYear);
  const currency = useFinanceStore((s) => s.currency);
  const [mode, setMode] = useState<Mode>("inflowOutflow");

  const rows = monthlyTotals(txs, year).map((m) => {
    const income = m.income;
    const outflow = m.expense + m.bill + m.debt + m.savings + m.investment;
    return {
      month: monthLabel(m.month),
      income,
      outflow,
      savingsRate: income > 0 ? ((m.savings + m.investment) / income) * 100 : 0,
    };
  });

  const cumRows = rows.reduce(
    (acc, r) => {
      const cumIncome = acc.cumIncome + r.income;
      const cumOutflow = acc.cumOutflow + r.outflow;
      acc.data.push({ ...r, cumIncome, cumOutflow });
      acc.cumIncome = cumIncome;
      acc.cumOutflow = cumOutflow;
      return acc;
    },
    { data: [] as typeof rows, cumIncome: 0, cumOutflow: 0 }
  ).data;

  return (
    <Card className="card-glow border-border/60">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Annual Income vs Outflow</CardTitle>
            <CardDescription>Monthly flow &amp; cumulative progression — {year}</CardDescription>
          </div>
          <ToggleGroup type="single" value={mode} onValueChange={(v) => v && setMode(v as Mode)} size="sm" variant="outline">
            <ToggleGroupItem value="inflowOutflow" className="h-7 px-2 text-xs">Monthly</ToggleGroupItem>
            <ToggleGroupItem value="cumulative" className="h-7 px-2 text-xs">Cumulative</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={config} className="h-[260px] w-full aspect-auto">
          {mode === "inflowOutflow" ? (
            <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-income)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-income)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gOutflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-outflow)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-outflow)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "currentColor", fillOpacity: 0.6 }} interval={0} />
              <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "currentColor", fillOpacity: 0.6 }} tickFormatter={(v) => formatCurrency(v, currency, true)} width={56} />
              <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "currentColor", fillOpacity: 0.6 }} tickFormatter={(v) => `${v.toFixed(0)}%`} width={36} />
              <Tooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      if (name === "savingsRate") {
                        return (
                          <div className="flex w-full justify-between gap-3">
                            <span className="text-muted-foreground">Savings rate</span>
                            <span className="font-mono font-medium tabular-nums">{Number(value).toFixed(1)}%</span>
                          </div>
                        );
                      }
                      return (
                        <div className="flex w-full justify-between gap-3">
                          <span className="text-muted-foreground">{config[name as keyof typeof config]?.label ?? name}</span>
                          <span className="font-mono font-medium tabular-nums">{formatCurrency(Number(value), currency)}</span>
                        </div>
                      );
                    }}
                  />
                }
                cursor={{ stroke: "rgba(255,255,255,0.18)", strokeDasharray: "3 3" }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
              <Area type="monotone" dataKey="income" yAxisId="left" stroke="var(--color-income)" strokeWidth={2} fill="url(#gIncome)" />
              <Area type="monotone" dataKey="outflow" yAxisId="left" stroke="var(--color-outflow)" strokeWidth={2} fill="url(#gOutflow)" />
              <Line type="monotone" dataKey="savingsRate" yAxisId="right" stroke="var(--color-savingsRate)" strokeWidth={2} dot={false} strokeDasharray="4 4" />
            </ComposedChart>
          ) : (
            <AreaChart data={cumRows} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="gCumI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-cumIncome)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-cumIncome)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gCumO" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-cumOutflow)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-cumOutflow)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "currentColor", fillOpacity: 0.6 }} interval={0} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "currentColor", fillOpacity: 0.6 }} tickFormatter={(v) => formatCurrency(v, currency, true)} width={56} />
              <Tooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex w-full justify-between gap-3">
                        <span className="text-muted-foreground">{config[name as keyof typeof config]?.label ?? name}</span>
                        <span className="font-mono font-medium tabular-nums">{formatCurrency(Number(value), currency)}</span>
                      </div>
                    )}
                  />
                }
                cursor={{ stroke: "rgba(255,255,255,0.18)", strokeDasharray: "3 3" }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
              <Area type="monotone" dataKey="cumIncome" stroke="var(--color-cumIncome)" strokeWidth={2} fill="url(#gCumI)" />
              <Area type="monotone" dataKey="cumOutflow" stroke="var(--color-cumOutflow)" strokeWidth={2} fill="url(#gCumO)" />
            </AreaChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
