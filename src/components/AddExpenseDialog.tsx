import { useState, useEffect } from 'react';
import { Calendar, DollarSign, Tag, FileText, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Expense, DEFAULT_CATEGORIES, PAYMENT_METHODS } from '@/types/expense';
import { parseCurrency, validateExpense, getCategoryColor } from '@/lib/expense-utils';
import { addExpense, updateExpense, getSettings } from '@/lib/storage';
import { sanitizeText, sanitizeAmount } from '@/lib/security';
import { useToast } from '@/hooks/use-toast';
import { useMoney } from '@/contexts/MoneyContext';

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  expense?: Expense;
}

export function AddExpenseDialog({ open, onOpenChange, onSave, expense }: AddExpenseDialogProps) {
  const { toast } = useToast();
  const { format } = useMoney();
  const settings = getSettings();
  
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    note: '',
    paidAt: new Date().toISOString().split('T')[0],
    paymentMethod: '',
  });

  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (expense) {
      setFormData({
        amount: (expense.amountCents / 100).toString(),
        category: expense.category,
        note: expense.note || '',
        paidAt: expense.paidAt,
        paymentMethod: expense.paymentMethod || '',
      });
    } else {
      setFormData({
        amount: '',
        category: '',
        note: '',
        paidAt: new Date().toISOString().split('T')[0],
        paymentMethod: '',
      });
    }
  }, [expense, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountCents = parseCurrency(formData.amount);
    const expenseData = {
      amountCents,
      currency: settings.currency,
      category: formData.category,
      note: formData.note || undefined,
      paidAt: formData.paidAt,
      paymentMethod: formData.paymentMethod || undefined,
    };

    const validationErrors = validateExpense(expenseData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (expense) {
        updateExpense(expense.id, expenseData);
        toast({
          title: "Expense updated",
          description: `${format(amountCents)} expense updated successfully`,
        });
      } else {
        addExpense(expenseData);
        toast({
          title: "Expense added",
          description: `${format(amountCents)} expense added successfully`,
        });
      }
      
      setErrors([]);
      onSave();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save expense. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Expense save error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {expense ? 'Edit Expense' : 'Add New Expense'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
                     {errors.length > 0 && (
             <div className="bg-error/10 border border-error/20 rounded-md p-3">
               <ul className="text-sm text-error space-y-1">
                 {errors.map((error, index) => (
                   <li key={index}>• {error}</li>
                 ))}
               </ul>
             </div>
           )}

          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Amount
            </Label>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: sanitizeAmount(e.target.value) })}
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Category
            </Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {settings.categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCategoryColor(category) }}
                      />
                      {category}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidAt" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date
            </Label>
            <Input
              id="paidAt"
              type="date"
              value={formData.paidAt}
              onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Method (Optional)
            </Label>
            <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Note (Optional)
            </Label>
            <Textarea
              id="note"
              placeholder="Add a note about this expense..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: sanitizeText(e.target.value, 500) })}
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {expense ? 'Update' : 'Add'} Expense
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}