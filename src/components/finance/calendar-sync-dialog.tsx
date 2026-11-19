"use client";

import { useState } from "react";
import { CalendarSync, Download, Upload, FileText, Check, AlertTriangle, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { generateICS, parseICS, eventsToTransactions, downloadICS, type ParsedEvent } from "@/lib/ics";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const HORIZONS = [
  { value: "3",  label: "3 months ahead" },
  { value: "6",  label: "6 months ahead" },
  { value: "12", label: "12 months ahead" },
  { value: "24", label: "24 months ahead" },
];

export function CalendarSyncDialog({ open, onOpenChange }: Props) {
  const transactions = useFinanceStore((s) => s.transactions);
  const addTransaction = useFinanceStore((s) => s.addTransaction);

  const [horizon, setHorizon] = useState<string>("12");
  const [includeAll, setIncludeAll] = useState(false);

  // Import state
  const [parsedEvents, setParsedEvents] = useState<ParsedEvent[] | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");

  const recurringCount = transactions.filter(
    (t) => t.recurring || ["bill", "debt", "savings", "investment"].includes(t.type)
  ).length;

  const handleExport = () => {
    const months = Number(horizon);
    const ics = generateICS(transactions, { monthsAhead: months, includeAll });
    const stamp = new Date().toISOString().slice(0, 10);
    downloadICS(ics, `ultimate-finance-${stamp}.ics`);
    toast.success("Calendar file exported");
    onOpenChange(false);
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    try {
      const text = await file.text();
      const { events, errors } = parseICS(text);
      setParsedEvents(events);
      setImportErrors(errors);
      if (events.length === 0 && errors.length === 0) {
        setImportErrors(["No VEVENT entries found in this file."]);
      }
    } catch (e) {
      setImportErrors([`Could not read file: ${(e as Error).message}`]);
      setParsedEvents(null);
    }
  };

  const handleImport = () => {
    if (!parsedEvents || parsedEvents.length === 0) {
      toast.error("Nothing to import");
      return;
    }
    const drafts = eventsToTransactions(parsedEvents).filter((d) => d.amount > 0);
    if (drafts.length === 0) {
      toast.error("No events with a parseable amount were found.");
      return;
    }
    drafts.forEach((d) => addTransaction(d));
    toast.success(`${drafts.length} transaction${drafts.length === 1 ? "" : "s"} imported from ${fileName}`);
    setParsedEvents(null);
    setFileName("");
    setImportErrors([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarSync className="h-5 w-5 text-emerald-500" /> Calendar Sync
          </DialogTitle>
          <DialogDescription>
            Export upcoming bills, debt payments, savings & investments as an iCalendar (.ics) file you
            can subscribe to in Google Calendar, Apple Calendar, or Outlook. Import a .ics file to
            convert calendar events into transactions.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* EXPORT */}
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-emerald-500/15 text-emerald-500">
                <Download className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Export to .ics</div>
                <div className="text-[11px] text-muted-foreground">
                  {recurringCount} recurring source transaction{recurringCount === 1 ? "" : "s"}
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-2.5">
              <div className="grid gap-1.5">
                <Label htmlFor="horizon">Projection horizon</Label>
                <Select value={horizon} onValueChange={setHorizon}>
                  <SelectTrigger id="horizon" className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HORIZONS.map((h) => (
                      <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2">
                <div>
                  <div className="text-xs font-medium">Include income & one-off transactions</div>
                  <div className="text-[11px] text-muted-foreground">
                    Otherwise only bills, debt, savings & investments
                  </div>
                </div>
                <Switch checked={includeAll} onCheckedChange={setIncludeAll} aria-label="Include all transactions" />
              </div>

              <Button
                size="sm"
                className="w-full gap-1.5 bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                onClick={handleExport}
              >
                <Download className="h-4 w-4" /> Download .ics file
              </Button>
            </div>
          </div>

          {/* IMPORT */}
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-sky-500/15 text-sky-500">
                <Upload className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Import from .ics</div>
                <div className="text-[11px] text-muted-foreground">
                  Parse a calendar file and add events as transactions
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-2.5">
              <label
                htmlFor="ics-upload"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border/60 px-3 py-3 text-xs text-muted-foreground hover:border-emerald-500/40 hover:text-foreground transition"
              >
                <FileText className="h-4 w-4" />
                {fileName || "Choose a .ics file to import"}
                <input
                  id="ics-upload"
                  type="file"
                  accept=".ics,text/calendar"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                  }}
                />
              </label>

              {parsedEvents && parsedEvents.length > 0 && (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    {parsedEvents.length} event{parsedEvents.length === 1 ? "" : "s"} parsed
                  </div>
                  <div className="mt-1.5 max-h-32 overflow-y-auto text-[11px]">
                    {parsedEvents.slice(0, 6).map((e) => (
                      <div key={e.uid} className="flex items-center gap-1.5 py-0.5">
                        <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{e.start}</span>
                        <span className="truncate">{e.summary}</span>
                      </div>
                    ))}
                    {parsedEvents.length > 6 && (
                      <div className="pt-0.5 text-muted-foreground">… and {parsedEvents.length - 6} more</div>
                    )}
                  </div>
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {importErrors.length} issue{importErrors.length === 1 ? "" : "s"}
                  </div>
                  <ul className="mt-1 list-disc pl-4 text-[11px] text-amber-600/90 dark:text-amber-400/90">
                    {importErrors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}

              {parsedEvents && parsedEvents.length > 0 && (
                <Button
                  size="sm"
                  className="w-full gap-1.5 bg-sky-500 text-sky-50 hover:bg-sky-400"
                  onClick={handleImport}
                >
                  <Check className="h-4 w-4" /> Import {parsedEvents.filter(e => /\$|€|£|\d/.test(e.summary + e.description)).length} transaction(s)
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
