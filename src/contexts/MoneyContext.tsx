import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getUserPreferences, saveUserPreferences } from '@/lib/storage';

// Exchange rates interface
export interface FxRates {
  base: string;
  rates: Record<string, number>;
  updatedAt: string;
}

// Money state interface
export interface MoneyState {
  baseCurrency: string;          // "EUR" - stored currency
  displayCurrency: string;       // User's preferred display currency
  rates: FxRates;                // Exchange rates
  format(amountInBaseCents: number): string;  // Format for display
  toDisplay(amountInBaseCents: number): number; // Convert to display currency cents
  setDisplayCurrency(code: string): Promise<void>;
  refreshRates(): Promise<void>;
  getConversionInfo(): string | null; // Get conversion info for display
}

// Mock exchange rates for development
const MOCK_RATES: FxRates = {
  base: 'EUR',
  rates: {
    EUR: 1,
    USD: 1.09,
    GBP: 0.85,
    JPY: 160.5,
    CAD: 1.47,
    AUD: 1.66,
    CHF: 0.95,
    CNY: 7.85,
  },
  updatedAt: new Date().toISOString(),
};

// Fallback rates if API fails
const FALLBACK_RATES: FxRates = {
  base: 'EUR',
  rates: {
    EUR: 1,
    USD: 1.08,
    GBP: 0.86,
    JPY: 158.0,
    CAD: 1.46,
    AUD: 1.65,
    CHF: 0.94,
    CNY: 7.80,
  },
  updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
};

const MoneyContext = createContext<MoneyState | undefined>(undefined);

export function MoneyProvider({ children }: { children: React.ReactNode }) {
  const [baseCurrency] = useState('EUR'); // Fixed base currency
  const [displayCurrency, setDisplayCurrencyState] = useState('EUR');
  const [rates, setRates] = useState<FxRates>(MOCK_RATES);

  // Load initial preferences
  useEffect(() => {
    const prefs = getUserPreferences();
    if (prefs?.currency) {
      setDisplayCurrencyState(prefs.currency);
    }
    
    // Load cached rates
    const cachedRates = localStorage.getItem('expense-tracker-fx-rates');
    if (cachedRates) {
      try {
        const parsed = JSON.parse(cachedRates);
        if (parsed && parsed.base === baseCurrency) {
          setRates(parsed);
        }
      } catch (error) {
        console.warn('Failed to parse cached FX rates:', error);
      }
    }
    
    // Check if rates need refresh
    refreshRatesIfNeeded();
  }, [baseCurrency]);

  // Check if rates need refresh (older than 24 hours)
  const refreshRatesIfNeeded = useCallback(async () => {
    const lastUpdate = new Date(rates.updatedAt);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceUpdate > 24) {
      await refreshRates();
    }
  }, [rates.updatedAt]);

  // Fetch fresh exchange rates
  const refreshRates = useCallback(async (): Promise<void> => {
    try {
      // In production, this would call a real API
      // For now, we'll simulate with mock data
      const newRates: FxRates = {
        base: baseCurrency,
        rates: {
          EUR: 1,
          USD: 1.09 + (Math.random() - 0.5) * 0.02, // Add some variation
          GBP: 0.85 + (Math.random() - 0.5) * 0.02,
          JPY: 160.5 + (Math.random() - 0.5) * 2,
          CAD: 1.47 + (Math.random() - 0.5) * 0.02,
          AUD: 1.66 + (Math.random() - 0.5) * 0.02,
          CHF: 0.95 + (Math.random() - 0.5) * 0.01,
          CNY: 7.85 + (Math.random() - 0.5) * 0.1,
        },
        updatedAt: new Date().toISOString(),
      };
      
      setRates(newRates);
      
      // Cache rates
      localStorage.setItem('expense-tracker-fx-rates', JSON.stringify(newRates));
      
    } catch (error) {
      console.warn('Failed to fetch fresh rates, using fallback:', error);
      setRates(FALLBACK_RATES);
    }
  }, [baseCurrency]);

  // Set display currency
  const setDisplayCurrency = useCallback(async (code: string): Promise<void> => {
    if (code === displayCurrency) return;
    
    // Ensure we have rates for the new currency
    if (!rates.rates[code]) {
      await refreshRates();
      
      // If still no rates, fall back to base currency
      if (!rates.rates[code]) {
        console.warn(`No exchange rate for ${code}, falling back to ${baseCurrency}`);
        setDisplayCurrencyState(baseCurrency);
        return;
      }
    }
    
    setDisplayCurrencyState(code);
    
    // Save to preferences
    const prefs = getUserPreferences();
    if (prefs) {
      saveUserPreferences({
        ...prefs,
        currency: code,
      });
    }
  }, [displayCurrency, rates.rates, baseCurrency, refreshRates]);

  // Format amount for display
  const format = useCallback((amountInBaseCents: number): string => {
    if (displayCurrency === baseCurrency) {
      // Same currency, format directly
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: displayCurrency,
        minimumFractionDigits: 2,
      }).format(amountInBaseCents / 100);
    }
    
    // Convert to display currency
    const rate = rates.rates[displayCurrency];
    if (!rate) {
      console.warn(`No exchange rate for ${displayCurrency}`);
      return `${displayCurrency} ${(amountInBaseCents / 100).toFixed(2)}`;
    }
    
    const amountInDisplayCurrency = (amountInBaseCents / 100) * rate;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: 2,
    }).format(amountInDisplayCurrency);
  }, [displayCurrency, baseCurrency, rates.rates]);

  // Convert amount to display currency (returns cents)
  const toDisplay = useCallback((amountInBaseCents: number): number => {
    if (displayCurrency === baseCurrency) {
      return amountInBaseCents;
    }
    
    const rate = rates.rates[displayCurrency];
    if (!rate) {
      return amountInBaseCents; // Fall back to base
    }
    
    return Math.round(amountInBaseCents * rate);
  }, [displayCurrency, baseCurrency, rates.rates]);

  // Get conversion info for display
  const getConversionInfo = useCallback(() => {
    if (displayCurrency === baseCurrency) return null;
    
    const lastUpdate = new Date(rates.updatedAt);
    const formattedDate = lastUpdate.toLocaleDateString();
    
    return `Converted from ${baseCurrency} using rates updated on ${formattedDate}`;
  }, [displayCurrency, baseCurrency, rates.updatedAt]);

  const value: MoneyState = {
    baseCurrency,
    displayCurrency,
    rates,
    format,
    toDisplay,
    setDisplayCurrency,
    refreshRates,
    getConversionInfo,
  };

  return (
    <MoneyContext.Provider value={value}>
      {children}
    </MoneyContext.Provider>
  );
}

export function useMoney() {
  const context = useContext(MoneyContext);
  if (context === undefined) {
    throw new Error('useMoney must be used within a MoneyProvider');
  }
  return context;
}
