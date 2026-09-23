import React, { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const getTimeBasedTheme = (): "light" | "dark" => {
  const hour = new Date().getHours();
  // 6h-18h = light, 18h-6h = dark
  return hour >= 6 && hour < 18 ? "light" : "dark";
};

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  // Ưu tiên theo thời gian thực thay vì prefers-color-scheme
  return getTimeBasedTheme();
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

    // Kiểm tra và cập nhật theme mỗi phút khi ở chế độ "system"
    const checkTimeBasedTheme = () => {
      if (getStoredTheme() === "system") {
        applyTheme("system");
      }
    };

    // Cập nhật mỗi phút để bắt thời điểm chuyển 6h và 18h
    const intervalId = setInterval(checkTimeBasedTheme, 60_000);

    // Vẫn lắng nghe system preference để fallback
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", checkTimeBasedTheme);

    return () => {
      clearInterval(intervalId);
      mediaQuery.removeEventListener("change", checkTimeBasedTheme);
    };
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
    ? `Tự động (${effectiveTheme === "dark" ? "tối" : "sáng"})` 
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
