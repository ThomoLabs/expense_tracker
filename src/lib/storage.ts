import { Expense, Budget } from '@/types/expense';

const EXPENSES_KEY = 'expenses';
const BUDGETS_KEY = 'budgets';
const SETTINGS_KEY = 'settings';

export interface Settings {
  currency: string;
  categories: string[];
  monthlyBudget?: number; // in cents
}

export const defaultSettings: Settings = {
  currency: 'EUR',
  categories: ['Food', 'Groceries', 'Transport', 'Bills', 'Entertainment', 'Health', 'Shopping', 'Other'],
};

// Expenses
export function getExpenses(): Expense[] {
  try {
    const stored = localStorage.getItem(EXPENSES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

export function addExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Expense {
  const expenses = getExpenses();
  const now = new Date().toISOString();
  const newExpense: Expense = {
    ...expense,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  
  expenses.push(newExpense);
  saveExpenses(expenses);
  return newExpense;
}

export function updateExpense(id: string, updates: Partial<Expense>): Expense | null {
  const expenses = getExpenses();
  const index = expenses.findIndex(e => e.id === id);
  
  if (index === -1) return null;
  
  const updatedExpense = {
    ...expenses[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  expenses[index] = updatedExpense;
  saveExpenses(expenses);
  return updatedExpense;
}

export function deleteExpense(id: string): boolean {
  const expenses = getExpenses();
  const filtered = expenses.filter(e => e.id !== id);
  
  if (filtered.length === expenses.length) return false;
  
  saveExpenses(filtered);
  return true;
}

// Budgets
export function getBudgets(): Budget[] {
  try {
    const stored = localStorage.getItem(BUDGETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveBudgets(budgets: Budget[]): void {
  localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
}

export function setBudget(yearMonth: string, limitCents: number, category?: string): Budget {
  const budgets = getBudgets();
  const existingIndex = budgets.findIndex(b => 
    b.yearMonth === yearMonth && b.category === category
  );
  
  const budget: Budget = {
    id: existingIndex >= 0 ? budgets[existingIndex].id : crypto.randomUUID(),
    yearMonth,
    category,
    limitCents,
  };
  
  if (existingIndex >= 0) {
    budgets[existingIndex] = budget;
  } else {
    budgets.push(budget);
  }
  
  saveBudgets(budgets);
  return budget;
}

// Settings
export function getSettings(): Settings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: Partial<Settings>): void {
  const current = getSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
}