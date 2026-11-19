"use client";

import { useMemo, useState } from "react";
import { Calculator, Plus, Trash2, Pencil, Snowflake, Flame, Calendar, TrendingDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinanceStore } from "@/lib/store";
import { formatCurrency, monthLabel } from "@/lib/format";
import type { DebtAccount } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Strategy = "avalanche" | "snowball" | "fixed";

const STRATEGY_INFO: Record<Strategy, { label: string; icon: React.ElementType; desc: string }> = {
  avalanche: { label: "Avalanche", icon: Snowflake, desc: "Pay highest APR first — saves the most interest." },
  snowball:  { label: "Snowball",  icon: Flame,    desc: "Pay smallest balance first — quick wins." },
  fixed:     { label: "Minimum only", icon: Calendar, desc: "Pay just the minimums — slowest payoff." },
};

interface PlanRow {
  month: number;
  totalBalance: number;
  totalInterest: number;
  totalPayment: number;
  per: { id: string; name: string; balance: number; payment: number; interest: number }[];
}

export function DebtCalculator() {
  const debts = useFinanceStore((s) => s.debts);
  const currency = useFinanceStore((s) => s.currency);
  const addDebt = useFinanceStore((s) => s.addDebt);
  const updateDebt = useFinanceStore((s) => s.updateDebt);
  const deleteDebt = useFinanceStore((s) => s.deleteDebt);

  const [strategy, setStrategy] = useState<Strategy>("avalanche");
  const [extraMonthly, setExtraMonthly] = useState<string>("300");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DebtAccount | null>(null);

  // Form fields
  const [fName, setFName] = useState("");
  const [fBalance, setFBalance] = useState("");
  const [fMin, setFMin] = useState("");
  const [fApr, setFApr] = useState("");

  const totalBalance = debts.reduce((s, d) => s + d.balance, 0);
  const totalMin = debts.reduce((s, d) => s + d.minPayment, 0);

  const openAdd = () => {
    setEditing(null);
    setFName("");
    setFBalance("");
    setFMin("");
    setFApr("");
    setDialogOpen(true);
  };
  const openEdit = (d: DebtAccount) => {
    setEditing(d);
    setFName(d.name);
    setFBalance(String(d.balance));
    setFMin(String(d.minPayment));
    setFApr(String(d.apr));
    setDialogOpen(true);
  };

  const save = () => {
    const b = Number(fBalance);
    const m = Number(fMin);
    const a = Number(fApr);
    if (!fName.trim() || !b || !m || !a) {
      toast.error("Please fill in all fields with valid numbers.");
      return;
    }
    const payload = { name: fName.trim(), balance: b, minPayment: m, apr: a, type: editing?.type };
    if (editing) {
      updateDebt(editing.id, payload);
      toast.success("Debt updated");
    } else {
      addDebt(payload);
      toast.success("Debt added");
    }
    setDialogOpen(false);
  };

  // Build the payoff plan
  const plan = useMemo<PlanRow[]>(() => {
    if (debts.length === 0) return [];
    const extra = Math.max(0, Number(extraMonthly) || 0);
    // Working copies
    const work = debts.map((d) => ({
      id: d.id,
      name: d.name,
      balance: d.balance,
      apr: d.apr,
      minPayment: d.minPayment,
    }));
    const rows: PlanRow[] = [];
    let month = 0;
    let cumulativeInterest = 0;
    let cumulativePayment = 0;
    const maxMonths = 600; // safety — 50 years
    while (work.some((d) => d.balance > 0.005) && month < maxMonths) {
      month += 1;
      const monthInterest = work.map((d) => (d.balance * (d.apr / 100)) / 12);
      // Determine target for extra payment
      let targetId: string;
      const active = work.filter((d) => d.balance > 0);
      if (strategy === "snowball") {
        targetId = active.reduce((min, d) => (d.balance < min.balance ? d : min), active[0]).id;
      } else if (strategy === "avalanche") {
        targetId = active.reduce((max, d) => (d.apr > max.apr ? d : max), active[0]).id;
      } else {
        targetId = "";
      }
      // Compute payments: minimums + extra applied to target
      const payments = work.map((d, i) => {
        let pay = Math.min(d.balance + monthInterest[i], d.minPayment);
        if (targetId && d.id === targetId && strategy !== "fixed") {
          pay += extra;
        }
        // Don't overpay
        pay = Math.min(pay, d.balance + monthInterest[i]);
        return pay;
      });
      // Apply interest + payments
      const per: PlanRow["per"] = [];
      let totalPay = 0;
      let totalBal = 0;
      for (let i = 0; i < work.length; i++) {
        const interest = monthInterest[i];
        const payment = payments[i];
        work[i].balance = Math.max(0, work[i].balance + interest - payment);
        cumulativeInterest += interest;
        cumulativePayment += payment;
        totalPay += payment;
        totalBal += work[i].balance;
        per.push({
          id: work[i].id,
          name: work[i].name,
          balance: work[i].balance,
          payment,
          interest,
        });
      }
      rows.push({
        month,
        totalBalance: totalBal,
        totalInterest: cumulativeInterest,
        totalPayment: cumulativePayment,
        per,
      });
    }
    return rows;
  }, [debts, extraMonthly, strategy]);

  const finalMonth = plan.length ? plan[plan.length - 1].month : 0;
  const totalInterest = plan.length ? plan[plan.length - 1].totalInterest : 0;
  const totalPaid = plan.length ? plan[plan.length - 1].totalPayment : 0;
  const payoffDate = finalMonth
    ? new Date(2025, 0 + finalMonth - 1, 1)
    : null;

  const strategyList = (Object.keys(STRATEGY_INFO) as Strategy[]);

  return (
    <Card className="card-glow border-border/60 h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4 text-pink-400" /> Debt Payoff Calculator
            </CardTitle>
            <CardDescription>
              Simulate strategies with extra monthly contributions
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5" /> Add Debt
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          {/* Left: debts list */}
          <div className="space-y-2">
            {debts.map((d) => {
              const share = totalBalance > 0 ? (d.balance / totalBalance) * 100 : 0;
              return (
                <div key={d.id} className="rounded-lg border border-border/50 bg-muted/20 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{d.name}</span>
                        <Badge variant="outline" className="border-pink-500/30 bg-pink-500/10 px-1.5 py-0 text-[10px] font-medium text-pink-300">
                          {d.apr.toFixed(2)}% APR
                        </Badge>
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        Min payment: <span className="font-mono tabular-nums">{formatCurrency(d.minPayment, currency)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono tabular-nums text-sm">{formatCurrency(d.balance, currency)}</div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground" onClick={() => openEdit(d)} aria-label="Edit debt"><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-rose-400" onClick={() => { if (confirm(`Delete "${d.name}"?`)) { deleteDebt(d.id); toast.success("Debt removed"); } }} aria-label="Delete debt"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </div>
                  <Progress value={share} className="mt-2 h-1" />
                </div>
              );
            })}
            {debts.length === 0 && (
              <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
                Add your first debt account to start planning.
              </div>
            )}
          </div>

          {/* Right: simulator */}
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <div className="text-xs font-medium text-muted-foreground">Strategy</div>
            <Select value={strategy} onValueChange={(v) => setStrategy(v as Strategy)}>
              <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {strategyList.map((s) => {
                  const info = STRATEGY_INFO[s];
                  const Icon = info.icon;
                  return (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-1.5">
                        <Icon className="h-3 w-3" /> {info.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
              {STRATEGY_INFO[strategy].desc}
            </p>

            <div className="mt-3 grid gap-1.5">
              <Label htmlFor="extra">Extra monthly ($)</Label>
              <Input
                id="extra"
                inputMode="decimal"
                value={extraMonthly}
                onChange={(e) => setExtraMonthly(e.target.value.replace(/[^0-9.]/g, ""))}
                className="h-8 text-xs"
              />
            </div>

            {plan.length > 0 ? (
              <div className="mt-3 space-y-2">
                <Stat label="Payoff in" value={`${finalMonth} mo`} sub={payoffDate ? `by ${monthLabel(payoffDate.getMonth() + 1)} ${payoffDate.getFullYear()}` : ""} icon={Calendar} tone="emerald" />
                <Stat label="Total interest" value={formatCurrency(totalInterest, currency)} icon={TrendingDown} tone="rose" />
                <Stat label="Total paid" value={formatCurrency(totalPaid, currency)} icon={Calculator} tone="sky" />
              </div>
            ) : (
              <div className="mt-3 text-xs text-muted-foreground">No debt to simulate.</div>
            )}
          </div>
        </div>

        {plan.length > 0 && (
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Projected remaining at payoff completion
              </div>
              <div className="text-[10px] text-muted-foreground">Month {finalMonth}</div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {plan[plan.length - 1].per.map((p) => {
                const orig = debts.find((d) => d.id === p.id)?.balance ?? 0;
                const paid = orig > 0 ? Math.max(0, (1 - p.balance / orig) * 100) : 100;
                return (
                  <div key={p.id} className="rounded-lg border border-border/50 bg-muted/20 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium">{p.name}</span>
                      <span className={cn("text-[11px] font-medium", p.balance <= 0.005 ? "text-emerald-400" : "text-muted-foreground")}>
                        {p.balance <= 0.005 ? "✓ Paid off" : formatCurrency(p.balance, currency)}
                      </span>
                    </div>
                    <Progress value={paid} className="mt-2 h-1" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Debt Account" : "Add Debt Account"}</DialogTitle>
            <DialogDescription>Enter the current balance, minimum monthly payment and APR.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="d-name">Account name</Label>
              <Input id="d-name" placeholder="e.g. Visa Platinum" value={fName} onChange={(e) => setFName(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="d-balance">Balance ({currency})</Label>
                <Input id="d-balance" inputMode="decimal" placeholder="3850" value={fBalance} onChange={(e) => setFBalance(e.target.value.replace(/[^0-9.]/g, ""))} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="d-min">Min pay ({currency})</Label>
                <Input id="d-min" inputMode="decimal" placeholder="160" value={fMin} onChange={(e) => setFMin(e.target.value.replace(/[^0-9.]/g, ""))} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="d-apr">APR (%)</Label>
                <Input id="d-apr" inputMode="decimal" placeholder="19.99" value={fApr} onChange={(e) => setFApr(e.target.value.replace(/[^0-9.]/g, ""))} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-pink-500 text-pink-50 hover:bg-pink-400">{editing ? "Save" : "Add debt"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Stat({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  tone: "emerald" | "rose" | "sky";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-300 bg-emerald-500/10"
      : tone === "rose"
      ? "text-rose-300 bg-rose-500/10"
      : "text-sky-300 bg-sky-500/10";
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/20 p-2">
      <div className="flex items-center gap-2">
        <span className={cn("grid h-7 w-7 place-items-center rounded-md", toneClass)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
          {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
        </div>
      </div>
      <div className="font-mono text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}
