const express = require('express');
const router = express.Router();
const { Vehicle, Route, StudentTransport } = require('../models/Transport');
const Student = require('../models/Students');
const { authenticateAdmin, authenticateStudent } = require('../middleware/auth');

/**
 * ---------------- VEHICLES ----------------
 */
router.get('/vehicles', authenticateAdmin, async (req, res) => {
  try {
    const query = { instituteId: req.instituteId };
    if (req.query.status && req.query.status !== 'ALL') query.status = req.query.status;
    const list = await Vehicle.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/vehicles', authenticateAdmin, async (req, res) => {
  try {
    const vehicle = new Vehicle({ ...req.body, instituteId: req.instituteId });
    const saved = await vehicle.save();
    res.status(201).json({ success: true, message: 'Vehicle registered successfully', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/vehicles/:id', authenticateAdmin, async (req, res) => {
  try {
    const updated = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.instituteId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, message: 'Vehicle updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/vehicles/:id', authenticateAdmin, async (req, res) => {
  try {
    await Vehicle.findOneAndDelete({ _id: req.params.id, instituteId: req.instituteId });
    res.json({ success: true, message: 'Vehicle removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ---------------- ROUTES & STOPS ----------------
 */
router.get('/routes', authenticateAdmin, async (req, res) => {
  try {
    const query = { instituteId: req.instituteId };
    if (req.query.status && req.query.status !== 'ALL') query.status = req.query.status;
    const routes = await Route.find(query).populate('vehicleId').sort({ routeNumber: 1 });
    res.json({ success: true, data: routes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/routes', authenticateAdmin, async (req, res) => {
  try {
    const route = new Route({ ...req.body, instituteId: req.instituteId });
    const saved = await route.save();
    res.status(201).json({ success: true, message: 'Route configured successfully', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/routes/:id', authenticateAdmin, async (req, res) => {
  try {
    const updated = await Route.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.instituteId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, message: 'Route updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/routes/:id', authenticateAdmin, async (req, res) => {
  try {
    await Route.findOneAndDelete({ _id: req.params.id, instituteId: req.instituteId });
    res.json({ success: true, message: 'Route removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ---------------- STUDENT ALLOCATION & MANIFEST ----------------
 */
router.post('/assign-student', authenticateAdmin, async (req, res) => {
  try {
    const { studentId, routeId, stopName } = req.body;
    const student = await Student.findOne({ _id: studentId, instituteId: req.instituteId });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const route = await Route.findOne({ _id: routeId, instituteId: req.instituteId });
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

    const stop = route.stops.find(s => s.stopName === stopName);

    const allocation = await StudentTransport.findOneAndUpdate(
      { instituteId: req.instituteId, studentId: student._id },
      {
        instituteId: req.instituteId,
        studentId: student._id,
        studentName: `${student.fname} ${student.lname}`,
        grno: student.grno,
        routeId: route._id,
        vehicleId: route.vehicleId,
        stopName,
        pickupTime: stop ? stop.pickupTime : '07:30 AM',
        dropTime: stop ? stop.dropTime : '02:30 PM',
        monthlyFee: stop ? stop.monthlyFee : 1200,
        status: 'Active',
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Student allocated to route successfully', data: allocation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/manifest/:routeId', authenticateAdmin, async (req, res) => {
  try {
    const route = await Route.findOne({ _id: req.params.routeId, instituteId: req.instituteId }).populate('vehicleId');
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

    const passengers = await StudentTransport.find({
      instituteId: req.instituteId,
      routeId: route._id,
      status: 'Active',
    }).populate('studentId', 'fname lname grno mobileNo fatherMobileNo photo');

    res.json({
      success: true,
      route,
      totalPassengers: passengers.length,
      capacity: route.vehicleId ? route.vehicleId.seatingCapacity : 40,
      passengers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Mobile / Student View of Assigned Transport
 */
router.get('/my-transport', authenticateStudent, async (req, res) => {
  try {
    const transport = await StudentTransport.findOne({
      instituteId: req.instituteId,
      studentId: req.student._id,
      status: 'Active',
    })
      .populate('routeId')
      .populate('vehicleId');

    res.json({ success: true, data: transport });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
