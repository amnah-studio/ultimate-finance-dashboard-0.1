"use client";

import { useState } from "react";
import { CalendarSync, Moon, Plus, RotateCcw, Sparkles, Sun, Wallet } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinanceStore } from "@/lib/store";
import { toast } from "sonner";
import { CalendarSyncDialog } from "./calendar-sync-dialog";

interface HeaderProps {
  onAddTransaction: () => void;
}

// Years from 2023 to 2070 inclusive (48 entries)
const YEARS = Array.from({ length: 2070 - 2023 + 1 }, (_, i) => 2023 + i);

export function Header({ onAddTransaction }: HeaderProps) {
  const selectedYear = useFinanceStore((s) => s.selectedYear);
  const setSelectedYear = useFinanceStore((s) => s.setSelectedYear);
  const resetAll = useFinanceStore((s) => s.resetAll);
  const { setTheme } = useTheme();
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 -mx-4 px-4 py-4 backdrop-blur-md bg-background/70 border-b border-border/60 sm:-mx-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-emerald-950 shadow-lg shadow-emerald-500/20">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Ultimate Finance
              </h1>
              <span className="hidden rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-300 sm:inline-flex sm:items-center sm:gap-1">
                <Sparkles className="h-3 w-3" /> Live
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Track income, expenses, savings, debt & net worth
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Year selector — 2023 → 2070 */}
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[110px]" aria-label="Select year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[280px]">
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Calendar sync */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCalendarOpen(true)}
            className="gap-1.5"
            aria-label="Calendar sync"
          >
            <CalendarSync className="h-4 w-4" />
            <span className="hidden md:inline">Calendar</span>
          </Button>

          {/* Theme toggle — CSS-only icon swap (no hydration mismatch) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark")}
            className="theme-toggle gap-1.5"
            aria-label="Toggle light or dark theme"
            suppressHydrationWarning
          >
            <Sun data-sun className="h-4 w-4" />
            <Moon data-moon className="h-4 w-4" />
            <span className="hidden sm:inline" suppressHydrationWarning>
              <span className="dark:hidden">Light</span>
              <span className="hidden dark:inline">Dark</span>
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm("Reset all data back to the demo seed? This cannot be undone.")) {
                resetAll();
                toast.success("Dashboard reset to demo data");
              }
            }}
            className="gap-1.5"
            aria-label="Reset to demo data"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>

          <Button size="sm" onClick={onAddTransaction} className="gap-1.5 bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Transaction</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <CalendarSyncDialog open={calendarOpen} onOpenChange={setCalendarOpen} />
    </header>
  );
}
