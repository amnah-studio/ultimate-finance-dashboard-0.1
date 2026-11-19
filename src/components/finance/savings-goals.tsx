"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Target, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFinanceStore } from "@/lib/store";
import { formatCurrency, formatDate, pct } from "@/lib/format";
import type { SavingsGoal } from "@/lib/types";
import { toast } from "sonner";

const PALETTE = ["#34d399", "#fb923c", "#60a5fa", "#a78bfa", "#f472b6", "#facc15", "#22d3ee"];

export function SavingsGoals() {
  const goals = useFinanceStore((s) => s.savingsGoals);
  const currency = useFinanceStore((s) => s.currency);
  const contributeGoal = useFinanceStore((s) => s.contributeGoal);
  const deleteGoal = useFinanceStore((s) => s.deleteGoal);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [contributeId, setContributeId] = useState<string | null>(null);
  const [contributeAmt, setContributeAmt] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [dueDate, setDueDate] = useState("");

  const openAdd = () => {
    setEditing(null);
    setName("");
    setTarget("");
    setSaved("");
    setDueDate("");
    setDialogOpen(true);
  };

  const openEdit = (g: SavingsGoal) => {
    setEditing(g);
    setName(g.name);
    setTarget(String(g.target));
    setSaved(String(g.saved));
    setDueDate(g.dueDate ?? "");
    setDialogOpen(true);
  };

  const save = () => {
    const t = Number(target);
    const s = Number(saved) || 0;
    if (!name.trim() || !t || t <= 0) {
      toast.error("Please provide a name and a positive target.");
      return;
    }
    const payload = {
      name: name.trim(),
      target: t,
      saved: Math.max(0, Math.min(s, t * 5)),
      dueDate: dueDate || undefined,
      color: editing?.color ?? PALETTE[goals.length % PALETTE.length],
    };
    if (editing) {
      useFinanceStore.getState().updateGoal(editing.id, payload);
      toast.success("Goal updated");
    } else {
      useFinanceStore.getState().addGoal(payload);
      toast.success("Goal added");
    }
    setDialogOpen(false);
  };

  const doContribute = (id: string, amt: number) => {
    if (!amt || amt === 0) return;
    contributeGoal(id, amt);
    toast.success(amt > 0 ? `Added ${formatCurrency(amt, currency)} to goal` : `Withdrew ${formatCurrency(Math.abs(amt), currency)}`);
    setContributeId(null);
    setContributeAmt("");
  };

  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);

  return (
    <Card className="card-glow border-border/60 h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-400" /> Savings Goals
            </CardTitle>
            <CardDescription>
              {goals.length} goals • {formatCurrency(totalSaved, currency)} of {formatCurrency(totalTarget, currency)} (
              {pct(totalSaved, totalTarget, 1).toFixed(1)}%)
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5" /> New
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-2.5">
          {goals.map((g) => {
            const p = pct(g.saved, g.target, 1);
            const done = g.saved >= g.target;
            const remaining = Math.max(0, g.target - g.saved);
            return (
              <div
                key={g.id}
                className="rounded-lg border border-border/50 bg-muted/20 p-3 transition hover:border-border/80"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: g.color ?? "#34d399" }}
                    />
                    <span className="truncate text-sm font-medium">{g.name}</span>
                    {done && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                        <Check className="h-2.5 w-2.5" /> Done
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => openEdit(g)}
                      aria-label="Edit goal"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-rose-400"
                      onClick={() => {
                        if (confirm(`Delete goal "${g.name}"?`)) {
                          deleteGoal(g.id);
                          toast.success("Goal deleted");
                        }
                      }}
                      aria-label="Delete goal"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="mt-2 flex items-end justify-between text-xs text-muted-foreground">
                  <span className="font-mono tabular-nums">
                    {formatCurrency(g.saved, currency)} <span className="opacity-60">/ {formatCurrency(g.target, currency)}</span>
                  </span>
                  <span className="font-mono tabular-nums text-foreground/80">{p.toFixed(1)}%</span>
                </div>
                <Progress
                  value={Math.min(100, p)}
                  className="mt-1.5 h-1.5"
                  // @ts-expect-error style prop
                  style={{
                    background: "color-mix(in oklch, var(--foreground) 8%, transparent)",
                  }}
                />
                <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {remaining > 0 ? `${formatCurrency(remaining, currency)} to go` : "Goal reached"}
                    {g.dueDate && !done && ` • by ${formatDate(g.dueDate, { month: "short", year: "numeric" })}`}
                  </span>
                </div>

                <div className="mt-2 flex gap-1">
                  {contributeId === g.id ? (
                    <>
                      <Input
                        autoFocus
                        inputMode="decimal"
                        placeholder="Amount (use − for withdraw)"
                        value={contributeAmt}
                        onChange={(e) => setContributeAmt(e.target.value.replace(/[^0-9.-]/g, ""))}
                        className="h-7 flex-1 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") doContribute(g.id, Number(contributeAmt));
                          if (e.key === "Escape") { setContributeId(null); setContributeAmt(""); }
                        }}
                      />
                      <Button size="sm" className="h-7 px-2 text-xs bg-emerald-500 text-emerald-950 hover:bg-emerald-400" onClick={() => doContribute(g.id, Number(contributeAmt))}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { setContributeId(null); setContributeAmt(""); }}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setContributeId(g.id)}>+ Contribute</Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => doContribute(g.id, 100)}>+$100</Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => doContribute(g.id, 500)}>+$500</Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {goals.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
              No goals yet. Click <span className="text-foreground">New</span> to create your first savings goal.
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Goal" : "New Savings Goal"}</DialogTitle>
            <DialogDescription>Set a target amount and optional due date.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="g-name">Name</Label>
              <Input id="g-name" placeholder="e.g. Emergency Fund" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="g-target">Target ({currency})</Label>
                <Input id="g-target" inputMode="decimal" placeholder="10000" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^0-9.]/g, ""))} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="g-saved">Already saved ({currency})</Label>
                <Input id="g-saved" inputMode="decimal" placeholder="0" value={saved} onChange={(e) => setSaved(e.target.value.replace(/[^0-9.]/g, ""))} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="g-due">Due date (optional)</Label>
              <Input id="g-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400">{editing ? "Save" : "Create goal"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
