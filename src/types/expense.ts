export interface Expense {
  id: string;
  amountCents: number;
  currency: string;
  category: string;
  note?: string;
  paidAt: string; // ISO date string
  paymentMethod?: string;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

export interface Budget {
  id: string;
  yearMonth: string; // YYYY-MM format
  category?: string;
  limitCents: number;
}

export interface CategoryTotal {
  category: string;
  totalCents: number;
  expenseCount: number;
}

export const DEFAULT_CATEGORIES = [
  'Food',
  'Groceries',
  'Transport',
  'Bills',
  'Entertainment',
  'Health',
  'Shopping',
  'Other'
] as const;

export const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Mobile Payment',
  'Other'
] as const;

export type Category = typeof DEFAULT_CATEGORIES[number];
export type PaymentMethod = typeof PAYMENT_METHODS[number];