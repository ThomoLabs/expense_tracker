import { useState, useEffect, useCallback } from 'react';
import { getUserPreferences, saveUserPreferences, UserPreferences } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useMoney } from '@/contexts/MoneyContext';

export function useSettingsForm(onClose?: () => void) {
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const { setDisplayCurrency } = useMoney();
  
  // Load initial preferences
  const initialPrefs = getUserPreferences();
  
  // Current form state (what user sees and edits)
  const [currentPrefs, setCurrentPrefs] = useState<UserPreferences>(initialPrefs);
  
  // Last saved preferences (for change tracking)
  const [savedPrefs, setSavedPrefs] = useState<UserPreferences>(initialPrefs);
  
  // Track if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(currentPrefs) !== JSON.stringify(savedPrefs);
  
  // Save button loading state
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const prefs = getUserPreferences();
    setCurrentPrefs(prefs);
    setSavedPrefs(prefs);
  }, []);

  // Save preferences to localStorage
  const handleSave = useCallback(async () => {
    if (!hasUnsavedChanges) return;
    
    setIsSaving(true);
    
    try {
      // Validate inputs
      if (currentPrefs.monthlyBudgetCents < 0) {
        throw new Error('Monthly budget cannot be negative');
      }
      
      // Check if currency exists in our supported list
      const supportedCurrencies = ['EUR', 'USD', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];
      if (!supportedCurrencies.includes(currentPrefs.currency)) {
        throw new Error('Unsupported currency selected');
      }
      
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Save to localStorage
      saveUserPreferences(currentPrefs);
      
      // Update saved state
      setSavedPrefs(currentPrefs);
      
      // Apply theme immediately
      setTheme(currentPrefs.theme);
      
      // Apply currency change
      await setDisplayCurrency(currentPrefs.currency);
      
      // Show success toast
      toast({
        title: "Settings saved successfully!",
        description: "Your preferences have been saved.",
      });
      
      // Auto-close after 400ms
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 400);
      }
      
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "Failed to save your preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [currentPrefs, hasUnsavedChanges, setTheme, setDisplayCurrency, toast, onClose]);

  // Update current preferences (doesn't save to localStorage)
  const updateCurrentPrefs = useCallback((updates: Partial<UserPreferences>) => {
    setCurrentPrefs(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset to saved preferences
  const resetToSaved = useCallback(() => {
    setCurrentPrefs(savedPrefs);
  }, [savedPrefs]);

  return {
    currentPrefs,
    savedPrefs,
    hasUnsavedChanges,
    isSaving,
    updateCurrentPrefs,
    handleSave,
    resetToSaved,
  };
}
