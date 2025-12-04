'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ThemeName } from '@/lib/themes';
import { getTheme } from '@/lib/themes';
import { useSession } from 'next-auth/react';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'budget_app_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [theme, setThemeState] = useState<ThemeName>('dark');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme from localStorage and session
  useEffect(() => {
    // First check localStorage for user preference
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null;

    if (storedTheme && (storedTheme === 'dark' || storedTheme === 'light')) {
      setThemeState(storedTheme);
    } else if (session?.user) {
      // Then check if theme is in session
      const userTheme = (session.user as any).theme as ThemeName | undefined;
      if (userTheme && (userTheme === 'dark' || userTheme === 'light')) {
        setThemeState(userTheme);
      }
    }

    setIsLoading(false);
  }, [session?.user]);

  // Apply theme CSS variables to document
  useEffect(() => {
    const themeConfig = getTheme(theme);
    const root = document.documentElement;

    Object.entries(themeConfig.colors).forEach(([key, value]) => {
      const cssVarName = key
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '');
      root.style.setProperty(`--${cssVarName}`, value);
    });

    // Store in localStorage for persistence
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = async (newTheme: ThemeName) => {
    try {
      setThemeState(newTheme);

      // Persist to database
      try {
        const response = await fetch('/api/user/theme', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: newTheme }),
        });

        if (!response.ok) {
          console.error('Failed to save theme preference to database');
          // Theme is still applied locally even if DB save fails
        }
      } catch (error) {
        console.error('Failed to save theme preference:', error);
        // Theme is still applied locally even if DB save fails
      }
    } catch (error) {
      console.error('Failed to change theme:', error);
      throw error;
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
