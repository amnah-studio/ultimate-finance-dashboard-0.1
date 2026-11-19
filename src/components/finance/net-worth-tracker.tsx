"use client";

import { useState } from "react";
import { LineChart as LIcon, Plus, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ComposedChart,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFinanceStore } from "@/lib/store";
import { formatDate, formatCurrency } from "@/lib/format";
import type { NetWorthSnapshot } from "@/lib/types";
import { toast } from "sonner";

const config: ChartConfig = {
  assets:     { label: "Assets",     color: "#34d399" },
  liabilities:{ label: "Liabilities", color: "#f472b6" },
  net:        { label: "Net worth",   color: "#60a5fa" },
};

export function NetWorthTracker() {
  const netWorth = useFinanceStore((s) => s.netWorth);
  const currency = useFinanceStore((s) => s.currency);
  const addNetWorth = useFinanceStore((s) => s.addNetWorth);
  const updateNetWorth = useFinanceStore((s) => s.updateNetWorth);
  const deleteNetWorth = useFinanceStore((s) => s.deleteNetWorth);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NetWorthSnapshot | null>(null);
  const [date, setDate] = useState("");
  const [assets, setAssets] = useState("");
  const [liabilities, setLiabilities] = useState("");

  const sorted = [...netWorth].sort((a, b) => (a.date < b.date ? -1 : 1));
  const data = sorted.map((s) => ({
    date: formatDate(s.date, { month: "short", year: "2-digit" }),
    assets: s.assets,
    liabilities: s.liabilities,
    net: s.assets - s.liabilities,
  }));

  const latest = data[data.length - 1];
  const first = data[0];
  const yoyChange = latest && first ? latest.net - first.net : 0;
  const yoyPct = latest && first && first.net !== 0 ? (yoyChange / Math.abs(first.net)) * 100 : 0;

  const openAdd = () => {
    const today = new Date();
    setEditing(null);
    setDate(today.toISOString().slice(0, 10));
    setAssets("");
    setLiabilities("");
    setOpen(true);
  };
  const openEdit = (s: NetWorthSnapshot) => {
    setEditing(s);
    setDate(s.date);
    setAssets(String(s.assets));
    setLiabilities(String(s.liabilities));
    setOpen(true);
  };
  const save = () => {
    const a = Number(assets);
    const l = Number(liabilities);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !a) {
      toast.error("Enter a valid date and asset value.");
      return;
    }
    const payload = { date, assets: a, liabilities: l };
    if (editing) {
      updateNetWorth(editing.id, payload);
      toast.success("Snapshot updated");
    } else {
      addNetWorth(payload);
      toast.success("Snapshot added");
    }
    setOpen(false);
  };

  return (
    <Card className="card-glow border-border/60">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <LIcon className="h-4 w-4 text-sky-400" /> Net Worth Tracker
            </CardTitle>
            <CardDescription>Assets, liabilities &amp; net worth over time</CardDescription>
          </div>
          <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5" /> Add Snapshot
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-3 sm:grid-cols-3">
          <Mini label="Assets" value={latest?.assets ?? 0} color="text-emerald-300" />
          <Mini label="Liabilities" value={latest?.liabilities ?? 0} color="text-pink-300" />
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Net worth</div>
            <div className="mt-1 font-mono text-lg font-semibold tabular-nums">
              {latest ? formatCurrency(latest.net, currency) : "—"}
            </div>
            <div className={`mt-0.5 inline-flex items-center gap-0.5 text-[11px] ${yoyChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {yoyChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {formatCurrency(Math.abs(yoyChange), currency, true)} ({Math.abs(yoyPct).toFixed(1)}%)
            </div>
          </div>
        </div>

        <ChartContainer config={config} className="mt-3 h-[220px] w-full aspect-auto">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="gAssets" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-assets)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-assets)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "currentColor", fillOpacity: 0.6 }} />
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
            <Area type="monotone" dataKey="assets" stroke="var(--color-assets)" strokeWidth={2} fill="url(#gAssets)" />
            <Line type="monotone" dataKey="liabilities" stroke="var(--color-liabilities)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="net" stroke="var(--color-net)" strokeWidth={2.5} dot={false} />
          </ComposedChart>
        </ChartContainer>

        {/* Snapshot table */}
        <div className="mt-3 max-h-[180px] overflow-y-auto rounded-lg border border-border/40">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card/95 backdrop-blur">
              <tr className="text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">Date</th>
                <th className="px-3 py-2 text-right font-medium">Assets</th>
                <th className="px-3 py-2 text-right font-medium">Liabilities</th>
                <th className="px-3 py-2 text-right font-medium">Net</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...sorted].reverse().map((s) => (
                <tr key={s.id} className="border-t border-border/30 hover:bg-muted/30">
                  <td className="px-3 py-1.5 text-muted-foreground">{formatDate(s.date, { year: "numeric", month: "short" })}</td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums text-emerald-300">{formatCurrency(s.assets, currency)}</td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums text-pink-300">{formatCurrency(s.liabilities, currency)}</td>
                  <td className={`px-3 py-1.5 text-right font-mono tabular-nums font-medium ${s.assets - s.liabilities >= 0 ? "text-sky-300" : "text-rose-300"}`}>
                    {formatCurrency(s.assets - s.liabilities, currency)}
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => openEdit(s)} aria-label="Edit snapshot"><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-rose-400" onClick={() => { if (confirm("Delete snapshot?")) { deleteNetWorth(s.id); toast.success("Snapshot removed"); } }} aria-label="Delete snapshot"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No snapshots yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Snapshot" : "Add Net Worth Snapshot"}</DialogTitle>
            <DialogDescription>Record total assets and liabilities at a point in time.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="nw-date">Date</Label>
              <Input id="nw-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="nw-asset">Assets ({currency})</Label>
                <Input id="nw-asset" inputMode="decimal" placeholder="28000" value={assets} onChange={(e) => setAssets(e.target.value.replace(/[^0-9.]/g, ""))} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="nw-liab">Liabilities ({currency})</Label>
                <Input id="nw-liab" inputMode="decimal" placeholder="23000" value={liabilities} onChange={(e) => setLiabilities(e.target.value.replace(/[^0-9.]/g, ""))} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-sky-500 text-sky-50 hover:bg-sky-400">{editing ? "Save" : "Add snapshot"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Mini({ label, value, color }: { label: string; value: number; color: string }) {
  const currency = useFinanceStore((s) => s.currency);
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono text-lg font-semibold tabular-nums ${color}`}>{formatCurrency(value, currency)}</div>
    </div>
  );
}
