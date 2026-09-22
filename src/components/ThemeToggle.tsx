import React, { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const getStoredTheme = (): Theme => {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem("theme") as Theme) || "system";
};

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  const effectiveTheme = theme === "system" ? getSystemTheme() : theme;
  
  root.setAttribute("data-theme", effectiveTheme);
  
  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", effectiveTheme === "dark" ? "#121214" : "#fffbf4");
  }
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (getStoredTheme() === "system") {
        applyTheme("system");
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const cycleTheme = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button type="button" className="theme-toggle" aria-label="Đổi giao diện">
        <span className="theme-toggle__icon">◐</span>
      </button>
    );
  }

  const effectiveTheme = theme === "system" ? getSystemTheme() : theme;
  const icon = theme === "system" ? "◐" : effectiveTheme === "dark" ? "🌙" : "☀️";
  const label = theme === "system" 
    ? "Tự động theo hệ thống" 
    : effectiveTheme === "dark" 
      ? "Giao diện tối" 
      : "Giao diện sáng";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={cycleTheme}
      aria-label={`${label}. Nhấn để đổi giao diện`}
      title={label}
    >
      <span className="theme-toggle__icon" aria-hidden="true">{icon}</span>
      <span className="theme-toggle__label">{theme === "system" ? "Auto" : effectiveTheme === "dark" ? "Tối" : "Sáng"}</span>
    </button>
  );
}
