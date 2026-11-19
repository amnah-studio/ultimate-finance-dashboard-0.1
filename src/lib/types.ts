// Core domain types for the Ultimate Personal Finance Dashboard

export type TxType = "income" | "expense" | "bill" | "debt" | "savings" | "investment";

export interface Transaction {
  id: string;
  type: TxType;
  category: string;
  description: string;
  amount: number; // always positive; sign implied by type
  date: string; // ISO yyyy-mm-dd
  recurring?: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  dueDate?: string; // ISO yyyy-mm-dd
  color?: string;
}

export interface DebtAccount {
  id: string;
  name: string;
  balance: number;
  minPayment: number;
  apr: number; // annual percentage rate, e.g. 19.99
  type?: "credit" | "loan" | "mortgage" | "other";
}

export interface NetWorthSnapshot {
  id: string;
  date: string; // ISO yyyy-mm-dd (end of month)
  assets: number;
  liabilities: number;
}

export interface DashboardState {
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  debts: DebtAccount[];
  netWorth: NetWorthSnapshot[];
  currency: string;
  version: number;
}

export const TX_TYPES: { key: TxType; label: string; color: string; sign: 1 | -1 }[] = [
  { key: "income", label: "Income", color: "#34d399", sign: 1 },
  { key: "expense", label: "Expenses", color: "#f87171", sign: -1 },
  { key: "bill", label: "Bills", color: "#fb923c", sign: -1 },
  { key: "debt", label: "Debt", color: "#f472b6", sign: -1 },
  { key: "savings", label: "Savings", color: "#60a5fa", sign: -1 },
  { key: "investment", label: "Investments", color: "#a78bfa", sign: -1 },
];

export const INCOME_CATEGORIES = ["Salary", "Freelance", "Bonus", "Dividends", "Refund", "Other Income"];
export const EXPENSE_CATEGORIES = ["Groceries", "Dining", "Transport", "Entertainment", "Shopping", "Health", "Subscriptions", "Other"];
export const BILL_CATEGORIES = ["Rent", "Utilities", "Internet", "Phone", "Insurance", "Streaming"];
export const DEBT_CATEGORIES = ["Credit Card", "Student Loan", "Personal Loan", "Mortgage"];
export const SAVINGS_CATEGORIES = ["Emergency Fund", "Vacation", "Car", "House", "Retirement"];
export const INVESTMENT_CATEGORIES = ["Stocks", "ETF", "Crypto", "Bonds", "Retirement"];
