import React, { createContext, useContext, ReactNode } from 'react';
import { useSystemBars } from '@/hooks/useSystemBars';

interface SystemBarsContextType {
  setSystemBarTheme: () => Promise<void>;
  isEdgeToEdge: boolean;
  isSafeAreasEnabled: boolean;
  systemBarTheme: 'light' | 'dark';
}

const SystemBarsContext = createContext<SystemBarsContextType | undefined>(undefined);

interface SystemBarsProviderProps {
  children: ReactNode;
}

export function SystemBarsProvider({ children }: SystemBarsProviderProps) {
  const systemBars = useSystemBars({
    enableEdgeToEdge: true,
    enableSafeAreas: true,
  });

  return (
    <SystemBarsContext.Provider value={systemBars}>
      {children}
    </SystemBarsContext.Provider>
  );
}

export function useSystemBarsContext() {
  const context = useContext(SystemBarsContext);
  if (context === undefined) {
    throw new Error('useSystemBarsContext must be used within a SystemBarsProvider');
  }
  return context;
}
