// Security utilities for input sanitization and validation
import { z } from 'zod';

// Input sanitization functions
export function sanitizeText(input: string, maxLength: number = 500): string {
  if (typeof input !== 'string') return '';
  
  // Remove potentially dangerous characters and limit length
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>\"'&]/g, '') // Remove basic XSS characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

export function sanitizeCategory(category: string): string {
  if (typeof category !== 'string') return '';
  
  // Allow alphanumeric, spaces, hyphens, and underscores only
  return category
    .trim()
    .slice(0, 50)
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .replace(/\s+/g, ' ');
}

export function sanitizeAmount(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Only allow digits, decimal points, and commas
  return input.replace(/[^\d.,]/g, '').slice(0, 20);
}

// Schema validation for stored data
export const ExpenseSchema = z.object({
  id: z.string().uuid(),
  amountCents: z.number().int().min(1).max(100000000), // Max €1M
  currency: z.string().length(3).regex(/^[A-Z]{3}$/),
  category: z.string().min(1).max(50),
  note: z.string().max(500).optional(),
  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMethod: z.string().max(50).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const BudgetSchema = z.object({
  id: z.string().uuid(),
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/),
  category: z.string().max(50).optional(),
  limitCents: z.number().int().min(0).max(100000000),
});

export const SettingsSchema = z.object({
  currency: z.string().length(3).regex(/^[A-Z]{3}$/),
  categories: z.array(z.string().min(1).max(50)).max(20),
  monthlyBudget: z.number().int().min(0).max(100000000).optional(),
});

// Data validation with graceful fallbacks
export function validateExpenseData(data: any): boolean {
  try {
    if (!Array.isArray(data)) return false;
    
    for (const expense of data) {
      const result = ExpenseSchema.safeParse(expense);
      if (!result.success) {
        console.warn('Invalid expense data detected and filtered out');
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function validateBudgetData(data: any): boolean {
  try {
    if (!Array.isArray(data)) return false;
    
    for (const budget of data) {
      const result = BudgetSchema.safeParse(budget);
      if (!result.success) {
        console.warn('Invalid budget data detected and filtered out');
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function validateSettingsData(data: any): boolean {
  try {
    const result = SettingsSchema.safeParse(data);
    if (!result.success) {
      console.warn('Invalid settings data detected');
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Secure localStorage operations
export function secureLocalStorageGet(key: string): any | null {
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    return parsed;
  } catch (error) {
    console.warn(`Failed to read localStorage key: ${key}`);
    return null;
  }
}

export function secureLocalStorageSet(key: string, value: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Failed to write to localStorage - storage may be full');
    return false;
  }
}

// Rate limiting for operations (simple implementation)
const operationCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(operation: string, maxOps: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = operation;
  
  const current = operationCounts.get(key);
  
  if (!current || now > current.resetTime) {
    operationCounts.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxOps) {
    return false;
  }
  
  current.count++;
  return true;
}