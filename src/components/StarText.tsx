import React, { useState, useEffect } from "react";
import type { StarView } from "../lib/types";
import { getStarDescription } from "../content/starDescriptions";

// Màu sáng hơn cho dark theme
const darkThemeColors: Record<string, string> = {
  "#111827": "#60a5fa", // thuy: đen -> xanh dương sáng
  "#374151": "#9ca3af", // neutral: xám đậm -> xám nhạt
  "#9ca3af": "#d1d5db", // kim: xám -> xám sáng hơn
};

function useIsDarkTheme() {
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    const checkDark = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      if (theme === "dark") return true;
      if (theme === "light") return false;
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    };
    
    setIsDark(checkDark());
    
    // Listen for theme changes
    const observer = new MutationObserver(() => setIsDark(checkDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    
    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    const handleChange = () => setIsDark(checkDark());
    mediaQuery?.addEventListener?.("change", handleChange);
    
    return () => {
      observer.disconnect();
      mediaQuery?.removeEventListener?.("change", handleChange);
    };
  }, []);
  
  return isDark;
}

export default function StarText({ star }: { star: StarView }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isDark = useIsDarkTheme();
  const extraClass = star.scope === "annual" || star.scope === "monthly" || star.scope === "daily" || star.scope === "hourly" ? " star-luu" : "";
  const description = getStarDescription(star.name);
  
  const displayColor = star.color && isDark && darkThemeColors[star.color] 
    ? darkThemeColors[star.color] 
    : star.color;
  
  return (
    <span
      className={`star ${star.colorGroup}${extraClass}${description ? " star-has-tooltip" : ""}`}
      style={displayColor ? { color: displayColor } : undefined}
      onMouseEnter={() => description && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={() => description && setShowTooltip(true)}
      onTouchEnd={() => setShowTooltip(false)}
    >
      {star.display ?? `${star.name}${star.brightness ? `(${star.brightness})` : ""}`}
      {showTooltip && description ? (
        <span className="star-tooltip">{description}</span>
      ) : null}
    </span>
  );
}
