import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUserPreferences, saveUserPreferences } from '@/lib/storage';

type Theme = 'system' | 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// WCAG AA contrast utility function
export function ensureContrast(fg: string, bg: string, min = 4.5): string {
  // This is a simplified version - in production you'd want a proper contrast calculation
  // For now, we'll use predefined high-contrast colors
  const highContrastColors = {
    light: {
      text: 'hsl(215 25% 27%)',        // Dark text on light
      muted: 'hsl(215 16% 47%)',       // Muted text
      primary: 'hsl(200 98% 39%)',     // Primary blue
      primaryContrast: 'hsl(210 17% 98%)', // White text on primary
    },
    dark: {
      text: 'hsl(210 40% 98%)',        // Light text on dark
      muted: 'hsl(215 20% 65%)',       // Muted text
      primary: 'hsl(224 71% 76%)',     // Light primary
      primaryContrast: 'hsl(222 47% 11%)', // Dark text on light primary
    }
  };
  
  return fg; // For now, return as-is. In production, calculate actual contrast
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Load theme from storage
    const prefs = getUserPreferences();
    const storedTheme = prefs?.theme || 'system';
    setThemeState(storedTheme);
    applyTheme(storedTheme);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    const isDarkMode = newTheme === 'dark' || 
      (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDark(isDarkMode);
    
    if (isDarkMode) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    
    // Save to storage via UserPreferences
    const prefs = getUserPreferences();
    if (prefs) {
      saveUserPreferences({
        ...prefs,
        theme: newTheme,
      });
    }
  };

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
