import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

const STORAGE_KEY = "mswasth-theme-mode";

// ============================================================================
// M-Swasth Theme Context v3.0 — Warm Professional Palette
// ============================================================================
// Warm amber/orange primary inspired by Nurses Portal. Cream backgrounds in
// light mode, olive-green dark mode. Every token tuned for readability.
// ============================================================================

const getThemeColors = (mode) => {
  const d = mode === "dark";
  return {
    isDark: d,

    // ── Backgrounds ──────────────────────────────────────────────────────
    bg:            d ? "#1A2E23"                   : "#FFF8F0",
    bgAlt:         d ? "#162419"                   : "#FFF0E0",
    bgCard:        d ? "rgba(255,255,255,0.05)"    : "#FFFFFF",
    bgCardHover:   d ? "rgba(255,255,255,0.08)"    : "#FFF5E6",
    bgSidebar:     d ? "#112118"                   : "#FFFFFF",
    bgPaper:       d ? "rgba(255,255,255,0.05)"    : "#FFFFFF",
    bgTableHeader: d ? "rgba(255,255,255,0.06)"    : "#FFFAF0",
    bgInput:       d ? "rgba(255,255,255,0.06)"    : "#FFFFFF",
    bgElevated:    d ? "rgba(255,255,255,0.06)"    : "#FFFFFF",
    bgBanner:      d ? "rgba(0,0,0,0.25)"          : undefined,
    bgMesh:        d
      ? "radial-gradient(at 20% 80%, rgba(217,119,6,0.06) 0%, transparent 50%), radial-gradient(at 80% 20%, rgba(5,150,105,0.06) 0%, transparent 50%)"
      : "radial-gradient(at 20% 80%, rgba(217,119,6,0.04) 0%, transparent 50%), radial-gradient(at 80% 20%, rgba(245,158,11,0.04) 0%, transparent 50%)",

    // ── Borders ──────────────────────────────────────────────────────────
    border:      d ? "rgba(255,255,255,0.08)"  : "rgba(217,119,6,0.12)",
    borderHover: d ? "rgba(255,255,255,0.15)"  : "rgba(217,119,6,0.25)",
    borderLight: d ? "rgba(255,255,255,0.04)"  : "rgba(217,119,6,0.06)",

    // ── Text ─────────────────────────────────────────────────────────────
    text:      d ? "#F1F5F9" : "#1C1917",
    textSec:   d ? "rgba(255,255,255,0.62)" : "#78716C",
    textMuted: d ? "rgba(255,255,255,0.38)" : "#A8A29E",

    // ── Primary Family (Warm Amber) ─────────────────────────────────────
    primary:       d ? "#F59E0B" : "#D97706",
    primaryLight:  "#F59E0B",
    primaryDark:   "#B45309",
    primarySoft:   d ? "rgba(245,158,11,0.15)" : "#FFFBEB",

    // ── Secondary Family (Forest Green) ─────────────────────────────────
    secondaryColor: "#059669",
    secondaryLight: "#34D399",
    secondaryDark:  "#047857",
    secondarySoft:  d ? "rgba(5,150,105,0.15)" : "#ECFDF5",

    // ── Accent (Coral Orange) ───────────────────────────────────────────
    accent:      "#EA580C",
    accentLight: "#FB923C",
    accentDark:  "#C2410C",
    accentSoft:  d ? "rgba(234,88,12,0.15)" : "#FFF7ED",

    // ── Named colors (backward-compatible) ──────────────────────────────
    indigo:       "#818CF8",
    indigoVivid:  "#6366F1",
    purple:       "#A78BFA",
    purpleSolid:  "#7C3AED",
    emerald:      "#34D399",
    emeraldDark:  "#10B981",
    cyan:         "#22D3EE",
    cyanDark:     "#06B6D4",
    amber:        "#FBBF24",
    amberDark:    "#F59E0B",
    rose:         "#FB7185",
    roseDark:     "#F43F5E",
    teal:         "#06B6D4",
    tealLight:    "#67E8F9",

    // ── Glassmorphism ────────────────────────────────────────────────────
    glassBg:       d ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)",
    glassBorder:   d ? "rgba(255,255,255,0.08)"  : "rgba(217,119,6,0.1)",
    glassBackdrop: d ? "blur(16px) saturate(180%)" : "blur(12px) saturate(180%)",

    // ── Charts ───────────────────────────────────────────────────────────
    chartGrid:        d ? "rgba(255,255,255,0.06)" : "rgba(217,119,6,0.06)",
    chartTick:        d ? "#94A3B8"                : "#78716C",
    chartTooltipBg:   d ? "#1E3A2F"                : "#FFFFFF",
    chartTooltipBorder: d ? "rgba(255,255,255,0.1)" : "rgba(217,119,6,0.12)",
    chartTooltipText: d ? "#F1F5F9"                : "#1C1917",
    chartLegend:      d ? "#94A3B8"                : "#78716C",
    chartColors: [
      "#D97706", "#059669", "#EA580C", "#0891B2", "#7C3AED",
      "#E11D48", "#F59E0B", "#10B981", "#FB923C", "#06B6D4",
    ],

    // ── Status badges ────────────────────────────────────────────────────
    statusAvailable:    { bg: d ? "rgba(16,185,129,0.15)" : "#ECFDF5", color: d ? "#34D399" : "#059669" },
    statusOnCall:       { bg: d ? "rgba(245,158,11,0.15)" : "#FFFBEB", color: d ? "#FBBF24" : "#D97706" },
    statusOnCallHealth: { bg: d ? "rgba(245,158,11,0.15)" : "#FFFBEB", color: d ? "#FBBF24" : "#D97706" },
    statusOffline:      { bg: d ? "rgba(100,116,139,0.12)" : "#F1F5F9", color: d ? "#94A3B8" : "#64748B" },
    statusBreak:        { bg: d ? "rgba(234,88,12,0.15)"  : "#FFF7ED", color: d ? "#FB923C" : "#EA580C" },
    statusError:        { bg: d ? "rgba(244,63,94,0.15)"  : "#FFF1F2", color: d ? "#FB7185" : "#E11D48" },
    statusSuccess:      { bg: d ? "rgba(16,185,129,0.15)" : "#ECFDF5", color: d ? "#34D399" : "#059669" },

    // ── Shadows ──────────────────────────────────────────────────────────
    shadow:      d
      ? "0 4px 24px rgba(0,0,0,0.4)"
      : "0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.05)",
    shadowHover: d
      ? "0 8px 40px rgba(0,0,0,0.5)"
      : "0 4px 12px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.08)",
    shadowCard:  d
      ? "0 2px 8px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.18)"
      : "0 1px 3px rgba(0,0,0,0.03), 0 6px 16px rgba(0,0,0,0.04)",
    shadowPrimary: d
      ? "0 4px 14px rgba(245,158,11,0.25), 0 2px 6px rgba(245,158,11,0.15)"
      : "0 4px 14px rgba(217,119,6,0.15), 0 2px 6px rgba(217,119,6,0.08)",

    // ── Gradients ────────────────────────────────────────────────────────
    gradientPrimary:  "linear-gradient(135deg, #D97706 0%, #EA580C 100%)",
    gradientAccent:   "linear-gradient(135deg, #059669 0%, #0891B2 100%)",
    gradientSuccess:  "linear-gradient(135deg, #10B981 0%, #06B6D4 100%)",
    gradientWarning:  "linear-gradient(135deg, #F59E0B 0%, #FB7185 100%)",
    gradientError:    "linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)",
    gradientHeader:   "linear-gradient(135deg, #D97706 0%, #EA580C 50%, #059669 100%)",
    gradientSidebar:  d
      ? "linear-gradient(180deg, #1A2E23 0%, #112118 100%)"
      : "linear-gradient(180deg, #FFFFFF 0%, #FFFAF0 100%)",
    gradientCardShine: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.05) 100%)",
    gradientMesh: d
      ? "radial-gradient(at 20% 80%, rgba(217,119,6,0.06) 0%, transparent 50%), radial-gradient(at 80% 20%, rgba(5,150,105,0.06) 0%, transparent 50%)"
      : "radial-gradient(at 20% 80%, rgba(217,119,6,0.04) 0%, transparent 50%), radial-gradient(at 80% 20%, rgba(245,158,11,0.04) 0%, transparent 50%)",

    // ── Dialogs ──────────────────────────────────────────────────────────
    dialogBg:     d ? "#1E3A2F" : "#FFFFFF",
    dialogBorder: d ? "rgba(255,255,255,0.08)" : "rgba(217,119,6,0.1)",

    // ── Scrollbar ────────────────────────────────────────────────────────
    scrollThumb:      d ? "rgba(255,255,255,0.1)" : "rgba(217,119,6,0.15)",
    scrollThumbHover: d ? "rgba(255,255,255,0.18)" : "rgba(217,119,6,0.25)",

    // ── Helpers ──────────────────────────────────────────────────────────
    white08:  d ? "rgba(255,255,255,0.08)" : "rgba(217,119,6,0.05)",
    white04:  d ? "rgba(255,255,255,0.04)" : "rgba(217,119,6,0.03)",
    overlay:  d ? "rgba(0,0,0,0.6)"        : "rgba(28,25,23,0.3)",

    // ── Animation tokens ─────────────────────────────────────────────────
    transitionFast:   "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
    transitionNormal: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
    transitionSlow:   "all 350ms cubic-bezier(0.4, 0, 0.2, 1)",
    transitionSpring: "all 250ms cubic-bezier(0.34, 1.56, 0.64, 1)",

    // ── Border radius tokens ─────────────────────────────────────────────
    radiusSm:  "6px",
    radiusMd:  "8px",
    radiusLg:  "12px",
    radiusXl:  "16px",
    radius2xl: "20px",
    radiusFull: "9999px",
  };
};

const ThemeContext = createContext(null);

export const ManagerThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "light";
    } catch {
      return "light";
    }
  });

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try { localStorage.setItem(STORAGE_KEY, next); } catch {}
      return next;
    });
  }, []);

  const colors = useMemo(() => getThemeColors(mode), [mode]);

  const value = useMemo(() => ({ mode, toggleMode, colors }), [mode, toggleMode, colors]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeMode = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback if used outside provider — return light theme defaults
    return { mode: "light", toggleMode: () => {}, colors: getThemeColors("light") };
  }
  return ctx;
};

// Named export for direct access (e.g., in non-React utility files)
export { getThemeColors };

export default ThemeContext;
