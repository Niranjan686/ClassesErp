import React, { useState } from 'react';
import { Box } from '@mui/material';
import Navbar from './Navbar';
import Sidebar, { DRAWER_WIDTH } from '../Dashboard/Sidebar';

/**
 * Standardized Admin Layout Component
 * Defines drawerWidth (260px) in a single place and ensures zero double-margin gap.
 */
const AdminLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleSidebar = () => {
    setMobileOpen(prev => !prev);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Top Navbar */}
      <Navbar onToggleSidebar={handleToggleSidebar} />

      {/* Unified White Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onToggleSidebar={handleToggleSidebar} />

      {/* Main Content Container - No double margin-left */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: { xs: 2, sm: 3, md: 3.5 },
          mt: '70px',
          boxSizing: 'border-box',
          overflowX: 'hidden'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
