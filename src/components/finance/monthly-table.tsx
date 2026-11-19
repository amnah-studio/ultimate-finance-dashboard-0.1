"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFinanceStore, monthlyTotals } from "@/lib/store";
import { monthLabel, formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MonthlyTable() {
  const txs = useFinanceStore((s) => s.transactions);
  const year = useFinanceStore((s) => s.selectedYear);
  const currency = useFinanceStore((s) => s.currency);

  const months = monthlyTotals(txs, year);
  const totals = months.reduce(
    (acc, m) => {
      acc.income += m.income;
      acc.expense += m.expense;
      acc.bill += m.bill;
      acc.debt += m.debt;
      acc.savings += m.savings;
      acc.investment += m.investment;
      return acc;
    },
    { income: 0, expense: 0, bill: 0, debt: 0, savings: 0, investment: 0 }
  );

  const maxExpense = Math.max(1, ...months.map((m) => m.expense + m.bill + m.debt));

  return (
    <Card className="card-glow border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Monthly Summary — {year}</CardTitle>
        <CardDescription>Income, expenses, bills, savings & debt by month</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 text-muted-foreground">Month</TableHead>
                <TableHead className="h-9 text-right text-emerald-400/80">Income</TableHead>
                <TableHead className="h-9 text-right text-rose-400/80">Expense</TableHead>
                <TableHead className="h-9 text-right text-amber-400/80">Bills</TableHead>
                <TableHead className="h-9 text-right text-pink-400/80">Debt</TableHead>
                <TableHead className="h-9 text-right text-sky-400/80">Savings</TableHead>
                <TableHead className="h-9 text-right text-violet-400/80">Invest.</TableHead>
                <TableHead className="h-9 text-right text-muted-foreground">Net</TableHead>
                <TableHead className="h-9 text-right text-muted-foreground">Outflow bar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {months.map((m) => {
                const outflow = m.expense + m.bill + m.debt;
                const net = m.income - outflow - m.savings - m.investment;
                const widthPct = (outflow / maxExpense) * 100;
                return (
                  <TableRow key={m.month} className="border-border/40 hover:bg-muted/30">
                    <TableCell className="py-2 font-medium">{monthLabel(m.month)}</TableCell>
                    <TableCell className="py-2 text-right font-mono tabular-nums text-emerald-300">{formatCurrency(m.income, currency)}</TableCell>
                    <TableCell className="py-2 text-right font-mono tabular-nums text-rose-300">{formatCurrency(m.expense, currency)}</TableCell>
                    <TableCell className="py-2 text-right font-mono tabular-nums text-amber-300">{formatCurrency(m.bill, currency)}</TableCell>
                    <TableCell className="py-2 text-right font-mono tabular-nums text-pink-300">{formatCurrency(m.debt, currency)}</TableCell>
                    <TableCell className="py-2 text-right font-mono tabular-nums text-sky-300">{formatCurrency(m.savings, currency)}</TableCell>
                    <TableCell className="py-2 text-right font-mono tabular-nums text-violet-300">{formatCurrency(m.investment, currency)}</TableCell>
                    <TableCell className={cn("py-2 text-right font-mono tabular-nums font-medium", net >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {formatCurrency(net, currency)}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="ml-auto h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-muted/40">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-500/70 to-rose-400"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="border-border/40 bg-muted/30 font-semibold hover:bg-muted/40">
                <TableCell className="py-2">Total</TableCell>
                <TableCell className="py-2 text-right font-mono tabular-nums text-emerald-300">{formatCurrency(totals.income, currency)}</TableCell>
                <TableCell className="py-2 text-right font-mono tabular-nums text-rose-300">{formatCurrency(totals.expense, currency)}</TableCell>
                <TableCell className="py-2 text-right font-mono tabular-nums text-amber-300">{formatCurrency(totals.bill, currency)}</TableCell>
                <TableCell className="py-2 text-right font-mono tabular-nums text-pink-300">{formatCurrency(totals.debt, currency)}</TableCell>
                <TableCell className="py-2 text-right font-mono tabular-nums text-sky-300">{formatCurrency(totals.savings, currency)}</TableCell>
                <TableCell className="py-2 text-right font-mono tabular-nums text-violet-300">{formatCurrency(totals.investment, currency)}</TableCell>
                <TableCell className={cn("py-2 text-right font-mono tabular-nums",
                  (totals.income - totals.expense - totals.bill - totals.debt - totals.savings - totals.investment) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                  {formatCurrency(
                    totals.income - totals.expense - totals.bill - totals.debt - totals.savings - totals.investment,
                    currency
                  )}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
