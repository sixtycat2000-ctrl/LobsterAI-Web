import React from 'react';

interface SidebarToggleIconProps {
  className?: string;
  isCollapsed: boolean;
}

const SidebarToggleIcon: React.FC<SidebarToggleIconProps> = ({ className, isCollapsed }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {isCollapsed ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
    )}
  </svg>
);

export default SidebarToggleIcon;
