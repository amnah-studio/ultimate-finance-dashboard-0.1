"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinanceStore } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/format";
import { TX_TYPES, type TxType, type Transaction } from "@/lib/types";
import { TransactionDialog } from "./transaction-dialog";
import { cn } from "@/lib/utils";

const TYPE_COLOR: Record<TxType, string> = {
  income: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  expense: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  bill: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  debt: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  savings: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  investment: "bg-violet-500/15 text-violet-300 border-violet-500/30",
};

export function TransactionsTable() {
  const txs = useFinanceStore((s) => s.transactions);
  const year = useFinanceStore((s) => s.selectedYear);
  const currency = useFinanceStore((s) => s.currency);
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);

  const [filterType, setFilterType] = useState<TxType | "all">("all");
  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    return txs
      .filter((t) => Number(t.date.slice(0, 4)) === year)
      .filter((t) => (filterType === "all" ? true : t.type === filterType))
      .filter((t) =>
        search.trim() === ""
          ? true
          : (t.description + " " + t.category).toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [txs, year, filterType, search]);

  return (
    <Card className="card-glow border-border/60">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Transactions</CardTitle>
            <CardDescription>
              {filtered.length} records — {year}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-[140px] pl-8 text-xs"
              />
            </div>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as TxType | "all")}>
              <SelectTrigger className="h-8 w-[120px] text-xs" aria-label="Filter by type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {TX_TYPES.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="default"
              className="h-8 gap-1.5 bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
              onClick={() => {
                setEditing(null);
                setOpenDialog(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="max-h-[420px] overflow-y-auto rounded-lg border border-border/40">
          <Table className="text-xs">
            <TableHeader className="sticky top-0 bg-card/95 backdrop-blur z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 text-muted-foreground">Date</TableHead>
                <TableHead className="h-9 text-muted-foreground">Type</TableHead>
                <TableHead className="h-9 text-muted-foreground">Category</TableHead>
                <TableHead className="h-9 text-muted-foreground">Description</TableHead>
                <TableHead className="h-9 text-right text-muted-foreground">Amount</TableHead>
                <TableHead className="h-9 text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id} className="border-border/30 hover:bg-muted/30">
                  <TableCell className="py-2 whitespace-nowrap text-muted-foreground">{formatDate(t.date)}</TableCell>
                  <TableCell className="py-2">
                    <Badge variant="outline" className={cn("border px-1.5 py-0 text-[10px] font-medium", TYPE_COLOR[t.type])}>
                      {TX_TYPES.find((x) => x.key === t.type)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 whitespace-nowrap">{t.category}</TableCell>
                  <TableCell className="py-2">
                    <span className="text-foreground/90">{t.description}</span>
                    {t.recurring && (
                      <span className="ml-1.5 inline-flex items-center rounded bg-muted/60 px-1 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
                        recurring
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-2 text-right font-mono tabular-nums">
                    <span className={cn(t.type === "income" ? "text-emerald-300" : "text-rose-300")}>
                      {t.type === "income" ? "+" : "−"}{formatCurrency(t.amount, currency)}
                    </span>
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setEditing(t);
                          setOpenDialog(true);
                        }}
                        aria-label="Edit transaction"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-rose-400"
                        onClick={() => {
                          if (confirm("Delete this transaction?")) deleteTransaction(t.id);
                        }}
                        aria-label="Delete transaction"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No transactions match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <TransactionDialog open={openDialog} onOpenChange={setOpenDialog} editing={editing} />
    </Card>
  );
}
