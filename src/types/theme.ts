import type { ReactNode } from 'react';

export type Theme = 'system' | 'light' | 'dark';

export interface ThemeProviderContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  [key: string]: unknown; // For additional props passed to ThemeProviderContext.Provider
}