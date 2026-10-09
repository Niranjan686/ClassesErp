import React, { useState, useEffect } from 'react';
import {
    AppBar, Toolbar, Typography, Box, IconButton, Chip, Menu, MenuItem,
    Avatar, TextField, InputAdornment, Button, Badge
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBuilding, faCalendarDays, faMagnifyingGlass, faArrowRight,
    faGlobe, faBell, faChevronDown, faRightFromBracket, faCircle
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = ({ onToggleSidebar }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [anchorEl, setAnchorEl] = useState(null);
    const [campusAnchor, setCampusAnchor] = useState(null);
    const [yearAnchor, setYearAnchor] = useState(null);
    const [langAnchor, setLangAnchor] = useState(null);

    const [selectedCampus, setSelectedCampus] = useState('Global Admin View / All Campuses');
    const [selectedYear, setSelectedYear] = useState('2026-2027');
    const [selectedLang, setSelectedLang] = useState('English');
    const [searchTerm, setSearchTerm] = useState('');

    const [currentUser, setCurrentUser] = useState({
        name: 'Super Admin',
        role: 'SUPERADMIN',
        username: 'superadmin'
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedInst = localStorage.getItem('institute');

        if (storedInst) {
            try {
                const inst = JSON.parse(storedInst);
                setSelectedCampus(`${inst.name} [${inst.code}]`);
            } catch (e) {}
        }

        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setCurrentUser({
                    name: parsed.name || (parsed.role === 'superadmin' ? 'Super Admin' : parsed.fname ? `${parsed.fname} ${parsed.lname}` : 'Administrator'),
                    role: (parsed.role || 'SUPERADMIN').toUpperCase(),
                    username: parsed.username || 'admin'
                });
                if (!storedInst && parsed.role === 'superadmin') {
                    setSelectedCampus('Global Admin Cloud');
                }
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                height: '70px',
                width: { xs: '100%', md: 'calc(100% - 260px)' },
                left: { xs: 0, md: '260px' },
                top: 0,
                zIndex: (th) => th.zIndex.drawer + 1,
                backgroundColor: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                color: '#1e293b',
                justifyContent: 'center',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)'
            }}
        >
            <Toolbar sx={{ minHeight: '70px !important', height: '70px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: { xs: 1.5, md: 3 } }}>
                {/* Left & Middle Filters */}
                <Box display="flex" alignItems="center" gap={1.5} flexWrap="nowrap" sx={{ overflowX: 'auto' }}>
                    {/* Campus Selector Pill */}
                    <Button
                        onClick={(e) => setCampusAnchor(e.currentTarget)}
                        endIcon={<FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '10px', color: '#64748b' }} />}
                        startIcon={<Box sx={{ width: 22, height: 22, borderRadius: '6px', bgcolor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}><FontAwesomeIcon icon={faBuilding} /></Box>}
                        sx={{
                            bgcolor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            color: '#0f172a',
                            fontWeight: 700,
                            fontSize: '12.5px',
                            textTransform: 'none',
                            px: 1.8,
                            py: 0.8,
                            whiteSpace: 'nowrap',
                            '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' }
                        }}
                    >
                        {selectedCampus}
                    </Button>
                    <Menu
                        anchorEl={campusAnchor}
                        open={Boolean(campusAnchor)}
                        onClose={() => setCampusAnchor(null)}
                    >
                        <MenuItem onClick={() => { setSelectedCampus('Global Admin View / All Campuses'); setCampusAnchor(null); }}>Global Admin View / All Campuses</MenuItem>
                        <MenuItem onClick={() => { setSelectedCampus('Main Campus (Dadar West)'); setCampusAnchor(null); }}>Main Campus (Dadar West)</MenuItem>
                        <MenuItem onClick={() => { setSelectedCampus('Andheri Academic Branch'); setCampusAnchor(null); }}>Andheri Academic Branch</MenuItem>
                        <MenuItem onClick={() => { setSelectedCampus('Thane Digital Center'); setCampusAnchor(null); }}>Thane Digital Center</MenuItem>
                    </Menu>

                    {/* Academic Year Selector Pill */}
                    <Button
                        onClick={(e) => setYearAnchor(e.currentTarget)}
                        endIcon={<FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '10px', color: '#64748b' }} />}
                        startIcon={<Box sx={{ width: 22, height: 22, borderRadius: '6px', bgcolor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}><FontAwesomeIcon icon={faCalendarDays} /></Box>}
                        sx={{
                            bgcolor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            color: '#0f172a',
                            fontWeight: 700,
                            fontSize: '12.5px',
                            textTransform: 'none',
                            px: 1.8,
                            py: 0.8,
                            whiteSpace: 'nowrap',
                            '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' }
                        }}
                    >
                        {selectedYear}
                    </Button>
                    <Menu
                        anchorEl={yearAnchor}
                        open={Boolean(yearAnchor)}
                        onClose={() => setYearAnchor(null)}
                    >
                        <MenuItem onClick={() => { setSelectedYear('2026-2027'); setYearAnchor(null); }}>2026-2027</MenuItem>
                        <MenuItem onClick={() => { setSelectedYear('2025-2026'); setYearAnchor(null); }}>2025-2026</MenuItem>
                        <MenuItem onClick={() => { setSelectedYear('2024-2025'); setYearAnchor(null); }}>2024-2025</MenuItem>
                    </Menu>

                    {/* Search Input Pill */}
                    <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', px: 1.5, py: 0.4, width: '280px' }}>
                        <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', mr: 1 }}>
                            <FontAwesomeIcon icon={faMagnifyingGlass} />
                        </Box>
                        <input
                            type="text"
                            placeholder="Search students, teach..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                border: 'none',
                                outline: 'none',
                                backgroundColor: 'transparent',
                                fontSize: '12.5px',
                                color: '#0f172a',
                                width: '100%',
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: 500
                            }}
                        />
                        <Box sx={{ width: 22, height: 22, borderRadius: '6px', bgcolor: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', cursor: 'pointer' }}>
                            <FontAwesomeIcon icon={faArrowRight} />
                        </Box>
                    </Box>
                </Box>

                {/* Right Profile & Tools */}
                <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
                    {/* Language Dropdown */}
                    <Button
                        onClick={(e) => setLangAnchor(e.currentTarget)}
                        startIcon={<Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#6366f1', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}><FontAwesomeIcon icon={faGlobe} /></Box>}
                        endIcon={<FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '9px', color: '#64748b' }} />}
                        sx={{
                            display: { xs: 'none', sm: 'inline-flex' },
                            bgcolor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            color: '#0f172a',
                            fontWeight: 700,
                            fontSize: '12px',
                            textTransform: 'none',
                            px: 1.5,
                            py: 0.7
                        }}
                    >
                        <Chip label="EN" size="small" sx={{ height: '18px', fontSize: '10px', fontWeight: 800, bgcolor: '#e0e7ff', color: '#4338ca', mr: 0.5 }} />
                        {selectedLang}
                    </Button>
                    <Menu
                        anchorEl={langAnchor}
                        open={Boolean(langAnchor)}
                        onClose={() => setLangAnchor(null)}
                    >
                        <MenuItem onClick={() => { setSelectedLang('English'); setLangAnchor(null); }}>English (EN)</MenuItem>
                        <MenuItem onClick={() => { setSelectedLang('Hindi'); setLangAnchor(null); }}>Hindi (HI)</MenuItem>
                        <MenuItem onClick={() => { setSelectedLang('Marathi'); setLangAnchor(null); }}>Marathi (MR)</MenuItem>
                    </Menu>

                    {/* Active Online Green Dot */}
                    <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#10b981', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)' }} />

                    {/* Notification Bell Badge (9+) */}
                    <IconButton
                        sx={{
                            width: 38,
                            height: 38,
                            bgcolor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            color: '#2563eb',
                            position: 'relative'
                        }}
                    >
                        <FontAwesomeIcon icon={faBell} style={{ fontSize: '14px' }} />
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -3,
                                right: -3,
                                bgcolor: '#2563eb',
                                color: '#ffffff',
                                borderRadius: '10px',
                                px: 0.6,
                                py: 0.1,
                                fontSize: '9.5px',
                                fontWeight: 900,
                                border: '2px solid #ffffff'
                            }}
                        >
                            9+
                        </Box>
                    </IconButton>

                    {/* User Profile */}
                    <Box
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.2,
                            cursor: 'pointer',
                            p: 0.5,
                            borderRadius: '12px',
                            '&:hover': { bgcolor: '#f8fafc' }
                        }}
                    >
                        <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '9.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', lineHeight: 1 }}>
                                {currentUser.role}
                            </Typography>
                            <Typography variant="body2" fontWeight="800" sx={{ color: '#0f172a', fontSize: '13px', lineHeight: 1.2, mt: 0.2 }}>
                                {currentUser.name}
                            </Typography>
                        </Box>
                        <Avatar
                            sx={{
                                width: 38,
                                height: 38,
                                bgcolor: '#0f172a',
                                color: '#ffffff',
                                fontWeight: 900,
                                fontSize: '13px',
                                border: '2px solid #e2e8f0'
                            }}
                        >
                            SA
                        </Avatar>
                    </Box>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                        PaperProps={{
                            sx: {
                                mt: 1.5,
                                borderRadius: '14px',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                minWidth: '190px',
                                p: 0.5,
                                border: '1px solid #e2e8f0'
                            }
                        }}
                    >
                        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                            <Typography variant="subtitle2" fontWeight="800" color="#0f172a">
                                {currentUser.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {currentUser.username}@classtech.com
                            </Typography>
                        </Box>
                        <MenuItem onClick={handleLogout} sx={{ color: '#ef4444', fontWeight: 700, gap: 1.5, mt: 0.5, borderRadius: '8px' }}>
                            <FontAwesomeIcon icon={faRightFromBracket} /> Sign Out
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
