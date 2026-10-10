import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Drawer, List, ListItemButton, ListItemIcon, ListItemText, Box, Divider,
    Typography, Collapse, useMediaQuery, useTheme, IconButton
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTableCellsLarge, faBookOpen, faUserGroup, faCreditCard,
    faFileLines, faShieldHalved, faDatabase, faCalendarDays,
    faGear, faRightFromBracket, faChevronDown, faChevronUp,
    faChevronRight, faChevronLeft, faGraduationCap, faIdCard,
    faReceipt, faAward, faChalkboardUser, faSchool, faBell, faComments
} from '@fortawesome/free-solid-svg-icons';

export const DRAWER_WIDTH = 260;

const Sidebar = ({ mobileOpen, onToggleSidebar }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Open sub-menu accordion states
    const [openSubMenu, setOpenSubMenu] = useState({
        students: true,
        staff: false,
        fees: false,
        marksheet: false,
        school: false,
        masters: false,
        leaves: false
    });

    const toggleSubMenu = (menuKey) => {
        setOpenSubMenu(prev => ({ ...prev, [menuKey]: !prev[menuKey] }));
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('student_token');
        localStorage.removeItem('student_user');
        localStorage.removeItem('institute');
        navigate('/login');
    };

    const isPathActive = (path) => location.pathname === path;

    const drawerContent = (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#ffffff',
                color: '#1e293b',
                borderRight: '1px solid #e2e8f0',
                position: 'relative',
                overflowX: 'hidden'
            }}
        >
            {/* Top Logo Section: ClassTech Branding */}
            <Box sx={{ p: '20px 18px 16px 18px', textAlign: 'center', position: 'relative', borderBottom: '1px solid #f1f5f9' }}>
                <Box display="flex" justifyContent="center" alignItems="center" gap={1.5} mb={0.75}>
                    <Box
                        sx={{
                            width: 38,
                            height: 38,
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                        }}
                    >
                        <FontAwesomeIcon icon={faGraduationCap} />
                    </Box>
                    <Box textAlign="left">
                        <Box display="flex" alignItems="center" gap={0.5}>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 900,
                                    letterSpacing: '-0.5px',
                                    fontFamily: 'Inter, sans-serif',
                                    color: '#0f172a',
                                    lineHeight: 1.1,
                                    fontSize: '19px'
                                }}
                            >
                                ClassTech
                            </Typography>
                            <Box
                                sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: '#2563eb',
                                    display: 'inline-block'
                                }}
                            />
                        </Box>
                        <Typography
                            variant="caption"
                            sx={{
                                color: '#64748b',
                                fontSize: '10px',
                                fontWeight: 700,
                                letterSpacing: '0.3px',
                                textTransform: 'uppercase'
                            }}
                        >
                            Coaching Cloud
                        </Typography>
                    </Box>
                </Box>

                {/* Sub-label capsule pill */}
                <Box
                    sx={{
                        display: 'inline-block',
                        bgcolor: '#f1f5f9',
                        border: '1px solid #e2e8f0',
                        borderRadius: '20px',
                        px: 1.5,
                        py: 0.25,
                        mt: 0.5
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            color: '#475569',
                            fontSize: '9.5px',
                            fontWeight: 800,
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase'
                        }}
                    >
                        SaaS ERP Platform
                    </Typography>
                </Box>
            </Box>

            {/* Menu List */}
            <List sx={{ px: 1.5, py: 1.5, flexGrow: 1, overflowY: 'auto' }}>
                {/* 1. Dashboard */}
                <ListItemButton
                    component={Link}
                    to="/dashboard"
                    onClick={() => isMobile && onToggleSidebar && onToggleSidebar()}
                    sx={{
                        borderRadius: '10px',
                        mb: 0.5,
                        py: 0.9,
                        px: 1.5,
                        bgcolor: isPathActive('/dashboard') ? '#eff6ff' : 'transparent',
                        color: isPathActive('/dashboard') ? '#2563eb' : '#475569',
                        border: isPathActive('/dashboard') ? '1px solid #bfdbfe' : '1px solid transparent',
                        '&:hover': { bgcolor: isPathActive('/dashboard') ? '#eff6ff' : '#f8fafc', color: '#0f172a' }
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 32, color: isPathActive('/dashboard') ? '#2563eb' : '#64748b' }}>
                        <FontAwesomeIcon icon={faTableCellsLarge} />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard" primaryTypographyProps={{ fontSize: '13px', fontWeight: isPathActive('/dashboard') ? 800 : 600 }} />
                </ListItemButton>

                {/* 2. Students (Expandable) */}
                <ListItemButton
                    onClick={() => toggleSubMenu('students')}
                    sx={{
                        borderRadius: '10px',
                        mb: 0.5,
                        py: 0.9,
                        px: 1.5,
                        color: (location.pathname.startsWith('/students') || location.pathname.startsWith('/student-master')) ? '#2563eb' : '#475569',
                        bgcolor: (location.pathname.startsWith('/students') || location.pathname.startsWith('/student-master')) ? '#f8fafc' : 'transparent',
                        '&:hover': { bgcolor: '#f8fafc', color: '#0f172a' }
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 32, color: (location.pathname.startsWith('/students') || location.pathname.startsWith('/student-master')) ? '#2563eb' : '#64748b' }}>
                        <FontAwesomeIcon icon={faBookOpen} />
                    </ListItemIcon>
                    <ListItemText primary="Students" primaryTypographyProps={{ fontSize: '13px', fontWeight: 700 }} />
                    <FontAwesomeIcon icon={openSubMenu.students ? faChevronDown : faChevronRight} style={{ fontSize: '10px', color: '#94a3b8' }} />
                </ListItemButton>
                <Collapse in={openSubMenu.students} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ pl: 3.5, mb: 0.5 }}>
                        <ListItemButton
                            component={Link}
                            to="/students"
                            onClick={() => isMobile && onToggleSidebar && onToggleSidebar()}
                            sx={{
                                py: 0.6,
                                borderRadius: '8px',
                                mb: 0.2,
                                color: isPathActive('/students') ? '#2563eb' : '#64748b',
                                bgcolor: isPathActive('/students') ? '#eff6ff' : 'transparent',
                                fontWeight: isPathActive('/students') ? 700 : 500,
                                '&:hover': { color: '#0f172a', bgcolor: '#f8fafc' }
                            }}
                        >
                            <ListItemText primary="• Student Roster & IDs" primaryTypographyProps={{ fontSize: '12.5px', fontWeight: isPathActive('/students') ? 700 : 500 }} />
                        </ListItemButton>
                        <ListItemButton
                            component={Link}
                            to="/student-master"
                            onClick={() => isMobile && onToggleSidebar && onToggleSidebar()}
                            sx={{
                                py: 0.6,
                                borderRadius: '8px',
                                mb: 0.2,
                                color: isPathActive('/student-master') ? '#2563eb' : '#64748b',
                                bgcolor: isPathActive('/student-master') ? '#eff6ff' : 'transparent',
                                '&:hover': { color: '#0f172a', bgcolor: '#f8fafc' }
                            }}
                        >
                            <ListItemText primary="• Admission Master" primaryTypographyProps={{ fontSize: '12.5px', fontWeight: isPathActive('/student-master') ? 700 : 500 }} />
                        </ListItemButton>
                    </List>
                </Collapse>

                {/* 3. Staff & HR (Expandable) */}
                <ListItemButton
                    onClick={() => toggleSubMenu('staff')}
                    sx={{
                        borderRadius: '10px',
                        mb: 0.5,
                        py: 0.9,
                        px: 1.5,
                        color: location.pathname === '/staff-master' ? '#2563eb' : '#475569',
                        '&:hover': { bgcolor: '#f8fafc', color: '#0f172a' }
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 32, color: location.pathname === '/staff-master' ? '#2563eb' : '#64748b' }}>
                        <FontAwesomeIcon icon={faUserGroup} />
                    </ListItemIcon>
                    <ListItemText primary="Staff & HR" primaryTypographyProps={{ fontSize: '13px', fontWeight: 700 }} />
                    <FontAwesomeIcon icon={openSubMenu.staff ? faChevronDown : faChevronRight} style={{ fontSize: '10px', color: '#94a3b8' }} />
                </ListItemButton>
                <Collapse in={openSubMenu.staff} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ pl: 3.5, mb: 0.5 }}>
                        <ListItemButton
                            component={Link}
                            to="/staff-master"
                            onClick={() => isMobile && onToggleSidebar && onToggleSidebar()}
                            sx={{
                                py: 0.6,
                                borderRadius: '8px',
                                color: isPathActive('/staff-master') ? '#2563eb' : '#64748b',
                                bgcolor: isPathActive('/staff-master') ? '#eff6ff' : 'transparent',
                                '&:hover': { color: '#0f172a', bgcolor: '#f8fafc' }
                            }}
                        >
                            <ListItemText primary="• Faculty Directory" primaryTypographyProps={{ fontSize: '12.5px', fontWeight: isPathActive('/staff-master') ? 700 : 500 }} />
                        </ListItemButton>
                    </List>
                </Collapse>

                {/* 4. Fee Management (Expandable) */}
                <ListItemButton
                    onClick={() => toggleSubMenu('fees')}
                    sx={{
                        borderRadius: '10px',
                        mb: 0.5,
                        py: 0.9,
                        px: 1.5,
                        color: location.pathname === '/fee-management' ? '#2563eb' : '#475569',
                        '&:hover': { bgcolor: '#f8fafc', color: '#0f172a' }
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 32, color: location.pathname === '/fee-management' ? '#2563eb' : '#64748b' }}>
                        <FontAwesomeIcon icon={faCreditCard} />
                    </ListItemIcon>
                    <ListItemText primary="Fee Management" primaryTypographyProps={{ fontSize: '13px', fontWeight: 700 }} />
                    <FontAwesomeIcon icon={openSubMenu.fees ? faChevronDown : faChevronRight} style={{ fontSize: '10px', color: '#94a3b8' }} />
                </ListItemButton>
                <Collapse in={openSubMenu.fees} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ pl: 3.5, mb: 0.5 }}>
                        <ListItemButton
                            component={Link}
                            to="/fee-management"
                            onClick={() => isMobile && onToggleSidebar && onToggleSidebar()}
                            sx={{
                                py: 0.6,
                                borderRadius: '8px',
                                color: isPathActive('/fee-management') ? '#2563eb' : '#64748b',
                                bgcolor: isPathActive('/fee-management') ? '#eff6ff' : 'transparent',
                                '&:hover': { color: '#0f172a', bgcolor: '#f8fafc' }
                            }}
                        >
                            <ListItemText primary="• Fee Ledger & Receipts" primaryTypographyProps={{ fontSize: '12.5px', fontWeight: isPathActive('/fee-management') ? 700 : 500 }} />
                        </ListItemButton>
                    </List>
                </Collapse>

                {/* 5. Marksheet (Expandable) */}
                <ListItemButton
                    onClick={() => toggleSubMenu('marksheet')}
                    sx={{
                        borderRadius: '10px',
                        mb: 0.5,
                        py: 0.9,
                        px: 1.5,
                        color: location.pathname === '/marks-entry' ? '#2563eb' : '#475569',
                        '&:hover': { bgcolor: '#f8fafc', color: '#0f172a' }
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 32, color: location.pathname === '/marks-entry' ? '#2563eb' : '#64748b' }}>
                        <FontAwesomeIcon icon={faFileLines} />
                    </ListItemIcon>
                    <ListItemText primary="Marksheet" primaryTypographyProps={{ fontSize: '13px', fontWeight: 700 }} />
                    <FontAwesomeIcon icon={openSubMenu.marksheet ? faChevronDown : faChevronRight} style={{ fontSize: '10px', color: '#94a3b8' }} />
                </ListItemButton>
                <Collapse in={openSubMenu.marksheet} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ pl: 3.5, mb: 0.5 }}>
                        <ListItemButton
                            component={Link}
                            to="/marks-entry"
                            onClick={() => isMobile && onToggleSidebar && onToggleSidebar()}
                            sx={{
                                py: 0.6,
                                borderRadius: '8px',
                                color: isPathActive('/marks-entry') ? '#2563eb' : '#64748b',
                                bgcolor: isPathActive('/marks-entry') ? '#eff6ff' : 'transparent',
                                '&:hover': { color: '#0f172a', bgcolor: '#f8fafc' }
                            }}
                        >
                            <ListItemText primary="• Marks Entry & Scorecards" primaryTypographyProps={{ fontSize: '12.5px', fontWeight: isPathActive('/marks-entry') ? 700 : 500 }} />
                        </ListItemButton>
                    </List>
                </Collapse>

                {/* 6. School / Institute Managements (Expandable) */}
                <ListItemButton
                    onClick={() => toggleSubMenu('school')}
                    sx={{
                        borderRadius: '10px',
                        mb: 0.5,
                        py: 0.9,
                        px: 1.5,
                        color: (location.pathname === '/attendance-entry' || location.pathname === '/attendance-monthly' || location.pathname === '/reports') ? '#2563eb' : '#475569',
                        '&:hover': { bgcolor: '#f8fafc', color: '#0f172a' }
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 32, color: (location.pathname === '/attendance-entry' || location.pathname === '/attendance-monthly' || location.pathname === '/reports') ? '#2563eb' : '#64748b' }}>
                        <FontAwesomeIcon icon={faShieldHalved} />
                    </ListItemIcon>
                    <ListItemText primary="Attendance & Class" primaryTypographyProps={{ fontSize: '13px', fontWeight: 700 }} />
                    <FontAwesomeIcon icon={openSubMenu.school ? faChevronDown : faChevronRight} style={{ fontSize: '10px', color: '#94a3b8' }} />
                </ListItemButton>
                <Collapse in={openSubMenu.school} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ pl: 3.5, mb: 0.5 }}>
                        <ListItemButton
                            component={Link}
                            to="/attendance-entry"
                            onClick={() => isMobile && onToggleSidebar && onToggleSidebar()}
                            sx={{
                                py: 0.6,
                                borderRadius: '8px',
                                color: isPathActive('/attendance-entry') ? '#2563eb' : '#64748b',
                                bgcolor: isPathActive('/attendance-entry') ? '#eff6ff' : 'transparent',
                                '&:hover': { color: '#0f172a', bgcolor: '#f8fafc' }
                            }}
                        >
                            <ListItemText primary="• Daily Attendance Sheet" primaryTypographyProps={{ fontSize: '12.5px', fontWeight: isPathActive('/attendance-entry') ? 700 : 500 }} />
                        </ListItemButton>
                        <ListItemButton
                            component={Link}
                            to="/attendance-monthly"
                            onClick={() => isMobile && onToggleSidebar && onToggleSidebar()}
                            sx={{
                                py: 0.6,
                                borderRadius: '8px',
                                color: isPathActive('/attendance-monthly') ? '#2563eb' : '#64748b',
                                bgcolor: isPathActive('/attendance-monthly') ? '#eff6ff' : 'transparent',
                                '&:hover': { color: '#0f172a', bgcolor: '#f8fafc' }
                            }}
                        >
                            <ListItemText primary="• Monthly Matrix Grid" primaryTypographyProps={{ fontSize: '12.5px', fontWeight: isPathActive('/attendance-monthly') ? 700 : 500 }} />
                        </ListItemButton>
                        <ListItemButton
                            component={Link}
                            to="/reports"
                            onClick={() => isMobile && onToggleSidebar && onToggleSidebar()}
                            sx={{
                                py: 0.6,
                                borderRadius: '8px',
                                color: isPathActive('/reports') ? '#2563eb' : '#64748b',
                                bgcolor: isPathActive('/reports') ? '#eff6ff' : 'transparent',
                                '&:hover': { color: '#0f172a', bgcolor: '#f8fafc' }
                            }}
                        >
                            <ListItemText primary="• Attendance Reports & Defaulters" primaryTypographyProps={{ fontSize: '12.5px', fontWeight: isPathActive('/reports') ? 700 : 500 }} />
                        </ListItemButton>
                    </List>
                </Collapse>

                {/* 7. General Masters & Config (Expandable) */}
                <ListItemButton
                    onClick={() => toggleSubMenu('masters')}
                    sx={{
                        borderRadius: '10px',
                        mb: 0.5,
                        py: 0.9,
                        px: 1.5,
                        color: (location.pathname === '/batch-master' || location.pathname === '/course-master' || location.pathname === '/live-classes' || location.pathname === '/study-notes' || location.pathname === '/demo-schedule' || location.pathname === '/enquiries') ? '#2563eb' : '#475569',
                        '&:hover': { bgcolor: '#f8fafc', color: '#0f172a' }
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 32, color: '#64748b' }}>
                        <FontAwesomeIcon icon={faDatabase} />
                    </ListItemIcon>
                    <ListItemText primary="Masters & Config" primaryTypographyProps={{ fontSize: '13px', fontWeight: 700 }} />
                    <FontAwesomeIcon icon={openSubMenu.masters ? faChevronDown : faChevronRight} style={{ fontSize: '10px', color: '#94a3b8' }} />
                </ListItemButton>
                <Collapse in={openSubMenu.masters} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ pl: 3.5, mb: 0.5 }}>
                        <ListItemButton
                            component={Link}
                            to="/batch-master"
                            onClick={() => isMobile && onToggleSidebar && onToggleSidebar()}
                            sx={{
                                py: 0.6,
                                borderRadius: '8px',
                                color: isPathActive('/batch-master') ? '#2563eb' : '#64748b',
                                bgcolor: isPathActive('/batch-master') ? '#eff6ff' : 'transparent',
                                '&:hover': { color: '#0f172a', bgcolor: '#f8fafc' }
                            }}
                        >
                            <ListItemText primary="• Batch Masters" primaryTypographyProps={{ fontSize: '12.5px', fontWeight: isPathActive('/batch-master') ? 700 : 500 }} />
                        </ListItemButton>
                        <ListItemButton
                            component={Link}
                            to="/course-master"
                            onClick={() => isMobile && onToggleSidebar && onToggleSidebar()}
                            sx={{
                                py: 0.6,
                                borderRadius: '8px',
                                color: isPathActive('/course-master') ? '#2563eb' : '#64748b',
                                bgcolor: isPathActive('/course-master') ? '#eff6ff' : 'transparent',
                                '&:hover': { color: '#0f172a', bgcolor: '#f8fafc' }
                            }}
                        >
                            <ListItemText primary="• Course Syllabus" primaryTypographyProps={{ fontSize: '12.5px', fontWeight: isPathActive('/course-master') ? 700 : 500 }} />
                        </ListItemButton>
                        <ListItemButton
                            component={Link}
                            to="/live-classes"
                            onClick={() => isMobile && onToggleSidebar && onToggleSidebar()}
                            sx={{
                                py: 0.6,
                                borderRadius: '8px',
                                color: isPathActive('/live-classes') ? '#2563eb' : '#64748b',
                                bgcolor: isPathActive('/live-classes') ? '#eff6ff' : 'transparent',
                                '&:hover': { color: '#0f172a', bgcolor: '#f8fafc' }
                            }}
                        >
                            <ListItemText primary="• Live Video Classes" primaryTypographyProps={{ fontSize: '12.5px', fontWeight: isPathActive('/live-classes') ? 700 : 500 }} />
                        </ListItemButton>
                        <ListItemButton
                            component={Link}
                            to="/study-notes"
                            onClick={() => isMobile && onToggleSidebar && onToggleSidebar()}
                            sx={{
                                py: 0.6,
                                borderRadius: '8px',
                                color: isPathActive('/study-notes') ? '#2563eb' : '#64748b',
                                bgcolor: isPathActive('/study-notes') ? '#eff6ff' : 'transparent',
                                '&:hover': { color: '#0f172a', bgcolor: '#f8fafc' }
                            }}
                        >
                            <ListItemText primary="• Digital Notes & Docs" primaryTypographyProps={{ fontSize: '12.5px', fontWeight: isPathActive('/study-notes') ? 700 : 500 }} />
                        </ListItemButton>
                        <ListItemButton
                            component={Link}
                            to="/demo-schedule"
                            onClick={() => isMobile && onToggleSidebar && onToggleSidebar()}
                            sx={{
                                py: 0.6,
                                borderRadius: '8px',
                                color: isPathActive('/demo-schedule') ? '#2563eb' : '#64748b',
                                bgcolor: isPathActive('/demo-schedule') ? '#eff6ff' : 'transparent',
                                '&:hover': { color: '#0f172a', bgcolor: '#f8fafc' }
                            }}
                        >
                            <ListItemText primary="• Demo Scheduler" primaryTypographyProps={{ fontSize: '12.5px', fontWeight: isPathActive('/demo-schedule') ? 700 : 500 }} />
                        </ListItemButton>
                        <ListItemButton
                            component={Link}
                            to="/enquiries"
                            onClick={() => isMobile && onToggleSidebar && onToggleSidebar()}
                            sx={{
                                py: 0.6,
                                borderRadius: '8px',
                                color: isPathActive('/enquiries') ? '#2563eb' : '#64748b',
                                bgcolor: isPathActive('/enquiries') ? '#eff6ff' : 'transparent',
                                '&:hover': { color: '#0f172a', bgcolor: '#f8fafc' }
                            }}
                        >
                            <ListItemText primary="• Admission CRM" primaryTypographyProps={{ fontSize: '12.5px', fontWeight: isPathActive('/enquiries') ? 700 : 500 }} />
                        </ListItemButton>
                    </List>
                </Collapse>

                {/* 8. Leave Management (Expandable) */}
                <ListItemButton
                    onClick={() => toggleSubMenu('leaves')}
                    sx={{
                        borderRadius: '10px',
                        mb: 0.5,
                        py: 0.9,
                        px: 1.5,
                        color: (location.pathname === '/leave-management' || location.pathname === '/complaints') ? '#2563eb' : '#475569',
                        '&:hover': { bgcolor: '#f8fafc', color: '#0f172a' }
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 32, color: '#64748b' }}>
                        <FontAwesomeIcon icon={faCalendarDays} />
                    </ListItemIcon>
                    <ListItemText primary="Leave & Grievance" primaryTypographyProps={{ fontSize: '13px', fontWeight: 700 }} />
                    <FontAwesomeIcon icon={openSubMenu.leaves ? faChevronDown : faChevronRight} style={{ fontSize: '10px', color: '#94a3b8' }} />
                </ListItemButton>
                <Collapse in={openSubMenu.leaves} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ pl: 3.5, mb: 0.5 }}>
                        <ListItemButton
                            component={Link}
                            to="/leave-management"
                            onClick={() => isMobile && onToggleSidebar && onToggleSidebar()}
                            sx={{
                                py: 0.6,
                                borderRadius: '8px',
                                color: isPathActive('/leave-management') ? '#2563eb' : '#64748b',
                                bgcolor: isPathActive('/leave-management') ? '#eff6ff' : 'transparent',
                                '&:hover': { color: '#0f172a', bgcolor: '#f8fafc' }
                            }}
                        >
                            <ListItemText primary="• Leave Approvals" primaryTypographyProps={{ fontSize: '12.5px', fontWeight: isPathActive('/leave-management') ? 700 : 500 }} />
                        </ListItemButton>
                        <ListItemButton
                            component={Link}
                            to="/complaints"
                            onClick={() => isMobile && onToggleSidebar && onToggleSidebar()}
                            sx={{
                                py: 0.6,
                                borderRadius: '8px',
                                color: isPathActive('/complaints') ? '#2563eb' : '#64748b',
                                bgcolor: isPathActive('/complaints') ? '#eff6ff' : 'transparent',
                                '&:hover': { color: '#0f172a', bgcolor: '#f8fafc' }
                            }}
                        >
                            <ListItemText primary="• Grievance Tickets" primaryTypographyProps={{ fontSize: '12.5px', fontWeight: isPathActive('/complaints') ? 700 : 500 }} />
                        </ListItemButton>
                    </List>
                </Collapse>

                {/* 9. Reports & Analytics */}
                <ListItemButton
                    component={Link}
                    to="/reports"
                    onClick={() => isMobile && onToggleSidebar && onToggleSidebar()}
                    sx={{
                        borderRadius: '10px',
                        mb: 0.5,
                        py: 0.9,
                        px: 1.5,
                        color: isPathActive('/reports') ? '#2563eb' : '#475569',
                        bgcolor: isPathActive('/reports') ? '#eff6ff' : 'transparent',
                        border: isPathActive('/reports') ? '1px solid #bfdbfe' : '1px solid transparent',
                        '&:hover': { bgcolor: isPathActive('/reports') ? '#eff6ff' : '#f8fafc', color: '#0f172a' }
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 32, color: isPathActive('/reports') ? '#2563eb' : '#64748b' }}>
                        <FontAwesomeIcon icon={faFileLines} />
                    </ListItemIcon>
                    <ListItemText primary="Reports & Analytics" primaryTypographyProps={{ fontSize: '13px', fontWeight: isPathActive('/reports') ? 800 : 700 }} />
                    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '10px', color: '#94a3b8' }} />
                </ListItemButton>

                {/* 10. Super Admin Settings */}
                <ListItemButton
                    component={Link}
                    to="/super-admin"
                    onClick={() => isMobile && onToggleSidebar && onToggleSidebar()}
                    sx={{
                        borderRadius: '10px',
                        mb: 0.5,
                        py: 0.9,
                        px: 1.5,
                        color: isPathActive('/super-admin') ? '#2563eb' : '#475569',
                        bgcolor: isPathActive('/super-admin') ? '#eff6ff' : 'transparent',
                        '&:hover': { bgcolor: '#f8fafc', color: '#0f172a' }
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 32, color: isPathActive('/super-admin') ? '#2563eb' : '#64748b' }}>
                        <FontAwesomeIcon icon={faGear} />
                    </ListItemIcon>
                    <ListItemText primary="Platform Settings" primaryTypographyProps={{ fontSize: '13px', fontWeight: 700 }} />
                    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '10px', color: '#94a3b8' }} />
                </ListItemButton>
            </List>

            {/* Bottom: Logout */}
            <Box sx={{ p: 1.5, borderTop: '1px solid #f1f5f9' }}>
                <ListItemButton
                    onClick={handleLogout}
                    sx={{
                        borderRadius: '10px',
                        py: 0.8,
                        px: 1.5,
                        color: '#dc2626',
                        '&:hover': { bgcolor: '#fef2f2' }
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 32, color: '#dc2626' }}>
                        <FontAwesomeIcon icon={faRightFromBracket} />
                    </ListItemIcon>
                    <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '13px', fontWeight: 700, color: '#dc2626' }} />
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <Box
            component="nav"
            sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
            aria-label="mailbox folders"
        >
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onToggleSidebar}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: DRAWER_WIDTH,
                        top: 0,
                        height: '100%',
                        zIndex: (th) => th.zIndex.drawer + 2
                    }
                }}
            >
                {drawerContent}
            </Drawer>

            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', md: 'block' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: DRAWER_WIDTH,
                        top: 0,
                        height: '100%',
                        borderRight: '1px solid #e2e8f0',
                        zIndex: (th) => th.zIndex.drawer + 2
                    }
                }}
                open
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
};

export default Sidebar;
