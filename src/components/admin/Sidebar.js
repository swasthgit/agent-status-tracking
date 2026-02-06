import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  IconButton,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Groups as GroupsIcon,
  LocalHospital as ClinicIcon,
  Business as DepartmentIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { colors, transitions, sidebarStyles } from '../../theme/adminTheme';
import { fadeInLeft } from '../../styles/adminStyles';

const menuItems = [
  { id: 0, label: 'Overview', icon: DashboardIcon },
  { id: 1, label: 'User Management', icon: PeopleIcon },
  { id: 2, label: 'Team Management', icon: GroupsIcon },
  { id: 3, label: 'Clinic Mapping', icon: ClinicIcon },
  { id: 4, label: 'Departments', icon: DepartmentIcon },
];

const Sidebar = ({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  adminEmail,
  onLogout
}) => {
  const sidebarWidth = collapsed ? sidebarStyles.width.collapsed : sidebarStyles.width.expanded;

  return (
    <Box
      sx={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        height: '100vh',
        backgroundColor: sidebarStyles.background,
        borderRight: sidebarStyles.borderRight,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        transition: `width ${transitions.base}, min-width ${transitions.base}`,
        animation: `${fadeInLeft} 300ms ease`,
        zIndex: 1200,
        overflow: 'hidden',
      }}
    >
      {/* Logo Section */}
      <Box
        sx={{
          p: collapsed ? '16px 12px' : '20px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${colors.border.subtle}`,
          minHeight: '72px',
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            background: `linear-gradient(135deg, ${colors.accent.primary} 0%, ${colors.accent.secondary} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AdminIcon sx={{ color: '#fff', fontSize: 24 }} />
        </Box>
        {!collapsed && (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: colors.text.primary,
                fontSize: '1rem',
                whiteSpace: 'nowrap',
              }}
            >
              M-Swasth
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: colors.text.muted,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Admin Portal
            </Typography>
          </Box>
        )}
      </Box>

      {/* Navigation Menu */}
      <List sx={{ flex: 1, py: 2, px: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <Tooltip
              key={item.id}
              title={collapsed ? item.label : ''}
              placement="right"
              arrow
            >
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => onTabChange(item.id)}
                  sx={{
                    borderRadius: '10px',
                    py: 1.5,
                    px: collapsed ? 1.5 : 2,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    backgroundColor: isActive ? colors.accent.primaryLight : 'transparent',
                    borderLeft: isActive ? `3px solid ${colors.accent.primary}` : '3px solid transparent',
                    color: isActive ? colors.accent.primary : colors.text.muted,
                    transition: `all ${transitions.fast}`,
                    '&:hover': {
                      backgroundColor: isActive
                        ? colors.accent.primaryLight
                        : 'rgba(34,197,94,0.08)',
                      color: isActive ? colors.accent.primary : colors.text.secondary,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed ? 0 : 40,
                      color: 'inherit',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon sx={{ fontSize: 22 }} />
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: isActive ? 600 : 500,
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            </Tooltip>
          );
        })}
      </List>

      {/* Collapse Toggle */}
      <Box
        sx={{
          px: 1,
          py: 1,
          borderTop: `1px solid ${colors.border.subtle}`,
          borderBottom: `1px solid ${colors.border.subtle}`,
        }}
      >
        <Tooltip title={collapsed ? 'Expand' : 'Collapse'} placement="right">
          <IconButton
            onClick={onToggleCollapse}
            sx={{
              width: '100%',
              borderRadius: '10px',
              py: 1,
              color: colors.text.muted,
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: colors.text.secondary,
              },
            }}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Admin Profile Section */}
      <Box
        sx={{
          p: collapsed ? '12px' : '16px',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            backgroundColor: colors.accent.primaryLight,
            color: colors.accent.primary,
            fontSize: '0.875rem',
            fontWeight: 600,
            border: `2px solid ${colors.accent.primary}40`,
            flexShrink: 0,
          }}
        >
          {adminEmail?.charAt(0)?.toUpperCase() || 'A'}
        </Avatar>
        {!collapsed && (
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography
              variant="body2"
              sx={{
                color: colors.text.primary,
                fontWeight: 500,
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Admin
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: colors.text.muted,
                fontSize: '0.7rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block',
              }}
            >
              {adminEmail || 'admin@mswasth.com'}
            </Typography>
          </Box>
        )}
        <Tooltip title="Logout" placement="right">
          <IconButton
            onClick={onLogout}
            size="small"
            sx={{
              color: colors.text.muted,
              '&:hover': {
                backgroundColor: colors.accent.errorLight,
                color: colors.accent.error,
              },
            }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default Sidebar;
