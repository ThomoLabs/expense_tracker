import { Expense, Budget } from '@/types/expense';
import { 
  sanitizeText, 
  sanitizeCategory, 
  validateExpenseData, 
  validateBudgetData, 
  validateSettingsData,
  secureLocalStorageGet,
  secureLocalStorageSet,
  checkRateLimit
} from './security';

const EXPENSES_KEY = 'expenses';
const BUDGETS_KEY = 'budgets';
const SETTINGS_KEY = 'settings';

export interface Category {
  id: string;
  name: string;
  color?: string;
}

export interface UserPreferences {
  currency: string;
  theme: 'system' | 'light' | 'dark';
  monthlyBudgetCents: number;
  categories: Category[];
  lastUpdated: string;
}

export interface Settings {
  currency: string;
  categories: string[];
  monthlyBudget?: number; // in cents
  theme?: 'system' | 'light' | 'dark';
}

export const defaultSettings: Settings = {
  currency: 'EUR',
  categories: ['Food', 'Groceries', 'Transport', 'Bills', 'Entertainment', 'Health', 'Shopping', 'Other'],
  theme: 'system',
};

export const defaultUserPreferences: UserPreferences = {
  currency: 'EUR',
  theme: 'system',
  monthlyBudgetCents: 0,
  categories: [
    { id: '1', name: 'Food', color: '#ef4444' },
    { id: '2', name: 'Groceries', color: '#f97316' },
    { id: '3', name: 'Transport', color: '#eab308' },
    { id: '4', name: 'Bills', color: '#22c55e' },
    { id: '5', name: 'Entertainment', color: '#3b82f6' },
    { id: '6', name: 'Health', color: '#8b5cf6' },
    { id: '7', name: 'Shopping', color: '#ec4899' },
    { id: '8', name: 'Other', color: '#6b7280' },
  ],
  lastUpdated: new Date().toISOString(),
};

// Expenses
export function getExpenses(): Expense[] {
  try {
    const stored = secureLocalStorageGet(EXPENSES_KEY);
    if (!stored) return [];
    
    // Validate data integrity
    if (!validateExpenseData(stored)) {
      console.warn('Invalid expense data detected, returning empty array');
      return [];
    }
    
    return stored;
  } catch (error) {
    console.error('Failed to load expenses:', error);
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  if (!checkRateLimit('saveExpenses', 50)) {
    throw new Error('Too many save operations, please wait');
  }
  
  if (!validateExpenseData(expenses)) {
    throw new Error('Invalid expense data cannot be saved');
  }
  
  const success = secureLocalStorageSet(EXPENSES_KEY, expenses);
  if (!success) {
    throw new Error('Failed to save expenses - storage may be full');
  }
}

export function addExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Expense {
  if (!checkRateLimit('addExpense', 100)) {
    throw new Error('Too many operations, please wait');
  }
  
  const expenses = getExpenses();
  const now = new Date().toISOString();
  
  // Sanitize input data
  const sanitizedExpense = {
    ...expense,
    category: sanitizeCategory(expense.category),
    note: expense.note ? sanitizeText(expense.note, 500) : undefined,
    paymentMethod: expense.paymentMethod ? sanitizeText(expense.paymentMethod, 50) : undefined,
  };
  
  const newExpense: Expense = {
    ...sanitizedExpense,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  
  expenses.push(newExpense);
  saveExpenses(expenses);
  return newExpense;
}

export function updateExpense(id: string, updates: Partial<Expense>): Expense | null {
  if (!checkRateLimit('updateExpense', 100)) {
    throw new Error('Too many operations, please wait');
  }
  
  const expenses = getExpenses();
  const index = expenses.findIndex(e => e.id === id);
  
  if (index === -1) return null;
  
  // Sanitize update data
  const sanitizedUpdates = {
    ...updates,
    category: updates.category ? sanitizeCategory(updates.category) : undefined,
    note: updates.note ? sanitizeText(updates.note, 500) : undefined,
    paymentMethod: updates.paymentMethod ? sanitizeText(updates.paymentMethod, 50) : undefined,
  };
  
  const updatedExpense = {
    ...expenses[index],
    ...sanitizedUpdates,
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
    const stored = secureLocalStorageGet(BUDGETS_KEY);
    if (!stored) return [];
    
    if (!validateBudgetData(stored)) {
      console.warn('Invalid budget data detected, returning empty array');
      return [];
    }
    
    return stored;
  } catch (error) {
    console.error('Failed to load budgets:', error);
    return [];
  }
}

export function saveBudgets(budgets: Budget[]): void {
  if (!validateBudgetData(budgets)) {
    throw new Error('Invalid budget data cannot be saved');
  }
  
  const success = secureLocalStorageSet(BUDGETS_KEY, budgets);
  if (!success) {
    throw new Error('Failed to save budgets - storage may be full');
  }
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
    const stored = secureLocalStorageGet(SETTINGS_KEY);
    if (!stored) return defaultSettings;
    
    const merged = { ...defaultSettings, ...stored };
    
    if (!validateSettingsData(merged)) {
      console.warn('Invalid settings data detected, using defaults');
      return defaultSettings;
    }
    
    return merged;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return defaultSettings;
  }
}

export function saveSettings(settings: Partial<Settings>): void {
  const current = getSettings();
  
  // Sanitize categories if provided
  const sanitizedSettings = {
    ...settings,
    categories: settings.categories?.map(cat => sanitizeCategory(cat)).filter(Boolean),
  };
  
  const updated = { ...current, ...sanitizedSettings };
  
  if (!validateSettingsData(updated)) {
    throw new Error('Invalid settings data cannot be saved');
  }
  
  const success = secureLocalStorageSet(SETTINGS_KEY, updated);
  if (!success) {
    throw new Error('Failed to save settings - storage may be full');
  }
}

// Legacy function for backward compatibility
export const saveSettingsLegacy = (settings: Settings) => {
  localStorage.setItem('expense-tracker-settings', JSON.stringify(settings));
};

export const saveUserPreferences = (prefs: Omit<UserPreferences, 'lastUpdated'>) => {
  const payload: UserPreferences = {
    ...prefs,
    lastUpdated: new Date().toISOString(),
  };
  localStorage.setItem('expensesTracker.settings', JSON.stringify(payload));
};

export const loadUserPreferences = (): UserPreferences | null => {
  const data = localStorage.getItem('expensesTracker.settings');
  return data ? JSON.parse(data) : null;
};

// Convert old Settings format to new UserPreferences format
export function convertSettingsToUserPreferences(settings: Settings): UserPreferences {
  return {
    currency: settings.currency,
    theme: settings.theme || 'system',
    monthlyBudgetCents: settings.monthlyBudget || 0,
    categories: settings.categories.map((name, index) => ({
      id: (index + 1).toString(),
      name,
      color: defaultUserPreferences.categories[index]?.color || '#6b7280'
    })),
    lastUpdated: new Date().toISOString(),
  };
}

// Get user preferences, converting from old format if necessary
export function getUserPreferences(): UserPreferences {
  // Try to load new format first
  const newPrefs = loadUserPreferences();
  if (newPrefs) return newPrefs;
  
  // Fall back to old format and convert
  const oldSettings = getSettings();
  const converted = convertSettingsToUserPreferences(oldSettings);
  
  // Save in new format for next time
  saveUserPreferences(converted);
  
  return converted;
}