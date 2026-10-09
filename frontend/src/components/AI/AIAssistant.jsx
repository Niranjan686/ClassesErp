import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Typography, Paper, IconButton, TextField, Button, Avatar, Chip,
    CircularProgress, Fade, Drawer, useTheme, useMediaQuery
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faRobot, faBolt, faPaperPlane, faTimes, faRotateRight,
    faCalendarCheck, faTriangleExclamation, faMoneyBillWave,
    faAddressCard, faEnvelopeOpenText, faBookOpen
} from '@fortawesome/free-solid-svg-icons';
import api from '../../api';

const QUICK_PROMPTS = [
    { label: "📊 Today's Attendance", query: "Analyze today's attendance rate and absences" },
    { label: "🚨 Attendance Defaulters", query: "List students below 75% attendance defaulters" },
    { label: "💰 Fee Collections", query: "Show total fees expected vs collected summary" },
    { label: "📈 Inquiry Funnel", query: "How many inquiries and demo lectures converted to admission?" },
    { label: "📝 Draft Leave", query: "Draft leave application for college exam" },
    { label: "📚 Course Syllabi", query: "What are the syllabus modules of MS-CIT and Tally?" }
];

const AIAssistant = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [isOpen, setIsOpen] = useState(false);
    const [inputQuery, setInputQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState([
        {
            sender: 'ai',
            text: "👋 **Hello! I am ClassTech AI Copilot.**\n\nI can analyze your live classroom attendance, highlight fee balances, detect attendance defaulters, and draft parent notices. How can I help you today?",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [chatHistory, isOpen]);

    const handleSendMessage = async (customText) => {
        const textToSend = customText || inputQuery;
        if (!textToSend.trim() || loading) return;

        const userMsg = {
            sender: 'user',
            text: textToSend,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setChatHistory(prev => [...prev, userMsg]);
        setInputQuery('');
        setLoading(true);

        try {
            const storedUser = localStorage.getItem('user');
            let role = 'admin';
            let branchId = null;
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                role = parsed.role || 'admin';
                branchId = parsed.branchId || null;
            }

            const res = await api.post('/ai/chat', {
                message: textToSend,
                role,
                branchId
            });

            const aiMsg = {
                sender: 'ai',
                text: res.data.response,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setChatHistory(prev => [...prev, aiMsg]);
        } catch (err) {
            setChatHistory(prev => [
                ...prev,
                {
                    sender: 'ai',
                    text: "⚠️ Sorry, I encountered an issue connecting to ClassTech intelligence engine. Please check backend server.",
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating ClassTech AI Trigger Button */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: { xs: 20, md: 28 },
                    right: { xs: 20, md: 28 },
                    zIndex: 1300
                }}
            >
                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    variant="contained"
                    sx={{
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: '#ffffff',
                        borderRadius: '30px',
                        px: { xs: 2, sm: 2.5 },
                        py: 1.2,
                        fontWeight: 900,
                        fontSize: '13px',
                        textTransform: 'none',
                        boxShadow: '0 8px 25px rgba(2, 132, 199, 0.45)',
                        border: '2px solid rgba(255, 255, 255, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.2,
                        transition: 'all 0.25s ease',
                        '&:hover': {
                            transform: 'translateY(-3px) scale(1.03)',
                            boxShadow: '0 12px 30px rgba(2, 132, 199, 0.55)',
                            background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)'
                        }
                    }}
                >
                    <Avatar sx={{ bgcolor: '#ffffff', color: '#0284c7', width: 26, height: 26, fontSize: '13px' }}>
                        <FontAwesomeIcon icon={faRobot} />
                    </Avatar>
                    <Box textAlign="left">
                        <Typography sx={{ fontSize: '13px', fontWeight: 900, lineHeight: 1.1 }}>
                            ClassTech AI
                        </Typography>
                        <Typography sx={{ fontSize: '9.5px', color: '#e0f2fe', fontWeight: 700, letterSpacing: '0.4px' }}>
                            Smart ERP Copilot
                        </Typography>
                    </Box>
                </Button>
            </Box>

            {/* AI Assistant Chat Console Drawer */}
            <Drawer
                anchor="right"
                open={isOpen}
                onClose={() => setIsOpen(false)}
                PaperProps={{
                    sx: {
                        width: { xs: '100%', sm: 420 },
                        maxWidth: '100%',
                        height: '100%',
                        bgcolor: '#f0f9ff',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '-8px 0 35px rgba(2, 132, 199, 0.2)'
                    }
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        p: 2.5,
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ bgcolor: '#ffffff', color: '#0284c7', width: 38, height: 38 }}>
                            <FontAwesomeIcon icon={faRobot} />
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="900" sx={{ lineHeight: 1.2 }}>
                                ClassTech AI Copilot
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#e0f2fe', display: 'block', fontWeight: 700 }}>
                                Educational Intelligence Engine
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: '#ffffff' }}>
                        <FontAwesomeIcon icon={faTimes} />
                    </IconButton>
                </Box>

                {/* Quick Action Prompt Chips */}
                <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderBottom: '1px solid #e0f2fe', display: 'flex', gap: 1, overflowX: 'auto', flexShrink: 0 }}>
                    {QUICK_PROMPTS.map((p, idx) => (
                        <Chip
                            key={idx}
                            label={p.label}
                            size="small"
                            onClick={() => handleSendMessage(p.query)}
                            sx={{
                                bgcolor: '#e0f2fe',
                                color: '#0369a1',
                                fontWeight: 800,
                                fontSize: '11px',
                                cursor: 'pointer',
                                '&:hover': { bgcolor: '#0284c7', color: '#ffffff' }
                            }}
                        />
                    ))}
                </Box>

                {/* Chat Messages Log */}
                <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.8 }}>
                    {chatHistory.map((msg, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                            }}
                        >
                            <Paper
                                sx={{
                                    p: 2,
                                    maxWidth: '88%',
                                    borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                                    bgcolor: msg.sender === 'user' ? '#0284c7' : '#ffffff',
                                    color: msg.sender === 'user' ? '#ffffff' : '#0f172a',
                                    border: msg.sender === 'user' ? 'none' : '1px solid #e0f2fe',
                                    boxShadow: '0 2px 10px rgba(2, 132, 199, 0.06)'
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{
                                        whiteSpace: 'pre-line',
                                        fontSize: '13px',
                                        lineHeight: 1.55,
                                        '& strong': { color: msg.sender === 'user' ? '#ffffff' : '#0369a1', fontWeight: 800 }
                                    }}
                                >
                                    {msg.text}
                                </Typography>
                            </Paper>
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '10px', mt: 0.4, px: 0.5 }}>
                                {msg.time}
                            </Typography>
                        </Box>
                    ))}

                    {loading && (
                        <Box display="flex" alignItems="center" gap={1.5} sx={{ p: 1.5, bgcolor: '#ffffff', borderRadius: '12px', border: '1px solid #e0f2fe', width: 'fit-content' }}>
                            <CircularProgress size={16} sx={{ color: '#0284c7' }} />
                            <Typography variant="caption" color="#0369a1" fontWeight="700">
                                ClassTech AI is analyzing ERP database...
                            </Typography>
                        </Box>
                    )}
                    <div ref={chatEndRef} />
                </Box>

                {/* Input Bar */}
                <Box sx={{ p: 2, bgcolor: '#ffffff', borderTop: '1px solid #e0f2fe' }}>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage();
                        }}
                    >
                        <Box display="flex" gap={1}>
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Ask ClassTech AI anything..."
                                value={inputQuery}
                                onChange={(e) => setInputQuery(e.target.value)}
                                disabled={loading}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '10px',
                                        fontSize: '13px'
                                    }
                                }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading || !inputQuery.trim()}
                                sx={{
                                    minWidth: '46px',
                                    width: '46px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    bgcolor: '#0284c7',
                                    '&:hover': { bgcolor: '#0369a1' }
                                }}
                            >
                                <FontAwesomeIcon icon={faPaperPlane} />
                            </Button>
                        </Box>
                    </form>
                </Box>
            </Drawer>
        </>
    );
};

export default AIAssistant;
