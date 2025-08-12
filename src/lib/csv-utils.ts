import { Expense } from '@/types/expense';

export interface CSVRow {
  date: string;
  amount: string;
  currency: string;
  category: string;
  note: string;
  payment_method: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export function exportToCSV(expenses: Expense[]): string {
  if (expenses.length === 0) {
    throw new Error('No expenses to export');
  }

  const headers = ['date', 'amount', 'currency', 'category', 'note', 'payment_method'];
  
  const rows = expenses.map(expense => [
    expense.paidAt.split('T')[0], // YYYY-MM-DD format
    (expense.amountCents / 100).toFixed(2),
    expense.currency,
    expense.category,
    expense.note || '',
    expense.paymentMethod || ''
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  
  // Add BOM for Excel compatibility
  return '\ufeff' + csvContent;
}

export function parseCSV(csvContent: string): ImportResult {
  const lines = csvContent.split('\n').map(line => line.trim()).filter(Boolean);
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const requiredHeaders = ['date', 'amount', 'category'];
  
  // Validate headers
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
  }

  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    errors: []
  };

  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Validate required fields
      if (!row.date || !row.amount || !row.category) {
        result.skipped++;
        continue;
      }

      // Validate date format
      const date = new Date(row.date);
      if (isNaN(date.getTime())) {
        result.skipped++;
        continue;
      }

      // Validate amount
      const amount = parseFloat(row.amount);
      if (isNaN(amount) || amount <= 0) {
        result.skipped++;
        continue;
      }

      result.imported++;
    } catch (error) {
      result.skipped++;
      result.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return result;
}

export function createExpenseFromCSVRow(
  row: any, 
  defaultCurrency: string, 
  existingExpenses: Expense[],
  allowDuplicates: boolean = false
): Expense | null {
  try {
    // Validate required fields
    if (!row.date || !row.amount || !row.category) {
      return null;
    }

    // Parse date
    const date = new Date(row.date);
    if (isNaN(date.getTime())) {
      return null;
    }

    // Parse amount
    const amount = parseFloat(row.amount);
    if (isNaN(amount) || amount <= 0) {
      return null;
    }

    // Check for duplicates if not allowed
    if (!allowDuplicates) {
      const isDuplicate = existingExpenses.some(exp => 
        exp.paidAt.split('T')[0] === row.date &&
        exp.amountCents === Math.round(amount * 100) &&
        exp.category === row.category &&
        exp.note === (row.note || '')
      );
      
      if (isDuplicate) {
        return null;
      }
    }

    // Create expense object
    return {
      id: crypto.randomUUID(),
      amountCents: Math.round(amount * 100),
      currency: row.currency || defaultCurrency,
      category: row.category.trim(),
      note: row.note?.trim() || undefined,
      paidAt: date.toISOString(),
      paymentMethod: row.payment_method?.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    return null;
  }
}

export function validateCSVHeaders(headers: string[]): string[] {
  const errors: string[] = [];
  const requiredHeaders = ['date', 'amount', 'category'];
  const validHeaders = ['date', 'amount', 'currency', 'category', 'note', 'payment_method'];
  
  // Check for missing required headers
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
  }

  // Check for invalid headers
  const invalidHeaders = headers.filter(h => !validHeaders.includes(h));
  if (invalidHeaders.length > 0) {
    errors.push(`Unknown columns will be ignored: ${invalidHeaders.join(', ')}`);
  }

  return errors;
}

export function sanitizeCSVValue(value: string): string {
  // Remove quotes and trim whitespace
  return value.replace(/^["']|["']$/g, '').trim();
}

export function escapeCSVValue(value: string): string {
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
