import { useState } from 'react';
import { Trash2, Edit, Calendar, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Expense } from '@/types/expense';
import { getCategoryColor } from '@/lib/expense-utils';
import { deleteExpense } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { AddExpenseDialog } from '@/components/AddExpenseDialog';
import { useMoney } from '@/contexts/MoneyContext';

interface ExpenseListProps {
  expenses: Expense[];
  onRefresh: () => void;
}

export function ExpenseList({ expenses, onRefresh }: ExpenseListProps) {
  const { toast } = useToast();
  const { format } = useMoney();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleDelete = (expense: Expense) => {
    const success = deleteExpense(expense.id);
    if (success) {
      toast({
        title: "Expense deleted",
        description: `${format(expense.amountCents)} expense removed`,
      });
      onRefresh();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          No expenses recorded
        </h3>
        <p className="text-sm text-muted-foreground">
          Add your first expense to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-border">
        {expenses
          .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
          .map((expense) => (
            <div
              key={expense.id}
              className="p-4 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getCategoryColor(expense.category) }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{expense.category}</span>
                      {expense.paymentMethod && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {expense.paymentMethod}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(expense.paidAt)}
                      {expense.note && ` • ${expense.note}`}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-semibold text-expense">
                      {format(expense.amountCents)}
                    </div>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingExpense(expense)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(expense)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {editingExpense && (
        <AddExpenseDialog
          open={!!editingExpense}
          onOpenChange={() => setEditingExpense(null)}
          onSave={() => {
            setEditingExpense(null);
            onRefresh();
          }}
          expense={editingExpense}
        />
      )}
    </>
  );
}