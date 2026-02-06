import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { colors, transitions } from '../../theme/adminTheme';
import { fadeInUp } from '../../styles/adminStyles';
import GlassCard from './GlassCard';

// Custom hook for animated counter
const useAnimatedCounter = (endValue, duration = 1000, startAnimation = true) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!startAnimation || endValue === 0) {
      setCount(endValue);
      return;
    }

    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);

      // Easing function: easeOutCubic
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      const currentCount = Math.floor(easeOutCubic * endValue);

      if (currentCount !== countRef.current) {
        countRef.current = currentCount;
        setCount(currentCount);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    startTimeRef.current = null;
    requestAnimationFrame(animate);
  }, [endValue, duration, startAnimation]);

  return count;
};

const StatCard = ({
  label,
  value,
  icon: Icon,
  iconColor = colors.accent.primary,
  iconBgColor,
  trend,
  trendValue,
  accentColor,
  animationDelay = 0,
  onClick,
  sx = {},
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  // Intersection Observer to trigger animation when card is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const animatedValue = useAnimatedCounter(value, 1000, isVisible);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  return (
    <Box ref={cardRef}>
      <GlassCard
        variant="elevated"
        accentColor={accentColor}
        accentPosition="top"
        animationDelay={animationDelay}
        onClick={onClick}
        sx={{
          height: '100%',
          ...sx,
        }}
      >
        {/* Icon */}
        {Icon && (
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: iconBgColor || `${iconColor}20`,
              marginBottom: '16px',
              transition: `all ${transitions.fast}`,
            }}
          >
            <Icon sx={{ fontSize: 24, color: iconColor }} />
          </Box>
        )}

        {/* Label */}
        <Typography
          variant="caption"
          sx={{
            color: colors.text.muted,
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'block',
            marginBottom: '4px',
          }}
        >
          {label}
        </Typography>

        {/* Value */}
        <Typography
          variant="h3"
          sx={{
            color: colors.text.primary,
            fontSize: '2.25rem',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}
        >
          {formatNumber(animatedValue)}
        </Typography>

        {/* Trend */}
        {trend && (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '8px',
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: trend === 'up'
                ? 'rgba(34,197,94,0.1)'
                : 'rgba(239,68,68,0.1)',
            }}
          >
            {trend === 'up' ? (
              <TrendingUp sx={{ fontSize: 14, color: colors.accent.success }} />
            ) : (
              <TrendingDown sx={{ fontSize: 14, color: colors.accent.error }} />
            )}
            <Typography
              variant="caption"
              sx={{
                color: trend === 'up' ? colors.accent.success : colors.accent.error,
                fontWeight: 600,
                fontSize: '0.7rem',
              }}
            >
              {trendValue}
            </Typography>
          </Box>
        )}
      </GlassCard>
    </Box>
  );
};

export default StatCard;
export { useAnimatedCounter };
