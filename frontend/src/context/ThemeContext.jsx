import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const THEME_KEY = "employeehub-theme";

const getInitialTheme = () => {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);

    if (
      savedTheme === "light" ||
      savedTheme === "dark" ||
      savedTheme === "system"
    ) {
      return savedTheme;
    }
  } catch (error) {
    console.error("Failed to read saved theme:", error);
  }

  return "system";
};

const applyTheme = (theme) => {
  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    root.classList.toggle("dark", prefersDark);
  }
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  // Apply and save theme whenever it changes
  useEffect(() => {
    applyTheme(theme);

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  }, [theme]);

  // Keep System theme synchronized with OS changes
  useEffect(() => {
    if (theme !== "system") return;

    const media = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleChange = () => {
      applyTheme("system");
    };

    media.addEventListener?.("change", handleChange);

    return () => {
      media.removeEventListener?.("change", handleChange);
    };
  }, [theme]);

  const setTheme = (newTheme) => {
    if (
      newTheme !== "light" &&
      newTheme !== "dark" &&
      newTheme !== "system"
    ) {
      return;
    }

    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}