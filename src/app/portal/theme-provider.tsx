"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

/**
 * Patient portal theme provider
 *
 * Light/dark mode with localStorage persistence and system preference
 * as the default. Exposes a `theme` and `toggleTheme()` via context.
 *
 * SSR-safe: server renders with the default theme ("light") and the
 * client hydrates to match the stored preference in a useEffect.
 * A tiny inline script in the layout sets the attribute before paint
 * to prevent FOUC.
 */

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "portal-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  // On mount, sync state to whatever the inline script already set on
  // the document element (light/dark), to avoid hydration mismatches.
  useEffect(() => {
    const root = document.documentElement;
    const current = (root.getAttribute("data-theme") as Theme) ?? "light";
    setThemeState(current);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage may be unavailable (private mode, SSR edge case)
    }
    document.documentElement.setAttribute("data-theme", next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

/**
 * Inline script that runs before paint to set data-theme on <html>.
 * Prevents flash of incorrect theme on first load.
 * Include via dangerouslySetInnerHTML in the portal layout.
 */
export const themeInitScript = `
(function(){
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;
