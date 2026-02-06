import { colors, transitions, glassStyles } from '../theme/adminTheme';
import { keyframes } from '@mui/system';

// Keyframe Animations
export const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

export const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const fadeInDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const fadeInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

export const slideInRight = keyframes`
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
`;

export const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

export const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

export const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

export const glow = keyframes`
  0%, 100% {
    box-shadow: 0 0 5px ${colors.accent.primary}40;
  }
  50% {
    box-shadow: 0 0 20px ${colors.accent.primary}60;
  }
`;

// Shared Styles
export const adminStyles = {
  // Page container
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: colors.background.primary,
    display: 'flex',
  },

  // Main content area (next to sidebar)
  mainContent: {
    flexGrow: 1,
    padding: '24px',
    marginLeft: '260px',
    transition: `margin-left ${transitions.base}`,
    minHeight: '100vh',
    backgroundColor: colors.background.primary,
  },

  mainContentCollapsed: {
    marginLeft: '72px',
  },

  // Page header
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    animation: `${fadeInDown} 400ms ease`,
    animationDelay: '100ms',
    animationFillMode: 'both',
  },

  pageTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: colors.text.primary,
    letterSpacing: '-0.02em',
  },

  // Glass card styles
  glassCard: {
    ...glassStyles.card,
    padding: '24px',
    '&:hover': {
      ...glassStyles.cardHover,
    },
  },

  glassCardStatic: {
    ...glassStyles.card,
    padding: '24px',
  },

  glassCardElevated: {
    ...glassStyles.cardElevated,
    padding: '24px',
  },

  // Stats card
  statsCard: {
    ...glassStyles.card,
    padding: '24px',
    cursor: 'default',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      ...glassStyles.cardHover,
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '3px',
      background: `linear-gradient(90deg, ${colors.accent.primary}, ${colors.accent.secondary})`,
      opacity: 0,
      transition: `opacity ${transitions.fast}`,
    },
    '&:hover::before': {
      opacity: 1,
    },
  },

  // Stats card with department color
  statsCardHealth: {
    '&::before': {
      background: colors.department.health,
    },
  },

  statsCardInsurance: {
    '&::before': {
      background: colors.department.insurance,
    },
  },

  statsCardDC: {
    '&::before': {
      background: colors.department.dc,
    },
  },

  // Stat value
  statValue: {
    fontSize: '2.5rem',
    fontWeight: 700,
    color: colors.text.primary,
    lineHeight: 1.2,
    marginTop: '8px',
  },

  statLabel: {
    fontSize: '0.875rem',
    color: colors.text.muted,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },

  statIcon: {
    width: 48,
    height: 48,
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: '16px',
    '& svg': {
      fontSize: '24px',
    },
  },

  // Trend indicator
  trendUp: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.75rem',
    color: colors.accent.success,
    marginTop: '8px',
  },

  trendDown: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.75rem',
    color: colors.accent.error,
    marginTop: '8px',
  },

  // Grid stats row
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '24px',
    marginBottom: '24px',
    '@media (max-width: 1200px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },

  // Charts container
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
    marginBottom: '24px',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },

  chartCard: {
    ...glassStyles.card,
    padding: '24px',
    height: '350px',
  },

  chartTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: colors.text.primary,
    marginBottom: '16px',
  },

  // Filter bar
  filterBar: {
    ...glassStyles.card,
    padding: '16px 24px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },

  searchInput: {
    flex: 1,
    minWidth: '200px',
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(255,255,255,0.03)',
    },
  },

  filterSelect: {
    minWidth: '150px',
  },

  // Table styles
  tableContainer: {
    ...glassStyles.card,
    padding: 0,
    overflow: 'hidden',
  },

  tableHeader: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },

  // View toggle
  viewToggle: {
    display: 'flex',
    gap: '8px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '8px',
    padding: '4px',
  },

  viewToggleButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    transition: `all ${transitions.fast}`,
    backgroundColor: 'transparent',
    color: colors.text.muted,
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
  },

  viewToggleButtonActive: {
    backgroundColor: colors.accent.primary,
    color: '#ffffff',
  },

  // User card (grid view)
  userCard: {
    ...glassStyles.card,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    '&:hover': {
      ...glassStyles.cardHover,
    },
  },

  // Department chip styles
  departmentChip: {
    borderRadius: '6px',
    fontWeight: 500,
    fontSize: '0.75rem',
  },

  healthChip: {
    backgroundColor: colors.department.healthLight,
    color: colors.department.health,
  },

  insuranceChip: {
    backgroundColor: colors.department.insuranceLight,
    color: colors.department.insurance,
  },

  dcChip: {
    backgroundColor: colors.department.dcLight,
    color: colors.department.dc,
  },

  // Status dot
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
    marginRight: '8px',
  },

  statusActive: {
    backgroundColor: colors.accent.success,
    boxShadow: `0 0 8px ${colors.accent.success}`,
  },

  statusInactive: {
    backgroundColor: colors.text.muted,
  },

  // System health status
  healthDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
    marginRight: '12px',
    animation: `${pulse} 2s ease-in-out infinite`,
  },

  healthDotSuccess: {
    backgroundColor: colors.accent.success,
    boxShadow: `0 0 10px ${colors.accent.success}`,
  },

  healthDotWarning: {
    backgroundColor: colors.accent.warning,
    boxShadow: `0 0 10px ${colors.accent.warning}`,
  },

  healthDotError: {
    backgroundColor: colors.accent.error,
    boxShadow: `0 0 10px ${colors.accent.error}`,
  },

  // Action buttons
  actionButton: {
    minWidth: 'auto',
    padding: '8px',
    borderRadius: '8px',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
  },

  // Dialog/Modal
  dialogContent: {
    padding: '24px',
    '& .MuiTextField-root': {
      marginBottom: '16px',
    },
  },

  dialogActions: {
    padding: '16px 24px',
    borderTop: `1px solid ${colors.border.subtle}`,
  },

  // Empty state
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    color: colors.text.muted,
  },

  emptyStateIcon: {
    fontSize: '64px',
    marginBottom: '16px',
    opacity: 0.5,
  },

  // Loading skeleton
  skeleton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    '&::after': {
      background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)`,
    },
  },

  // Animations for staggered items
  staggeredItem: (index) => ({
    animation: `${fadeInUp} 400ms ease`,
    animationDelay: `${index * 50}ms`,
    animationFillMode: 'both',
  }),

  // Quick action button
  quickActionButton: {
    ...glassStyles.card,
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    transition: `all ${transitions.fast}`,
    textDecoration: 'none',
    color: colors.text.primary,
    '&:hover': {
      ...glassStyles.cardHover,
      borderColor: colors.accent.primary,
    },
  },

  // Team card
  teamCard: {
    ...glassStyles.card,
    padding: '20px',
    borderLeft: `3px solid ${colors.accent.primary}`,
  },

  teamCardHealth: {
    borderLeftColor: colors.department.health,
  },

  teamCardInsurance: {
    borderLeftColor: colors.department.insurance,
  },

  // Drag and drop styles
  draggableItem: {
    ...glassStyles.card,
    padding: '12px 16px',
    cursor: 'grab',
    transition: `all ${transitions.fast}`,
    '&:active': {
      cursor: 'grabbing',
      transform: 'scale(1.02) rotate(2deg)',
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
    },
  },

  dropZone: {
    border: `2px dashed ${colors.border.card}`,
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
    transition: `all ${transitions.fast}`,
    minHeight: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.text.muted,
  },

  dropZoneActive: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primaryLight,
    boxShadow: `0 0 20px ${colors.accent.primary}40`,
  },

  // Warning card (unassigned agents)
  warningCard: {
    ...glassStyles.card,
    backgroundColor: colors.accent.warningLight,
    borderColor: `${colors.accent.warning}50`,
    padding: '20px',
  },

  // Department expandable card
  departmentCard: {
    ...glassStyles.card,
    padding: 0,
    overflow: 'hidden',
    marginBottom: '16px',
  },

  departmentCardHeader: {
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: `background-color ${transitions.fast}`,
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.02)',
    },
  },

  departmentCardContent: {
    padding: '0 24px 24px',
    borderTop: `1px solid ${colors.border.subtle}`,
  },

  // Progress bar
  progressBar: {
    height: '8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: `width ${transitions.slow}`,
  },

  // Pagination
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderTop: `1px solid ${colors.border.subtle}`,
  },

  // Activity item
  activityItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 0',
    borderBottom: `1px solid ${colors.border.subtle}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },

  activityDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: colors.accent.primary,
    marginTop: '6px',
    flexShrink: 0,
  },

  activityText: {
    flex: 1,
    fontSize: '0.875rem',
    color: colors.text.secondary,
  },

  activityTime: {
    fontSize: '0.75rem',
    color: colors.text.muted,
  },
};

// Helper function to get department color
export const getDepartmentColor = (department) => {
  switch (department?.toLowerCase()) {
    case 'health':
      return colors.department.health;
    case 'insurance':
      return colors.department.insurance;
    case 'dc':
    case 'offline visits':
      return colors.department.dc;
    default:
      return colors.accent.primary;
  }
};

// Helper function to get department background
export const getDepartmentBg = (department) => {
  switch (department?.toLowerCase()) {
    case 'health':
      return colors.department.healthLight;
    case 'insurance':
      return colors.department.insuranceLight;
    case 'dc':
    case 'offline visits':
      return colors.department.dcLight;
    default:
      return colors.accent.primaryLight;
  }
};

export default adminStyles;
