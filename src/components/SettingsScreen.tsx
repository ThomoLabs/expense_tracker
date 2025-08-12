import React, { useState } from 'react';
import { X, Plus, Edit, Trash2, GripVertical, Download, Upload, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useMoney } from '@/contexts/MoneyContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getExpenses, saveExpenses, Category } from '@/lib/storage';
import { exportToCSV, validateCSVHeaders, createExpenseFromCSVRow } from '@/lib/csv-utils';
import { useSettingsForm } from '@/hooks/useSettingsForm';

const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
];

const THEMES = [
  { value: 'system', label: 'System', icon: '🖥️' },
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
];

// Sortable Category Item Component
function SortableCategoryItem({ 
  category, 
  onEdit, 
  onDelete 
}: { 
  category: Category; 
  onEdit: (category: Category) => void; 
  onDelete: (category: Category) => void; 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="flex items-center gap-3 p-3 border rounded-lg bg-card text-card-foreground"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-move hover:bg-accent p-1 rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div 
        className="w-4 h-4 rounded-full"
        style={{ backgroundColor: category.color || 'hsl(var(--muted-foreground))' }}
      />
      <span className="flex-1 font-medium">{category.name}</span>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(category)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(category)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function SettingsScreen({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const { theme } = useTheme();
  const { format, getConversionInfo } = useMoney();
  
  // Use the custom hook for form management
  const {
    currentPrefs,
    hasUnsavedChanges,
    isSaving,
    updateCurrentPrefs,
    handleSave,
    resetToSaved,
  } = useSettingsForm(onClose);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Dialog states
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false);
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false);
  const [showMergeCategoryDialog, setShowMergeCategoryDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [mergeIntoCategory, setMergeIntoCategory] = useState<string>('');
  const [importFile, setImportFile] = useState<File | null>(null);

  const getRandomColor = () => {
    const colors = [
      'hsl(var(--category-food))',
      'hsl(var(--category-groceries))',
      'hsl(var(--category-transport))',
      'hsl(var(--category-bills))',
      'hsl(var(--category-entertainment))',
      'hsl(var(--category-health))',
      'hsl(var(--category-shopping))',
      'hsl(var(--category-other))',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleAddCategory = (name: string) => {
    const newCategory: Category = {
      id: crypto.randomUUID(),
      name: name.trim(),
      color: getRandomColor(),
    };
    
    updateCurrentPrefs({
      categories: [...currentPrefs.categories, newCategory]
    });
    
    setShowAddCategoryDialog(false);
    setNewCategoryName('');
  };

  const handleEditCategory = (id: string, name: string) => {
    updateCurrentPrefs({
      categories: currentPrefs.categories.map(cat =>
        cat.id === id ? { ...cat, name: name.trim() } : cat
      )
    });
    
    setShowEditCategoryDialog(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (id: string) => {
    const category = currentPrefs.categories.find(cat => cat.id === id);
    if (!category) return;

    const expenses = getExpenses();
    const hasExpenses = expenses.some(exp => exp.category === category.name);

    if (hasExpenses) {
      setCategoryToDelete(category);
      setShowDeleteCategoryDialog(true);
    } else {
      // No expenses, safe to delete
      updateCurrentPrefs({
        categories: currentPrefs.categories.filter(cat => cat.id !== id)
      });
    }
    
    setShowDeleteCategoryDialog(false);
  };

  const handleMergeCategory = (fromId: string, toId: string) => {
    const fromCategory = currentPrefs.categories.find(cat => cat.id === fromId);
    const toCategory = currentPrefs.categories.find(cat => cat.id === toId);
    
    if (!fromCategory || !toCategory) return;

    // Update expenses to use the target category
    const expenses = getExpenses();
    const updatedExpenses = expenses.map(exp => 
      exp.category === fromCategory.name 
        ? { ...exp, category: toCategory.name, updatedAt: new Date().toISOString() }
        : exp
    );
    
    // Save updated expenses
    saveExpenses(updatedExpenses);
    
    // Remove the merged category
    updateCurrentPrefs({
      categories: currentPrefs.categories.filter(cat => cat.id !== fromId)
    });
    
    setShowMergeCategoryDialog(false);
    setCategoryToDelete(null);
    
    toast({
      title: "Category merged successfully",
      description: `All expenses from "${fromCategory.name}" have been moved to "${toCategory.name}".`,
    });
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = currentPrefs.categories.findIndex(cat => cat.id === active.id);
      const newIndex = currentPrefs.categories.findIndex(cat => cat.id === over.id);
      
      updateCurrentPrefs({
        categories: arrayMove(currentPrefs.categories, oldIndex, newIndex)
      });
    }
  };

  const exportCSV = () => {
    try {
      const expenses = getExpenses();
      const csvContent = exportToCSV(expenses);
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `expenses-${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export successful",
        description: `Exported ${expenses.length} expenses to CSV.`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export expenses. Please try again.",
        variant: "destructive",
      });
    }
  };

  const importCSV = (file: File, allowDuplicates: boolean) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        const expenses = getExpenses();
        
        // Validate headers
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const headerErrors = validateCSVHeaders(headers);
        
        if (headerErrors.length > 0) {
          toast({
            title: "Invalid CSV format",
            description: headerErrors[0], // Show first error
            variant: "destructive",
          });
          return;
        }
        
        let imported = 0;
        let skipped = 0;
        const newExpenses: any[] = [];
        
        // Process each row
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',').map(v => v.trim());
          const row: any = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          const expense = createExpenseFromCSVRow(row, currentPrefs.currency, expenses, allowDuplicates);
          
          if (expense) {
            newExpenses.push(expense);
            imported++;
          } else {
            skipped++;
          }
        }
        
        // Add new expenses
        if (newExpenses.length > 0) {
          saveExpenses([...expenses, ...newExpenses]);
        }
        
        // Create missing categories
        const existingCategories = new Set(currentPrefs.categories.map(cat => cat.name.toLowerCase()));
        const newCategories: Category[] = [];
        
        newExpenses.forEach(expense => {
          if (!existingCategories.has(expense.category.toLowerCase())) {
            newCategories.push({
              id: crypto.randomUUID(),
              name: expense.category,
              color: getRandomColor(),
            });
            existingCategories.add(expense.category.toLowerCase());
          }
        });
        
        if (newCategories.length > 0) {
          updateCurrentPrefs({
            categories: [...currentPrefs.categories, ...newCategories]
          });
        }
        
        toast({
          title: "Import completed",
          description: `Imported ${imported} expenses (skipped ${skipped}). ${newCategories.length > 0 ? `Created ${newCategories.length} new categories.` : ''}`,
        });
        
        setShowImportDialog(false);
        setImportFile(null);
        setAllowDuplicates(false);
        
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Failed to parse CSV file. Please check the format.",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
  };

  // Get conversion info for display
  const conversionInfo = getConversionInfo();

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-card rounded-lg shadow-lg border text-card-foreground">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold">Settings</h2>
              <p className="text-muted-foreground">Customize your expense tracker</p>
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToSaved}
                  className="text-muted-foreground"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Currency */}
            <Card>
              <CardHeader>
                <CardTitle>Currency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency">Select Currency</Label>
                    <Select
                      value={currentPrefs.currency}
                      onValueChange={(value) => updateCurrentPrefs({ currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Preview</Label>
                    <div className="text-2xl font-semibold text-primary">
                      {format(123456)}
                    </div>
                  </div>
                </div>
                
                {/* Conversion info */}
                {conversionInfo && (
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {conversionInfo}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Categories</span>
                  <Button onClick={() => setShowAddCategoryDialog(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={currentPrefs.categories.map(cat => cat.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {currentPrefs.categories.map((category) => (
                        <SortableCategoryItem
                          key={category.id}
                          category={category}
                          onEdit={() => {
                            setEditingCategory(category);
                            setShowEditCategoryDialog(true);
                          }}
                          onDelete={() => handleDeleteCategory(category.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                
                {currentPrefs.categories.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No categories yet. Add your first category to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Budget */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Overall Budget</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="budget-enabled"
                    checked={currentPrefs.monthlyBudgetCents > 0}
                    onCheckedChange={(checked) => 
                      updateCurrentPrefs({ 
                        monthlyBudgetCents: checked ? 100000 : 0 // Default to 1000.00
                      })
                    }
                  />
                  <Label htmlFor="budget-enabled">Enable monthly budget</Label>
                </div>
                
                {currentPrefs.monthlyBudgetCents > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="budget-amount">Monthly Budget Amount</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="budget-amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={(currentPrefs.monthlyBudgetCents / 100).toFixed(2)}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          updateCurrentPrefs({ monthlyBudgetCents: Math.round(value * 100) });
                        }}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">
                        {currentPrefs.currency}
                      </span>
                    </div>
                    
                    {/* Budget usage indicator */}
                    <div className="text-sm text-muted-foreground">
                      Used this month: 0% (budget tracking coming soon)
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={exportCSV} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export to CSV
                  </Button>
                  <Button onClick={() => setShowImportDialog(true)} variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Import from CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Theme</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      {THEMES.map((themeOption) => (
                        <Button
                          key={themeOption.value}
                          variant={currentPrefs.theme === themeOption.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateCurrentPrefs({ theme: themeOption.value as any })}
                        >
                          {themeOption.icon}
                          {themeOption.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving}
                className="min-w-[120px]"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-category-name">Category Name</Label>
              <Input
                id="new-category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCategoryName.trim()) {
                    handleAddCategory(newCategoryName);
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategoryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleAddCategory(newCategoryName)} disabled={!newCategoryName.trim()}>
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={showEditCategoryDialog} onOpenChange={setShowEditCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-category-name">Category Name</Label>
                <Input
                  id="edit-category-name"
                  defaultValue={editingCategory.name}
                  placeholder="Enter category name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      handleEditCategory(editingCategory.id, e.currentTarget.value);
                    }
                  }}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditCategoryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (editingCategory) {
                const nameInput = document.getElementById('edit-category-name') as HTMLInputElement;
                handleEditCategory(editingCategory.id, nameInput.value);
              }
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={showDeleteCategoryDialog} onOpenChange={setShowDeleteCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          {categoryToDelete && (
            <div className="space-y-4">
              <p>
                Are you sure you want to delete "{categoryToDelete.name}"?
                {getExpenses().some(exp => exp.category === categoryToDelete.name) && (
                  <span className="block text-sm text-muted-foreground mt-2">
                    This category has associated expenses. You'll need to merge them into another category.
                  </span>
                )}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteCategoryDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => categoryToDelete && handleDeleteCategory(categoryToDelete.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge Category Dialog */}
      <Dialog open={showMergeCategoryDialog} onOpenChange={setShowMergeCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Category</DialogTitle>
          </DialogHeader>
          {categoryToDelete && (
            <div className="space-y-4">
              <p>
                "{categoryToDelete.name}" has associated expenses. 
                Select a category to merge them into:
              </p>
              <div>
                <Label htmlFor="merge-into">Merge into category</Label>
                <Select value={mergeIntoCategory} onValueChange={setMergeIntoCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target category" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentPrefs.categories
                      .filter(cat => cat.id !== categoryToDelete.id)
                      .map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMergeCategoryDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (categoryToDelete && mergeIntoCategory) {
                  handleMergeCategory(categoryToDelete.id, mergeIntoCategory);
                }
              }}
              disabled={!mergeIntoCategory}
            >
              Merge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Expenses from CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImportFile(file);
                  }
                }}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allow-duplicates"
                checked={allowDuplicates}
                onChange={(e) => setAllowDuplicates(e.target.checked)}
              />
              <Label htmlFor="allow-duplicates">Allow duplicate expenses</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (importFile) {
                  importCSV(importFile, allowDuplicates);
                }
              }}
              disabled={!importFile}
            >
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
