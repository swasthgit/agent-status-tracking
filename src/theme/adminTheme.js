import { createTheme, alpha } from '@mui/material/styles';

// Color Palette
export const colors = {
  // Background colors
  background: {
    primary: '#0A0A0A',
    secondary: '#121212',
    card: 'rgba(255,255,255,0.03)',
    cardHover: 'rgba(255,255,255,0.05)',
    elevated: 'rgba(255,255,255,0.05)',
  },

  // Border colors
  border: {
    subtle: 'rgba(255,255,255,0.06)',
    card: 'rgba(255,255,255,0.08)',
    cardHover: 'rgba(255,255,255,0.12)',
    focus: 'rgba(34,197,94,0.5)',
  },

  // Accent colors
  accent: {
    primary: '#22C55E',        // Forest Green
    primaryHover: '#16A34A',
    primaryLight: 'rgba(34,197,94,0.15)',
    secondary: '#14B8A6',      // Teal
    secondaryLight: 'rgba(20,184,166,0.15)',
    purple: '#A855F7',         // Purple
    purpleLight: 'rgba(168,85,247,0.15)',
    cyan: '#06B6D4',           // Cyan
    cyanLight: 'rgba(6,182,212,0.15)',
    warning: '#F59E0B',
    warningLight: 'rgba(245,158,11,0.1)',
    error: '#EF4444',
    errorLight: 'rgba(239,68,68,0.15)',
    success: '#22C55E',
  },

  // Department colors
  department: {
    health: '#14B8A6',
    healthLight: 'rgba(20,184,166,0.15)',
    insurance: '#A855F7',
    insuranceLight: 'rgba(168,85,247,0.15)',
    dc: '#06B6D4',
    dcLight: 'rgba(6,182,212,0.15)',
    management: '#22C55E',
    managementLight: 'rgba(34,197,94,0.15)',
  },

  // Text colors
  text: {
    primary: '#FAFAFA',
    secondary: 'rgba(255,255,255,0.7)',
    muted: 'rgba(255,255,255,0.5)',
    disabled: 'rgba(255,255,255,0.3)',
  },
};

// Transition timings
export const transitions = {
  fast: '150ms ease',
  base: '300ms ease',
  slow: '500ms ease',
  bounce: '400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

// Glassmorphism styles
export const glassStyles = {
  card: {
    background: colors.background.card,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: `1px solid ${colors.border.card}`,
    borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
    transition: `all ${transitions.base}`,
  },
  cardHover: {
    background: colors.background.cardHover,
    borderColor: colors.border.cardHover,
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 40px rgba(0, 0, 0, 0.4)',
  },
  cardElevated: {
    background: colors.background.elevated,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: `1px solid ${colors.border.cardHover}`,
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
};

// Sidebar styles
export const sidebarStyles = {
  width: {
    expanded: 260,
    collapsed: 72,
  },
  background: colors.background.secondary,
  borderRight: `1px solid ${colors.border.subtle}`,
};

// Create MUI Theme
const adminTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.accent.primary,
      light: colors.accent.primaryLight,
      dark: colors.accent.primaryHover,
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.accent.secondary,
      light: colors.accent.secondaryLight,
    },
    error: {
      main: colors.accent.error,
      light: colors.accent.errorLight,
    },
    warning: {
      main: colors.accent.warning,
      light: colors.accent.warningLight,
    },
    success: {
      main: colors.accent.success,
    },
    info: {
      main: colors.accent.cyan,
      light: colors.accent.cyanLight,
    },
    background: {
      default: colors.background.primary,
      paper: colors.background.secondary,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
      disabled: colors.text.disabled,
    },
    divider: colors.border.subtle,
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: colors.text.primary,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      color: colors.text.primary,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: colors.text.primary,
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 600,
      color: colors.text.primary,
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600,
      color: colors.text.primary,
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600,
      color: colors.text.primary,
    },
    body1: {
      fontSize: '1rem',
      color: colors.text.secondary,
    },
    body2: {
      fontSize: '0.875rem',
      color: colors.text.secondary,
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: colors.text.muted,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.background.primary,
          scrollbarWidth: 'thin',
          scrollbarColor: `${colors.border.card} ${colors.background.primary}`,
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: colors.background.primary,
          },
          '&::-webkit-scrollbar-thumb': {
            background: colors.border.card,
            borderRadius: '4px',
            '&:hover': {
              background: colors.border.cardHover,
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '10px 20px',
          transition: `all ${transitions.fast}`,
          '&:hover': {
            transform: 'scale(1.02)',
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: `0 4px 20px ${alpha(colors.accent.primary, 0.4)}`,
          },
        },
        outlined: {
          borderColor: colors.accent.primary,
          '&:hover': {
            borderColor: colors.accent.primary,
            backgroundColor: colors.accent.primaryLight,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: colors.background.card,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${colors.border.card}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          ...glassStyles.card,
          '&:hover': glassStyles.cardHover,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            '& fieldset': {
              borderColor: colors.border.card,
              transition: `all ${transitions.fast}`,
            },
            '&:hover fieldset': {
              borderColor: colors.border.cardHover,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.accent.primary,
              boxShadow: `0 0 0 3px ${alpha(colors.accent.primary, 0.2)}`,
            },
          },
          '& .MuiInputLabel-root': {
            color: colors.text.muted,
            '&.Mui-focused': {
              color: colors.accent.primary,
            },
          },
          '& .MuiInputBase-input': {
            color: colors.text.primary,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.border.card,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.border.cardHover,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.accent.primary,
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.background.secondary,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${colors.border.card}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: colors.accent.primaryLight,
          },
          '&.Mui-selected': {
            backgroundColor: colors.accent.primaryLight,
            '&:hover': {
              backgroundColor: colors.accent.primaryLight,
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          ...glassStyles.card,
          backgroundColor: colors.background.secondary,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          color: colors.text.primary,
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.05)',
          '& .MuiTableCell-head': {
            color: colors.text.muted,
            fontWeight: 600,
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
            borderBottom: `1px solid ${colors.border.subtle}`,
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            transition: `background-color ${transitions.fast}`,
            '&:hover': {
              backgroundColor: 'rgba(34,197,94,0.05)',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${colors.border.subtle}`,
          color: colors.text.secondary,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          fontWeight: 500,
        },
        filled: {
          backgroundColor: 'rgba(255,255,255,0.1)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.background.secondary,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${colors.border.card}`,
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          color: colors.text.primary,
          fontSize: '0.75rem',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: '40px',
        },
        indicator: {
          backgroundColor: colors.accent.primary,
          height: '3px',
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: '40px',
          textTransform: 'none',
          fontWeight: 500,
          color: colors.text.muted,
          '&.Mui-selected': {
            color: colors.accent.primary,
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: `2px solid ${colors.border.card}`,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: colors.text.secondary,
          transition: `all ${transitions.fast}`,
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: colors.text.primary,
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '4px',
        },
        bar: {
          borderRadius: '4px',
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.05)',
        },
      },
    },
  },
});

export default adminTheme;
