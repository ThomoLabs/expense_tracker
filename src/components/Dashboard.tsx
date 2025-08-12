import { useState, useMemo } from 'react';
import { Plus, Calendar, TrendingUp, Wallet, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExpenseList } from '@/components/ExpenseList';
import { AddExpenseDialog } from '@/components/AddExpenseDialog';
import { MonthSelector } from '@/components/MonthSelector';
import { ExpensePieChart } from '@/components/ExpensePieChart';
import { SettingsScreen } from '@/components/SettingsScreen';
import { ExitIndicator } from '@/components/ExitIndicator';
import { getCurrentMonth, getExpensesForMonth, calculateCategoryTotals } from '@/lib/expense-utils';
import { getExpenses, getBudgets } from '@/lib/storage';
import { useMoney } from '@/contexts/MoneyContext';
import { useAndroidBackButton } from '@/hooks/useAndroidBackButton';
import { useSystemBarsContext } from '@/contexts/SystemBarsContext';

export function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const { format, getConversionInfo } = useMoney();
  const { isEdgeToEdge, isSafeAreasEnabled } = useSystemBarsContext();
  
  // Handle Android back button behavior
  const { showExitIndicator, hideExitIndicator } = useAndroidBackButton({
    isModalOpen: showAddExpense || showSettings,
    onModalClose: () => {
      if (showAddExpense) {
        setShowAddExpense(false);
      } else if (showSettings) {
        setShowSettings(false);
      }
    }
  });
  
  const expenses = getExpenses();
  const budgets = getBudgets();
  
  const monthlyExpenses = useMemo(() => 
    getExpensesForMonth(expenses, selectedMonth), 
    [expenses, selectedMonth]
  );
  
  const monthlyTotal = useMemo(() => 
    monthlyExpenses.reduce((sum, expense) => sum + expense.amountCents, 0),
    [monthlyExpenses]
  );
  
  const categoryTotals = useMemo(() => 
    calculateCategoryTotals(monthlyExpenses),
    [monthlyExpenses]
  );
  
  const monthlyBudget = budgets.find(b => 
    b.yearMonth === selectedMonth && !b.category
  );
  
  const budgetProgress = monthlyBudget 
    ? (monthlyTotal / monthlyBudget.limitCents) * 100
    : null;

  return (
    <div className={`min-h-screen bg-background ${isEdgeToEdge ? 'edge-to-edge' : ''}`}>
      <div className={`container mx-auto px-4 py-6 max-w-4xl ${isSafeAreasEnabled ? 'safe-area' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Expense Tracker
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your spending and stay on budget
            </p>
            {getConversionInfo() && (
              <p className="text-xs text-muted-foreground mt-1">
                {getConversionInfo()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
              className="h-10 w-10"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => setShowAddExpense(true)}
              className="rounded-full h-14 w-14 shadow-elevated"
              size="icon"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Month Selector */}
        <MonthSelector
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-card-elevated shadow-elevated border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Spent This Month
              </CardTitle>
              <Wallet className="h-4 w-4 text-expense" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-expense">
                {format(monthlyTotal)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {monthlyExpenses.length} expenses recorded
              </p>
            </CardContent>
          </Card>

          {monthlyBudget && (
            <Card className="bg-card-elevated shadow-elevated border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Budget Progress
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {budgetProgress !== null ? `${budgetProgress.toFixed(0)}%` : 'N/A'}
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      budgetProgress && budgetProgress > 100
                        ? 'bg-error'
                        : budgetProgress && budgetProgress > 80
                        ? 'bg-warning'
                        : 'bg-success'
                    }`}
                    style={{
                      width: `${Math.min(budgetProgress || 0, 100)}%`
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(monthlyBudget.limitCents)} budget
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Top Categories */}
        {categoryTotals.length > 0 && (
          <Card className="mb-8 bg-card-elevated shadow-elevated border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Top Spending Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryTotals.slice(0, 3).map((category, index) => {
                  const percentage = (category.totalCents / monthlyTotal) * 100;
                  return (
                    <div key={category.category} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{category.category}</span>
                          <span className="text-sm font-semibold">
                            {format(category.totalCents)}
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {percentage.toFixed(1)}% • {category.expenseCount} expenses
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Spending Breakdown Chart */}
        <div className="mb-8">
          <ExpensePieChart
            categoryTotals={categoryTotals}
            monthlyTotal={monthlyTotal}
            selectedMonth={selectedMonth}
          />
        </div>

        {/* Recent Expenses */}
        <Card className="bg-card-elevated shadow-elevated border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Recent Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ExpenseList 
              expenses={monthlyExpenses}
              onRefresh={() => window.location.reload()}
            />
          </CardContent>
        </Card>

        {/* Modals */}
        {showAddExpense && (
          <AddExpenseDialog
            open={showAddExpense}
            onOpenChange={setShowAddExpense}
            onSave={() => {
              setShowAddExpense(false);
              window.location.reload();
            }}
          />
        )}

        {showSettings && (
          <SettingsScreen onClose={() => setShowSettings(false)} />
        )}

        {/* Exit Indicator */}
        <ExitIndicator
          isVisible={showExitIndicator}
          onClose={hideExitIndicator}
        />
      </div>
    </div>
  );
}