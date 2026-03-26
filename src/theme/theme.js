// ============================================================================
// M-Swasth Design System v2.0 — Premium SaaS Dashboard Theme
// ============================================================================
// Design Direction: 2025/2026 premium SaaS with deep indigo primary,
// vibrant accents, layered shadows, glassmorphism, and smooth animations.
// ============================================================================

// ---------------------------------------------------------------------------
// 1. COLOR PALETTE
// ---------------------------------------------------------------------------

const PALETTE = {
  // Primary family — Deep Indigo
  indigo50:  "#EEF2FF",
  indigo100: "#E0E7FF",
  indigo200: "#C7D2FE",
  indigo300: "#A5B4FC",
  indigo400: "#818CF8",
  indigo500: "#6366F1",
  indigo600: "#4F46E5",
  indigo700: "#4338CA",
  indigo800: "#3730A3",
  indigo900: "#312E81",

  // Secondary family — Violet
  violet50:  "#F5F3FF",
  violet100: "#EDE9FE",
  violet200: "#DDD6FE",
  violet300: "#C4B5FD",
  violet400: "#A78BFA",
  violet500: "#8B5CF6",
  violet600: "#7C3AED",
  violet700: "#6D28D9",
  violet800: "#5B21B6",
  violet900: "#4C1D95",

  // Accent — Electric Cyan
  cyan50:  "#ECFEFF",
  cyan100: "#CFFAFE",
  cyan200: "#A5F3FC",
  cyan300: "#67E8F9",
  cyan400: "#22D3EE",
  cyan500: "#06B6D4",
  cyan600: "#0891B2",
  cyan700: "#0E7490",
  cyan800: "#155E75",
  cyan900: "#164E63",

  // Highlight — Warm Amber
  amber50:  "#FFFBEB",
  amber100: "#FEF3C7",
  amber200: "#FDE68A",
  amber300: "#FCD34D",
  amber400: "#FBBF24",
  amber500: "#F59E0B",
  amber600: "#D97706",
  amber700: "#B45309",
  amber800: "#92400E",
  amber900: "#78350F",

  // Alert — Soft Rose
  rose50:  "#FFF1F2",
  rose100: "#FFE4E6",
  rose200: "#FECDD3",
  rose300: "#FDA4AF",
  rose400: "#FB7185",
  rose500: "#F43F5E",
  rose600: "#E11D48",
  rose700: "#BE123C",
  rose800: "#9F1239",
  rose900: "#881337",

  // Success — Emerald
  emerald50:  "#ECFDF5",
  emerald100: "#D1FAE5",
  emerald200: "#A7F3D0",
  emerald300: "#6EE7B7",
  emerald400: "#34D399",
  emerald500: "#10B981",
  emerald600: "#059669",
  emerald700: "#047857",
  emerald800: "#065F46",
  emerald900: "#064E3B",

  // Neutrals — Slate
  slate50:  "#F8FAFC",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  slate300: "#CBD5E1",
  slate400: "#94A3B8",
  slate500: "#64748B",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1E293B",
  slate900: "#0F172A",
  slate950: "#020617",

  // Pure
  white: "#FFFFFF",
  black: "#000000",
};

// ---------------------------------------------------------------------------
// 2. CORE THEME TOKENS
// ---------------------------------------------------------------------------

export const THEME = {
  // Primary colors
  primary:       PALETTE.indigo600,
  primaryLight:  PALETTE.indigo400,
  primaryDark:   PALETTE.indigo800,
  primarySoft:   PALETTE.indigo50,

  // Secondary colors
  secondary:      PALETTE.violet600,
  secondaryLight: PALETTE.violet400,
  secondaryDark:  PALETTE.violet800,
  secondarySoft:  PALETTE.violet50,

  // Accent colors
  accent:      PALETTE.cyan500,
  accentLight: PALETTE.cyan300,
  accentDark:  PALETTE.cyan700,
  accentSoft:  PALETTE.cyan50,

  // Semantic colors
  success:      PALETTE.emerald500,
  successLight: PALETTE.emerald100,
  warning:      PALETTE.amber500,
  warningLight: PALETTE.amber100,
  error:        PALETTE.rose500,
  errorLight:   PALETTE.rose100,

  // Highlight
  highlight:      PALETTE.amber500,
  highlightLight: PALETTE.amber200,
  highlightDark:  PALETTE.amber700,

  // Surface / Background
  background:  "#F0F2F8",
  cardBg:      PALETTE.white,

  // Text
  textPrimary:   PALETTE.slate900,
  textSecondary: PALETTE.slate500,
  textMuted:     PALETTE.slate400,
  textOnPrimary: PALETTE.white,

  // Analytics (dark surface)
  analyticsCardBg:    PALETTE.slate800,
  analyticsText:      PALETTE.white,
  analyticsSecondary: PALETTE.slate400,
  analyticsGrid:      PALETTE.slate700,

  // Border
  border:      PALETTE.slate200,
  borderLight: PALETTE.slate100,
  borderHover: PALETTE.indigo200,

  // Access to full palette
  palette: PALETTE,
};

// ---------------------------------------------------------------------------
// 3. TYPOGRAPHY TOKENS
// ---------------------------------------------------------------------------

export const TYPOGRAPHY = {
  fontFamily: "'Inter', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontFamilyMono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",

  // Font sizes (rem)
  size: {
    xs:   "0.75rem",    // 12px
    sm:   "0.8125rem",  // 13px
    base: "0.875rem",   // 14px
    md:   "1rem",       // 16px
    lg:   "1.125rem",   // 18px
    xl:   "1.25rem",    // 20px
    "2xl": "1.5rem",    // 24px
    "3xl": "1.875rem",  // 30px
    "4xl": "2.25rem",   // 36px
    "5xl": "3rem",      // 48px
  },

  // Font weights
  weight: {
    normal:   400,
    medium:   500,
    semibold: 600,
    bold:     700,
    extrabold: 800,
  },

  // Letter spacing
  tracking: {
    tighter: "-0.04em",
    tight:   "-0.025em",
    normal:  "0em",
    wide:    "0.025em",
    wider:   "0.05em",
    widest:  "0.1em",
  },

  // Line heights
  leading: {
    none:   1,
    tight:  1.25,
    snug:   1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose:  2,
  },

  // Heading presets
  h1: {
    fontSize: "2.25rem",
    fontWeight: 800,
    letterSpacing: "-0.04em",
    lineHeight: 1.2,
  },
  h2: {
    fontSize: "1.875rem",
    fontWeight: 700,
    letterSpacing: "-0.025em",
    lineHeight: 1.25,
  },
  h3: {
    fontSize: "1.5rem",
    fontWeight: 700,
    letterSpacing: "-0.025em",
    lineHeight: 1.3,
  },
  h4: {
    fontSize: "1.25rem",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    lineHeight: 1.35,
  },
  h5: {
    fontSize: "1.125rem",
    fontWeight: 600,
    letterSpacing: "-0.015em",
    lineHeight: 1.4,
  },
  h6: {
    fontSize: "1rem",
    fontWeight: 600,
    letterSpacing: "-0.01em",
    lineHeight: 1.5,
  },
  body1: {
    fontSize: "0.875rem",
    fontWeight: 400,
    letterSpacing: "0em",
    lineHeight: 1.5,
  },
  body2: {
    fontSize: "0.8125rem",
    fontWeight: 400,
    letterSpacing: "0em",
    lineHeight: 1.5,
  },
  caption: {
    fontSize: "0.75rem",
    fontWeight: 500,
    letterSpacing: "0.02em",
    lineHeight: 1.4,
  },
  overline: {
    fontSize: "0.6875rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
    lineHeight: 1.5,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: "2.5rem",
    fontWeight: 800,
    letterSpacing: "-0.04em",
    lineHeight: 1,
  },
};

// ---------------------------------------------------------------------------
// 4. SPACING SCALE
// ---------------------------------------------------------------------------

export const SPACING = {
  0:   "0px",
  0.5: "2px",
  1:   "4px",
  1.5: "6px",
  2:   "8px",
  2.5: "10px",
  3:   "12px",
  4:   "16px",
  5:   "20px",
  6:   "24px",
  7:   "28px",
  8:   "32px",
  9:   "36px",
  10:  "40px",
  12:  "48px",
  14:  "56px",
  16:  "64px",
  20:  "80px",
  24:  "96px",
};

// ---------------------------------------------------------------------------
// 5. BORDER RADIUS
// ---------------------------------------------------------------------------

export const RADIUS = {
  none: "0px",
  xs:   "4px",
  sm:   "6px",
  md:   "8px",
  lg:   "12px",
  xl:   "16px",
  "2xl": "20px",
  "3xl": "24px",
  full: "9999px",
};

// ---------------------------------------------------------------------------
// 6. SHADOWS — Multi-layered, realistic
// ---------------------------------------------------------------------------

export const SHADOWS = {
  // Subtle
  xs:  "0 1px 2px rgba(0, 0, 0, 0.04)",
  sm:  "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
  // Standard
  md:  "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
  lg:  "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)",
  xl:  "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
  // Colored
  primary: `0 4px 14px ${PALETTE.indigo600}25, 0 2px 6px ${PALETTE.indigo600}15`,
  primaryLg: `0 10px 40px ${PALETTE.indigo600}30, 0 4px 12px ${PALETTE.indigo600}15`,
  secondary: `0 4px 14px ${PALETTE.violet600}25, 0 2px 6px ${PALETTE.violet600}15`,
  accent: `0 4px 14px ${PALETTE.cyan500}25, 0 2px 6px ${PALETTE.cyan500}15`,
  success: `0 4px 14px ${PALETTE.emerald500}25`,
  warning: `0 4px 14px ${PALETTE.amber500}25`,
  error: `0 4px 14px ${PALETTE.rose500}25`,
  // Inset
  inner: "inset 0 2px 4px rgba(0, 0, 0, 0.05)",
  // Card specific
  card: "0 1px 3px rgba(0, 0, 0, 0.04), 0 6px 16px rgba(0, 0, 0, 0.04)",
  cardHover: "0 4px 12px rgba(0, 0, 0, 0.06), 0 16px 40px rgba(0, 0, 0, 0.08)",
  // Glow
  glowPrimary: `0 0 20px ${PALETTE.indigo600}40, 0 0 60px ${PALETTE.indigo600}15`,
  glowAccent: `0 0 20px ${PALETTE.cyan500}40, 0 0 60px ${PALETTE.cyan500}15`,
  glowSuccess: `0 0 20px ${PALETTE.emerald500}40`,
  glowWarning: `0 0 20px ${PALETTE.amber500}40`,
  glowError: `0 0 20px ${PALETTE.rose500}40`,
  // Dark mode variants
  dark: {
    sm: "0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.25)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.3)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
    card: "0 2px 8px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)",
    cardHover: "0 8px 20px rgba(0, 0, 0, 0.4), 0 20px 50px rgba(0, 0, 0, 0.3)",
  },
};

// ---------------------------------------------------------------------------
// 7. GRADIENTS
// ---------------------------------------------------------------------------

export const GRADIENTS = {
  // Primary gradients
  primary:      `linear-gradient(135deg, ${PALETTE.indigo600} 0%, ${PALETTE.violet600} 100%)`,
  primarySoft:  `linear-gradient(135deg, ${PALETTE.indigo50} 0%, ${PALETTE.violet50} 100%)`,
  primaryVibrant: `linear-gradient(135deg, ${PALETTE.indigo500} 0%, ${PALETTE.violet500} 50%, ${PALETTE.cyan500} 100%)`,

  // Secondary gradients
  secondary:    `linear-gradient(135deg, ${PALETTE.violet600} 0%, ${PALETTE.rose500} 100%)`,
  secondarySoft: `linear-gradient(135deg, ${PALETTE.violet50} 0%, ${PALETTE.rose50} 100%)`,

  // Accent gradients
  accent:       `linear-gradient(135deg, ${PALETTE.cyan500} 0%, ${PALETTE.indigo500} 100%)`,
  accentSoft:   `linear-gradient(135deg, ${PALETTE.cyan50} 0%, ${PALETTE.indigo50} 100%)`,
  accentVibrant: `linear-gradient(135deg, ${PALETTE.cyan400} 0%, ${PALETTE.indigo400} 100%)`,

  // Semantic gradients
  success:   `linear-gradient(135deg, ${PALETTE.emerald500} 0%, ${PALETTE.cyan500} 100%)`,
  warning:   `linear-gradient(135deg, ${PALETTE.amber500} 0%, ${PALETTE.rose400} 100%)`,
  error:     `linear-gradient(135deg, ${PALETTE.rose500} 0%, ${PALETTE.rose700} 100%)`,
  highlight: `linear-gradient(135deg, ${PALETTE.amber400} 0%, ${PALETTE.amber600} 100%)`,

  // Background mesh gradients
  meshLight: `radial-gradient(at 20% 80%, ${PALETTE.indigo100}60 0%, transparent 50%), radial-gradient(at 80% 20%, ${PALETTE.violet100}60 0%, transparent 50%), radial-gradient(at 50% 50%, ${PALETTE.cyan50}40 0%, transparent 60%)`,
  meshDark:  `radial-gradient(at 20% 80%, ${PALETTE.indigo900}40 0%, transparent 50%), radial-gradient(at 80% 20%, ${PALETTE.violet900}40 0%, transparent 50%), radial-gradient(at 50% 50%, ${PALETTE.cyan900}20 0%, transparent 60%)`,

  // Sidebar / Header
  sidebarDark:  `linear-gradient(180deg, ${PALETTE.slate900} 0%, #0B0F1A 100%)`,
  sidebarLight: `linear-gradient(180deg, ${PALETTE.white} 0%, ${PALETTE.slate50} 100%)`,
  headerBar:    `linear-gradient(135deg, ${PALETTE.indigo600} 0%, ${PALETTE.violet600} 50%, ${PALETTE.cyan600} 100%)`,

  // Card decorative gradients
  cardShine:    `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.05) 100%)`,
  cardBorder:   `linear-gradient(135deg, ${PALETTE.indigo400}40, ${PALETTE.violet400}20, ${PALETTE.cyan400}40)`,

  // Animated gradient preset (use with background-size: 200% and animation)
  animatedPrimary: `linear-gradient(270deg, ${PALETTE.indigo600}, ${PALETTE.violet600}, ${PALETTE.cyan500}, ${PALETTE.indigo600})`,
  animatedAccent:  `linear-gradient(270deg, ${PALETTE.cyan400}, ${PALETTE.indigo400}, ${PALETTE.violet400}, ${PALETTE.cyan400})`,

  // Glassmorphism overlay
  glassOverlay: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)",
  glassDark:    "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",

  // Stat card colored strips
  statIndigo:  `linear-gradient(135deg, ${PALETTE.indigo500}, ${PALETTE.indigo700})`,
  statViolet:  `linear-gradient(135deg, ${PALETTE.violet500}, ${PALETTE.violet700})`,
  statCyan:    `linear-gradient(135deg, ${PALETTE.cyan500}, ${PALETTE.cyan700})`,
  statEmerald: `linear-gradient(135deg, ${PALETTE.emerald500}, ${PALETTE.emerald700})`,
  statAmber:   `linear-gradient(135deg, ${PALETTE.amber500}, ${PALETTE.amber700})`,
  statRose:    `linear-gradient(135deg, ${PALETTE.rose500}, ${PALETTE.rose700})`,
};

// ---------------------------------------------------------------------------
// 8. GLASSMORPHISM TOKENS
// ---------------------------------------------------------------------------

export const GLASS = {
  light: {
    background: "rgba(255, 255, 255, 0.7)",
    backgroundHover: "rgba(255, 255, 255, 0.85)",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    borderSubtle: "1px solid rgba(0, 0, 0, 0.06)",
    backdropFilter: "blur(12px) saturate(180%)",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.03)",
  },
  dark: {
    background: "rgba(255, 255, 255, 0.04)",
    backgroundHover: "rgba(255, 255, 255, 0.07)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderSubtle: "1px solid rgba(255, 255, 255, 0.04)",
    backdropFilter: "blur(16px) saturate(180%)",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)",
  },
  frosted: {
    background: "rgba(255, 255, 255, 0.12)",
    backdropFilter: "blur(24px) saturate(200%)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
  },
};

// ---------------------------------------------------------------------------
// 9. ANIMATION TOKENS
// ---------------------------------------------------------------------------

export const ANIMATIONS = {
  // Duration
  duration: {
    instant: "50ms",
    fast:    "150ms",
    normal:  "250ms",
    slow:    "350ms",
    slower:  "500ms",
    slowest: "700ms",
  },

  // Easing curves
  easing: {
    default:    "cubic-bezier(0.4, 0, 0.2, 1)",
    easeIn:     "cubic-bezier(0.4, 0, 1, 1)",
    easeOut:    "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut:  "cubic-bezier(0.4, 0, 0.2, 1)",
    spring:     "cubic-bezier(0.34, 1.56, 0.64, 1)",
    bounce:     "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    smooth:     "cubic-bezier(0.25, 0.1, 0.25, 1)",
  },

  // Transition presets
  transition: {
    all:        "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
    fast:       "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow:       "all 350ms cubic-bezier(0.4, 0, 0.2, 1)",
    color:      "color 200ms ease, background-color 200ms ease",
    transform:  "transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1)",
    shadow:     "box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)",
    opacity:    "opacity 200ms ease",
    border:     "border-color 200ms ease",
    background: "background 300ms ease",
  },

  // Hover transforms
  hover: {
    lift:     "translateY(-4px)",
    liftSm:  "translateY(-2px)",
    scale:    "scale(1.02)",
    scaleSm:  "scale(1.01)",
    scaleLg:  "scale(1.04)",
  },

  // Stagger delay helper (returns delay for nth item)
  staggerDelay: (index, base = 60) => `${index * base}ms`,
};

// ---------------------------------------------------------------------------
// 10. CHART COLORS (Coordinated palette for data visualization)
// ---------------------------------------------------------------------------

export const CHART_COLORS = [
  PALETTE.indigo500,   // Deep indigo
  PALETTE.violet500,   // Violet
  PALETTE.cyan500,     // Electric cyan
  PALETTE.emerald500,  // Emerald
  PALETTE.amber500,    // Warm amber
  PALETTE.rose500,     // Soft rose
  PALETTE.indigo300,   // Light indigo
  PALETTE.violet300,   // Light violet
  PALETTE.cyan300,     // Light cyan
  PALETTE.emerald300,  // Light emerald
];

// Chart-specific gradient presets for area/bar charts
export const CHART_GRADIENTS = {
  indigo:  { start: PALETTE.indigo400, end: `${PALETTE.indigo600}20` },
  violet:  { start: PALETTE.violet400, end: `${PALETTE.violet600}20` },
  cyan:    { start: PALETTE.cyan400,   end: `${PALETTE.cyan600}20` },
  emerald: { start: PALETTE.emerald400, end: `${PALETTE.emerald600}20` },
  amber:   { start: PALETTE.amber400,  end: `${PALETTE.amber600}20` },
  rose:    { start: PALETTE.rose400,   end: `${PALETTE.rose600}20` },
};

// ---------------------------------------------------------------------------
// 11. CARD STYLES
// ---------------------------------------------------------------------------

export const CARD_STYLES = {
  // Base card — subtle elevation, smooth transitions
  base: {
    borderRadius: RADIUS.xl,
    border: `1px solid ${PALETTE.indigo100}30`,
    transition: ANIMATIONS.transition.all,
    backgroundColor: THEME.cardBg,
    boxShadow: SHADOWS.card,
    overflow: "hidden",
  },
  // Hover state
  hover: {
    transform: ANIMATIONS.hover.lift,
    boxShadow: SHADOWS.cardHover,
    borderColor: PALETTE.indigo200,
  },
  // Statistics card — slightly taller with accent strip
  statistics: {
    borderRadius: RADIUS.xl,
    height: "auto",
    minHeight: "140px",
    padding: "24px",
    transition: ANIMATIONS.transition.all,
    position: "relative",
    overflow: "hidden",
    backgroundColor: THEME.cardBg,
    boxShadow: SHADOWS.card,
    border: `1px solid ${PALETTE.indigo100}30`,
  },
  // Elevated card — stronger shadow presence
  elevated: {
    borderRadius: RADIUS.xl,
    border: `1px solid ${PALETTE.indigo100}20`,
    transition: ANIMATIONS.transition.all,
    backgroundColor: THEME.cardBg,
    boxShadow: SHADOWS.lg,
  },
  // Glass card — frosted glass effect (for light mode)
  glass: {
    borderRadius: RADIUS.xl,
    background: GLASS.light.background,
    backdropFilter: GLASS.light.backdropFilter,
    border: GLASS.light.borderSubtle,
    boxShadow: GLASS.light.boxShadow,
    transition: ANIMATIONS.transition.all,
  },
  // Gradient card — colored gradient background
  gradient: {
    borderRadius: RADIUS.xl,
    background: GRADIENTS.primary,
    color: PALETTE.white,
    border: "none",
    boxShadow: SHADOWS.primary,
    transition: ANIMATIONS.transition.all,
  },
  // Outlined card — no fill, border-only
  outlined: {
    borderRadius: RADIUS.xl,
    backgroundColor: "transparent",
    border: `1.5px solid ${PALETTE.indigo200}`,
    transition: ANIMATIONS.transition.all,
    "&:hover": {
      borderColor: PALETTE.indigo400,
      boxShadow: SHADOWS.primary,
    },
  },
  // Gradient-border card — transparent bg, gradient border effect
  gradientBorder: {
    borderRadius: RADIUS.xl,
    backgroundColor: THEME.cardBg,
    position: "relative",
    overflow: "hidden",
    boxShadow: SHADOWS.card,
    transition: ANIMATIONS.transition.all,
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      borderRadius: RADIUS.xl,
      padding: "1.5px",
      background: GRADIENTS.cardBorder,
      WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
      WebkitMaskComposite: "xor",
      maskComposite: "exclude",
      pointerEvents: "none",
    },
  },
};

// ---------------------------------------------------------------------------
// 12. BUTTON STYLES
// ---------------------------------------------------------------------------

export const BUTTON_STYLES = {
  base: {
    borderRadius: RADIUS.lg,
    textTransform: "none",
    fontWeight: TYPOGRAPHY.weight.semibold,
    fontSize: TYPOGRAPHY.size.base,
    letterSpacing: TYPOGRAPHY.tracking.tight,
    transition: ANIMATIONS.transition.all,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  // Primary — gradient with glow on hover
  primary: {
    borderRadius: RADIUS.lg,
    textTransform: "none",
    fontWeight: TYPOGRAPHY.weight.semibold,
    fontSize: TYPOGRAPHY.size.base,
    letterSpacing: TYPOGRAPHY.tracking.tight,
    background: GRADIENTS.primary,
    color: PALETTE.white,
    border: "none",
    boxShadow: SHADOWS.primary,
    transition: ANIMATIONS.transition.all,
    "&:hover": {
      boxShadow: SHADOWS.primaryLg,
      transform: ANIMATIONS.hover.liftSm,
    },
    "&:active": {
      transform: "translateY(0) scale(0.98)",
    },
  },
  // Secondary — outlined with primary colors
  secondary: {
    borderRadius: RADIUS.lg,
    textTransform: "none",
    fontWeight: TYPOGRAPHY.weight.semibold,
    fontSize: TYPOGRAPHY.size.base,
    letterSpacing: TYPOGRAPHY.tracking.tight,
    borderColor: PALETTE.indigo300,
    color: PALETTE.indigo600,
    backgroundColor: "transparent",
    transition: ANIMATIONS.transition.all,
    "&:hover": {
      borderColor: PALETTE.indigo500,
      backgroundColor: `${PALETTE.indigo50}`,
      boxShadow: `0 2px 8px ${PALETTE.indigo500}15`,
      transform: ANIMATIONS.hover.liftSm,
    },
  },
  // Ghost — minimal, no border
  ghost: {
    borderRadius: RADIUS.lg,
    textTransform: "none",
    fontWeight: TYPOGRAPHY.weight.medium,
    fontSize: TYPOGRAPHY.size.base,
    color: PALETTE.slate600,
    backgroundColor: "transparent",
    border: "none",
    transition: ANIMATIONS.transition.all,
    "&:hover": {
      backgroundColor: PALETTE.slate100,
      color: PALETTE.indigo600,
    },
  },
  // Accent — cyan gradient
  accent: {
    borderRadius: RADIUS.lg,
    textTransform: "none",
    fontWeight: TYPOGRAPHY.weight.semibold,
    fontSize: TYPOGRAPHY.size.base,
    background: GRADIENTS.accent,
    color: PALETTE.white,
    border: "none",
    boxShadow: SHADOWS.accent,
    transition: ANIMATIONS.transition.all,
    "&:hover": {
      boxShadow: `0 10px 40px ${PALETTE.cyan500}30`,
      transform: ANIMATIONS.hover.liftSm,
    },
  },
  // Danger — rose/red
  danger: {
    borderRadius: RADIUS.lg,
    textTransform: "none",
    fontWeight: TYPOGRAPHY.weight.semibold,
    fontSize: TYPOGRAPHY.size.base,
    background: GRADIENTS.error,
    color: PALETTE.white,
    border: "none",
    boxShadow: SHADOWS.error,
    transition: ANIMATIONS.transition.all,
    "&:hover": {
      boxShadow: `0 10px 40px ${PALETTE.rose500}30`,
      transform: ANIMATIONS.hover.liftSm,
    },
  },
  // Icon button
  icon: {
    borderRadius: RADIUS.lg,
    width: "40px",
    height: "40px",
    minWidth: "unset",
    padding: 0,
    transition: ANIMATIONS.transition.all,
    backgroundColor: "transparent",
    "&:hover": {
      backgroundColor: `${PALETTE.indigo50}`,
      transform: "scale(1.05)",
    },
  },
};

// ---------------------------------------------------------------------------
// 13. DIALOG STYLES
// ---------------------------------------------------------------------------

export const DIALOG_STYLES = {
  borderRadius: RADIUS["2xl"],
  maxWidth: "lg",
  boxShadow: SHADOWS["2xl"],
  border: `1px solid ${PALETTE.indigo100}30`,
  backdropFilter: "blur(8px)",
  backgroundColor: THEME.cardBg,
};

// ---------------------------------------------------------------------------
// 14. ANALYTICS CARD
// ---------------------------------------------------------------------------

export const ANALYTICS_CARD = {
  backgroundColor: PALETTE.slate800,
  color: PALETTE.white,
  borderRadius: RADIUS.xl,
  padding: "24px",
  boxShadow: SHADOWS.dark.card,
  border: `1px solid ${PALETTE.slate700}`,
  position: "relative",
  overflow: "hidden",
};

// ---------------------------------------------------------------------------
// 15. TABLE STYLES
// ---------------------------------------------------------------------------

export const TABLE_STYLES = {
  borderRadius: RADIUS.lg,
  overflow: "hidden",
  boxShadow: SHADOWS.card,
  border: `1px solid ${PALETTE.indigo100}20`,
  "& .MuiTableCell-head": {
    background: GRADIENTS.primary,
    color: PALETTE.white,
    fontWeight: TYPOGRAPHY.weight.semibold,
    fontSize: TYPOGRAPHY.size.sm,
    letterSpacing: TYPOGRAPHY.tracking.wide,
    textTransform: "uppercase",
    borderBottom: "none",
    padding: "14px 20px",
  },
  "& .MuiTableRow-root": {
    transition: ANIMATIONS.transition.fast,
    "&:hover": {
      backgroundColor: `${PALETTE.indigo50}80`,
    },
  },
  "& .MuiTableCell-body": {
    fontSize: TYPOGRAPHY.size.base,
    color: PALETTE.slate700,
    borderBottom: `1px solid ${PALETTE.slate100}`,
    padding: "14px 20px",
  },
};

// ---------------------------------------------------------------------------
// 16. STATUS TOKENS (for badges and indicators)
// ---------------------------------------------------------------------------

export const STATUS_COLORS = {
  available: {
    bg:    `${PALETTE.emerald500}15`,
    color: PALETTE.emerald600,
    glow:  `0 0 12px ${PALETTE.emerald500}30`,
    gradient: GRADIENTS.success,
  },
  onCall: {
    bg:    `${PALETTE.indigo500}15`,
    color: PALETTE.indigo600,
    glow:  `0 0 12px ${PALETTE.indigo500}30`,
    gradient: GRADIENTS.primary,
  },
  busy: {
    bg:    `${PALETTE.amber500}15`,
    color: PALETTE.amber600,
    glow:  `0 0 12px ${PALETTE.amber500}30`,
    gradient: GRADIENTS.warning,
  },
  offline: {
    bg:    `${PALETTE.slate400}12`,
    color: PALETTE.slate500,
    glow:  "none",
    gradient: `linear-gradient(135deg, ${PALETTE.slate400}, ${PALETTE.slate500})`,
  },
  error: {
    bg:    `${PALETTE.rose500}15`,
    color: PALETTE.rose600,
    glow:  `0 0 12px ${PALETTE.rose500}30`,
    gradient: GRADIENTS.error,
  },
  break: {
    bg:    `${PALETTE.amber600}15`,
    color: PALETTE.amber700,
    glow:  `0 0 12px ${PALETTE.amber600}30`,
    gradient: GRADIENTS.highlight,
  },
};

// ---------------------------------------------------------------------------
// 17. BREAKPOINTS
// ---------------------------------------------------------------------------

export const BREAKPOINTS = {
  xs:  "0px",
  sm:  "640px",
  md:  "768px",
  lg:  "1024px",
  xl:  "1280px",
  "2xl": "1536px",
};

// ---------------------------------------------------------------------------
// 18. Z-INDEX SCALE
// ---------------------------------------------------------------------------

export const Z_INDEX = {
  dropdown: 1000,
  sticky:   1100,
  fixed:    1200,
  backdrop: 1300,
  modal:    1400,
  popover:  1500,
  toast:    1600,
  tooltip:  1700,
};
