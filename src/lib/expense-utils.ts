import { Expense, CategoryTotal } from '@/types/expense';
import { sanitizeAmount } from './security';

export function formatCurrency(amountCents: number, currency: string = 'EUR'): string {
  const amount = amountCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function parseCurrency(input: string): number {
  // Sanitize input first
  const sanitized = sanitizeAmount(input);
  const normalized = sanitized.replace(',', '.');
  const amount = parseFloat(normalized) || 0;
  
  // Validate reasonable amount limits (max €1M)
  if (amount < 0 || amount > 1000000) {
    throw new Error('Amount must be between 0 and €1,000,000');
  }
  
  return Math.round(amount * 100); // Convert to cents
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthRange(yearMonth: string): { start: string; end: string } {
  const [year, month] = yearMonth.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month
  
  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0]
  };
}

export function getExpensesForMonth(expenses: Expense[], yearMonth: string): Expense[] {
  const { start, end } = getMonthRange(yearMonth);
  return expenses.filter(expense => 
    expense.paidAt >= start && expense.paidAt <= end
  );
}

export function calculateCategoryTotals(expenses: Expense[]): CategoryTotal[] {
  const totals = new Map<string, { totalCents: number; expenseCount: number }>();
  
  expenses.forEach(expense => {
    const current = totals.get(expense.category) || { totalCents: 0, expenseCount: 0 };
    totals.set(expense.category, {
      totalCents: current.totalCents + expense.amountCents,
      expenseCount: current.expenseCount + 1
    });
  });
  
  return Array.from(totals.entries()).map(([category, data]) => ({
    category,
    ...data
  })).sort((a, b) => b.totalCents - a.totalCents);
}

export function getCategoryColor(category: string): string {
  const categoryColors = {
    'Food': 'hsl(var(--category-food))',
    'Groceries': 'hsl(var(--category-groceries))',
    'Transport': 'hsl(var(--category-transport))',
    'Bills': 'hsl(var(--category-bills))',
    'Entertainment': 'hsl(var(--category-entertainment))',
    'Health': 'hsl(var(--category-health))',
    'Shopping': 'hsl(var(--category-shopping))',
    'Other': 'hsl(var(--category-other))'
  };
  
  return categoryColors[category as keyof typeof categoryColors] || categoryColors['Other'];
}

export function validateExpense(expense: Partial<Expense>): string[] {
  const errors: string[] = [];
  
  if (!expense.amountCents || expense.amountCents <= 0) {
    errors.push('Amount must be greater than 0');
  }
  
  if (expense.amountCents && expense.amountCents > 100000000) { // €1M limit
    errors.push('Amount exceeds maximum limit');
  }
  
  if (!expense.category || expense.category.trim().length === 0) {
    errors.push('Category is required');
  }
  
  if (expense.category && expense.category.length > 50) {
    errors.push('Category name is too long');
  }
  
  if (expense.note && expense.note.length > 500) {
    errors.push('Note is too long (max 500 characters)');
  }
  
  if (expense.paymentMethod && expense.paymentMethod.length > 50) {
    errors.push('Payment method name is too long');
  }
  
  if (expense.paidAt) {
    const paidDate = new Date(expense.paidAt);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (isNaN(paidDate.getTime())) {
      errors.push('Invalid date format');
    } else if (paidDate > today) {
      errors.push('Date cannot be in the future');
    }
    
    // Check for reasonable date range (not older than 10 years)
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    if (paidDate < tenYearsAgo) {
      errors.push('Date cannot be older than 10 years');
    }
  }
  
  return errors;
}