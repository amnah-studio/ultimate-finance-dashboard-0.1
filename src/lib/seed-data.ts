// Seed data — a realistic year of personal finance activity for 2025.
// Generated deterministically so the dashboard is rich on first load.

import type { Transaction, SavingsGoal, DebtAccount, NetWorthSnapshot, TxType } from "./types";
import { uid } from "./format";

const MONTHS = 12;
const YEAR = 2025;

function dateStr(month: number, day: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${YEAR}-${mm}-${dd}`;
}

// Deterministic pseudo-random for stable seed data
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
const rng = seeded(20251105);

function jitter(base: number, pct: number): number {
  return Math.round((base * (1 + (rng() * 2 - 1) * pct)) / 1) * 1;
}

// Generate recurring monthly income (salary + occasional freelance/bonus)
function makeIncome(month: number): Transaction[] {
  const items: Transaction[] = [];
  // Salary on the 1st
  items.push({
    id: uid("tx"),
    type: "income",
    category: "Salary",
    description: "Monthly Salary",
    amount: jitter(4200, 0.04),
    date: dateStr(month, 1),
    recurring: true,
  });
  // Freelance roughly every other month
  if (month % 2 === 0) {
    items.push({
      id: uid("tx"),
      type: "income",
      category: "Freelance",
      description: "Freelance Project",
      amount: jitter(900, 0.2),
      date: dateStr(month, 14),
    });
  }
  // Bonus in March and December
  if (month === 3 || month === 12) {
    items.push({
      id: uid("tx"),
      type: "income",
      category: "Bonus",
      description: "Performance Bonus",
      amount: month === 3 ? 2200 : 3200,
      date: dateStr(month, 20),
    });
  }
  // Quarterly dividends
  if (month === 3 || month === 6 || month === 9 || month === 12) {
    items.push({
      id: uid("tx"),
      type: "income",
      category: "Dividends",
      description: "ETF Dividends",
      amount: jitter(220, 0.1),
      date: dateStr(month, 25),
    });
  }
  return items;
}

function makeExpenses(month: number): Transaction[] {
  const items: Transaction[] = [];
  const groceries = jitter(420, 0.1);
  items.push({ id: uid("tx"), type: "expense", category: "Groceries", description: "Weekly groceries", amount: groceries, date: dateStr(month, 5) });
  items.push({ id: uid("tx"), type: "expense", category: "Groceries", description: "Weekly groceries", amount: jitter(380, 0.1), date: dateStr(month, 12) });
  items.push({ id: uid("tx"), type: "expense", category: "Groceries", description: "Weekly groceries", amount: jitter(360, 0.1), date: dateStr(month, 19) });
  items.push({ id: uid("tx"), type: "expense", category: "Groceries", description: "Weekly groceries", amount: jitter(390, 0.1), date: dateStr(month, 26) });
  items.push({ id: uid("tx"), type: "expense", category: "Dining", description: "Restaurants", amount: jitter(260, 0.2), date: dateStr(month, 8) });
  items.push({ id: uid("tx"), type: "expense", category: "Transport", description: "Fuel & rideshare", amount: jitter(180, 0.15), date: dateStr(month, 10) });
  items.push({ id: uid("tx"), type: "expense", category: "Entertainment", description: "Movies & events", amount: jitter(140, 0.3), date: dateStr(month, 15) });
  items.push({ id: uid("tx"), type: "expense", category: "Shopping", description: "Household items", amount: jitter(220, 0.25), date: dateStr(month, 18) });
  items.push({ id: uid("tx"), type: "expense", category: "Health", description: "Pharmacy", amount: jitter(70, 0.4), date: dateStr(month, 22) });
  return items;
}

function makeBills(month: number): Transaction[] {
  const items: Transaction[] = [];
  items.push({ id: uid("tx"), type: "bill", category: "Rent", description: "Apartment rent", amount: 1500, date: dateStr(month, 1), recurring: true });
  items.push({ id: uid("tx"), type: "bill", category: "Utilities", description: "Electricity & water", amount: jitter(140, 0.15), date: dateStr(month, 6), recurring: true });
  items.push({ id: uid("tx"), type: "bill", category: "Internet", description: "Fiber internet", amount: 70, date: dateStr(month, 6), recurring: true });
  items.push({ id: uid("tx"), type: "bill", category: "Phone", description: "Mobile plan", amount: 60, date: dateStr(month, 7), recurring: true });
  items.push({ id: uid("tx"), type: "bill", category: "Insurance", description: "Health insurance", amount: 220, date: dateStr(month, 8), recurring: true });
  items.push({ id: uid("tx"), type: "bill", category: "Streaming", description: "Streaming bundle", amount: 45, date: dateStr(month, 9), recurring: true });
  return items;
}

function makeDebt(month: number): Transaction[] {
  // Credit card minimum + personal loan payment
  return [
    { id: uid("tx"), type: "debt", category: "Credit Card", description: "Visa minimum payment", amount: jitter(160, 0.1), date: dateStr(month, 12), recurring: true },
    { id: uid("tx"), type: "debt", category: "Personal Loan", description: "Loan installment", amount: 240, date: dateStr(month, 13), recurring: true },
  ];
}

function makeSavings(month: number): Transaction[] {
  return [
    { id: uid("tx"), type: "savings", category: "Emergency Fund", description: "Auto-save transfer", amount: 300, date: dateStr(month, 2), recurring: true },
    { id: uid("tx"), type: "savings", category: "Vacation", description: "Vacation fund", amount: 150, date: dateStr(month, 3), recurring: true },
    { id: uid("tx"), type: "savings", category: "Retirement", description: "IRA contribution", amount: 250, date: dateStr(month, 16), recurring: true },
  ];
}

function makeInvestments(month: number): Transaction[] {
  const items: Transaction[] = [];
  items.push({ id: uid("tx"), type: "investment", category: "ETF", description: "Index ETF buy", amount: 400, date: dateStr(month, 5), recurring: true });
  if (month % 3 === 0) {
    items.push({ id: uid("tx"), type: "investment", category: "Stocks", description: "Individual stock buy", amount: jitter(220, 0.2), date: dateStr(month, 20) });
  }
  return items;
}

export function buildSeedTransactions(): Transaction[] {
  const out: Transaction[] = [];
  for (let m = 1; m <= MONTHS; m++) {
    out.push(...makeIncome(m));
    out.push(...makeExpenses(m));
    out.push(...makeBills(m));
    out.push(...makeDebt(m));
    out.push(...makeSavings(m));
    out.push(...makeInvestments(m));
  }
  return out;
}

export function buildSeedSavingsGoals(): SavingsGoal[] {
  return [
    { id: uid("g"), name: "Emergency Fund", target: 10000, saved: 6200, color: "#34d399", dueDate: `${YEAR}-12-31` },
    { id: uid("g"), name: "Japan Vacation", target: 4500, saved: 2350, color: "#fb923c", dueDate: `${YEAR}-10-01` },
    { id: uid("g"), name: "New Laptop", target: 2200, saved: 1700, color: "#60a5fa", dueDate: `${YEAR}-08-15` },
    { id: uid("g"), name: "House Down Payment", target: 40000, saved: 11800, color: "#a78bfa", dueDate: `${YEAR + 2}-06-30` },
  ];
}

export function buildSeedDebts(): DebtAccount[] {
  return [
    { id: uid("d"), name: "Visa Platinum", balance: 3850, minPayment: 160, apr: 19.99, type: "credit" },
    { id: uid("d"), name: "Personal Loan", balance: 6400, minPayment: 240, apr: 11.5, type: "loan" },
    { id: uid("d"), name: "Student Loan", balance: 12400, minPayment: 220, apr: 6.8, type: "loan" },
    { id: uid("d"), name: "Apple Card", balance: 720, minPayment: 35, apr: 22.9, type: "credit" },
  ];
}

// Net worth progression — assets grow with net income; liabilities shrink with principal paid.
export function buildSeedNetWorth(transactions: Transaction[]): NetWorthSnapshot[] {
  const out: NetWorthSnapshot[] = [];
  let assets = 42000;
  let liabilities = 23370;
  const byType: Record<TxType, number> = { income: 0, expense: 0, bill: 0, debt: 0, savings: 0, investment: 0 };
  for (let m = 1; m <= MONTHS; m++) {
    byType.income = 0; byType.expense = 0; byType.bill = 0; byType.debt = 0; byType.savings = 0; byType.investment = 0;
    for (const t of transactions) {
      if (Number(t.date.slice(5, 7)) !== m) continue;
      byType[t.type] += t.amount;
    }
    // Cash flow impact: income in, expenses/bills/debt payments out.
    // (Savings & investments remain on the asset side — money just moved accounts.)
    const cashFlow = byType.income - byType.expense - byType.bill - byType.debt;
    assets += Math.round(cashFlow);
    // Roughly 65% of debt payment goes to principal (the rest is interest).
    const principal = Math.round(byType.debt * 0.65);
    liabilities = Math.max(0, liabilities - principal);
    out.push({ id: uid("nw"), date: dateStr(m, new Date(YEAR, m, 0).getDate()), assets: Math.round(assets), liabilities: Math.round(liabilities) });
  }
  return out;
}
