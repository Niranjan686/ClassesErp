const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SupportTicket = require('../models/SupportTicket');
const Institute = require('../models/Institute');
const { authenticateAdmin } = require('../middleware/auth');

/**
 * List Support Tickets
 */
router.get('/tickets', authenticateAdmin, async (req, res) => {
  try {
    const isSuper = req.user && req.user.role === 'superadmin';
    const query = isSuper && !req.query.myInstitute ? {} : { instituteId: req.instituteId };

    if (req.query.status && req.query.status !== 'ALL') query.status = req.query.status;
    if (req.query.priority && req.query.priority !== 'ALL') query.priority = req.query.priority;

    const tickets = await SupportTicket.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Open New Support Ticket
 */
router.post('/tickets', authenticateAdmin, async (req, res) => {
  try {
    const { category, subject, description, priority } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ success: false, message: 'Subject and description are required.' });
    }

    const year = new Date().getFullYear();
    const count = await SupportTicket.countDocuments();
    const ticketNo = `TKT-${year}-${(count + 1).toString().padStart(4, '0')}`;

    const ticket = new SupportTicket({
      instituteId: req.instituteId,
      ticketNo,
      reportedByName: req.user ? req.user.name : 'School Staff',
      reportedByEmail: req.user ? req.user.email : 'staff@school.local',
      reportedByRole: req.user ? req.user.role : 'Admin',
      category: category || 'Bug / System Error',
      subject,
      description,
      priority: priority || 'Medium',
      status: 'Open',
      replies: [{
        senderName: req.user ? req.user.name : 'School Staff',
        senderRole: 'School Staff',
        message: description,
        sentAt: new Date(),
      }]
    });

    const saved = await ticket.save();
    res.status(201).json({ success: true, message: `Ticket #${ticketNo} created successfully`, data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Reply to Ticket
 */
router.post('/tickets/:id/reply', authenticateAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message content required' });

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const isSuper = req.user && req.user.role === 'superadmin';
    const senderRole = isSuper ? 'Platform SuperAdmin' : 'School Staff';

    ticket.replies.push({
      senderName: req.user.name,
      senderRole,
      message,
      sentAt: new Date(),
    });

    if (isSuper && ticket.status === 'Open') {
      ticket.status = 'In Progress';
    }

    await ticket.save();
    res.json({ success: true, message: 'Reply sent', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Update Ticket Status
 */
router.patch('/tickets/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status, resolutionNotes } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    if (status) ticket.status = status;
    if (resolutionNotes) ticket.resolutionNotes = resolutionNotes;
    await ticket.save();

    res.json({ success: true, message: `Ticket marked as ${ticket.status}`, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Detailed System Health & Monitoring
 */
router.get('/system-health', async (req, res) => {
  try {
    const start = Date.now();
    const dbState = mongoose.connection.readyState === 1;
    let pingMs = 0;

    if (dbState && mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      pingMs = Date.now() - start;
    }

    const mem = process.memoryUsage();

    res.json({
      success: true,
      status: dbState ? 'OPTIMAL' : 'DEGRADED',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: {
        connected: dbState,
        latencyMs: pingMs,
        name: mongoose.connection.name || 'SchoolErp',
      },
      resources: {
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
        rssMB: Math.round(mem.rss / 1024 / 1024),
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
