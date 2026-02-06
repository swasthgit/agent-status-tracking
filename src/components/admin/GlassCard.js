import React from 'react';
import { Box } from '@mui/material';
import { colors, transitions } from '../../theme/adminTheme';
import { fadeInUp } from '../../styles/adminStyles';

const GlassCard = ({
  children,
  variant = 'default',
  hoverable = true,
  accentColor,
  accentPosition = 'top',
  animationDelay = 0,
  onClick,
  sx = {},
  ...props
}) => {
  const getBaseStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid rgba(255,255,255,0.1)`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        };
      case 'warning':
        return {
          background: colors.accent.warningLight,
          border: `1px solid ${colors.accent.warning}50`,
        };
      case 'outlined':
        return {
          background: 'transparent',
          border: `1px solid ${colors.border.cardHover}`,
        };
      default:
        return {
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${colors.border.card}`,
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
        };
    }
  };

  const getHoverStyles = () => {
    if (!hoverable) return {};
    return {
      '&:hover': {
        background: 'rgba(255,255,255,0.05)',
        borderColor: colors.border.cardHover,
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 40px rgba(0, 0, 0, 0.4)',
        ...(accentColor && {
          '&::before': {
            opacity: 1,
          },
        }),
      },
    };
  };

  const getAccentStyles = () => {
    if (!accentColor) return {};

    const positions = {
      top: {
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        width: '100%',
      },
      left: {
        top: 0,
        left: 0,
        bottom: 0,
        width: '3px',
        height: '100%',
      },
      bottom: {
        bottom: 0,
        left: 0,
        right: 0,
        height: '3px',
        width: '100%',
      },
    };

    return {
      '&::before': {
        content: '""',
        position: 'absolute',
        ...positions[accentPosition],
        background: accentColor,
        borderRadius: accentPosition === 'left' ? '16px 0 0 16px' : '16px 16px 0 0',
        opacity: hoverable ? 0 : 1,
        transition: `opacity ${transitions.fast}`,
      },
    };
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        ...getBaseStyles(),
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        transition: `all ${transitions.base}`,
        cursor: onClick ? 'pointer' : 'default',
        animation: `${fadeInUp} 400ms ease`,
        animationDelay: `${animationDelay}ms`,
        animationFillMode: 'both',
        ...getHoverStyles(),
        ...getAccentStyles(),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default GlassCard;
