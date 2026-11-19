"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useFinanceStore } from "@/lib/store";
import { TX_TYPES, type TxType, type Transaction } from "@/lib/types";
import { toast } from "sonner";

const CATEGORY_MAP: Record<TxType, string[]> = {
  income: ["Salary", "Freelance", "Bonus", "Dividends", "Refund", "Other Income"],
  expense: ["Groceries", "Dining", "Transport", "Entertainment", "Shopping", "Health", "Subscriptions", "Other"],
  bill: ["Rent", "Utilities", "Internet", "Phone", "Insurance", "Streaming"],
  debt: ["Credit Card", "Student Loan", "Personal Loan", "Mortgage"],
  savings: ["Emergency Fund", "Vacation", "Car", "House", "Retirement"],
  investment: ["Stocks", "ETF", "Crypto", "Bonds", "Retirement"],
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Transaction | null;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function FormBody({ editing, onClose }: { editing: Transaction | null; onClose: () => void }) {
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const updateTransaction = useFinanceStore((s) => s.updateTransaction);
  const selectedYear = useFinanceStore((s) => s.selectedYear);

  const [type, setType] = useState<TxType>(editing?.type ?? "expense");
  const [category, setCategory] = useState<string>(
    editing?.category ?? CATEGORY_MAP["expense"][0]
  );
  const [description, setDescription] = useState(editing?.description ?? "");
  const [amount, setAmount] = useState<string>(editing ? String(editing.amount) : "");
  const [date, setDate] = useState<string>(editing?.date ?? `${selectedYear}-${todayISO().slice(5)}`);
  const [recurring, setRecurring] = useState<boolean>(!!editing?.recurring);

  const canSave = () => {
    const n = Number(amount);
    return (
      n > 0 &&
      description.trim() !== "" &&
      category !== "" &&
      /^\d{4}-\d{2}-\d{2}$/.test(date)
    );
  };

  const handleSave = () => {
    if (!canSave()) {
      toast.error("Please fill in a valid amount, category, description and date.");
      return;
    }
    const payload = {
      type,
      category,
      description: description.trim(),
      amount: Math.abs(Number(amount)),
      date,
      recurring,
    };
    if (editing) {
      updateTransaction(editing.id, payload);
      toast.success("Transaction updated");
    } else {
      addTransaction(payload);
      toast.success("Transaction added");
    }
    onClose();
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{editing ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
        <DialogDescription>
          Record income, expenses, bills, debt payments, savings or investments.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3 py-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="t-type">Type</Label>
            <Select value={type} onValueChange={(v) => {
              setType(v as TxType);
              setCategory(CATEGORY_MAP[v as TxType][0]);
            }}>
              <SelectTrigger id="t-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TX_TYPES.map((t) => (
                  <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="t-cat">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="t-cat"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORY_MAP[type].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="t-desc">Description</Label>
          <Input
            id="t-desc"
            placeholder="e.g. Monthly rent payment"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="t-amt">Amount (USD)</Label>
            <Input
              id="t-amt"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="t-date">Date</Label>
            <Input
              id="t-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
          <div>
            <div className="text-sm font-medium">Recurring</div>
            <div className="text-xs text-muted-foreground">Mark if this repeats monthly</div>
          </div>
          <Switch checked={recurring} onCheckedChange={setRecurring} aria-label="Recurring" />
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
          {editing ? "Save changes" : "Add transaction"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function TransactionDialog({ open, onOpenChange, editing }: Props) {
  // Use `key` to remount the FormBody whenever the dialog is (re)opened.
  // This avoids setState-in-effect and gives a clean fresh form each time.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <FormBody key={`${editing?.id ?? "new"}-${open}`} editing={editing} onClose={() => onOpenChange(false)} />}
    </Dialog>
  );
}
