const express = require('express');
const router = express.Router();
const { InventoryItem, Vendor, PurchaseOrder, Asset } = require('../models/Inventory');
const Institute = require('../models/Institute');
const { authenticateAdmin } = require('../middleware/auth');

/**
 * ---------------- ITEMS & STOCK ----------------
 */
router.get('/items', authenticateAdmin, async (req, res) => {
  try {
    const query = { instituteId: req.instituteId };
    if (req.query.category && req.query.category !== 'ALL') query.category = req.query.category;
    if (req.query.search) {
      const reg = new RegExp(req.query.search, 'i');
      query.$or = [{ itemName: reg }, { itemCode: reg }];
    }

    const items = await InventoryItem.find(query).sort({ itemName: 1 });
    const enriched = items.map(item => ({
      ...item.toObject(),
      isLowStock: item.currentStock <= item.minStockAlert,
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/items', authenticateAdmin, async (req, res) => {
  try {
    const item = new InventoryItem({ ...req.body, instituteId: req.instituteId });
    const saved = await item.save();
    res.status(201).json({ success: true, message: 'Item registered in inventory', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/items/:id', authenticateAdmin, async (req, res) => {
  try {
    const updated = await InventoryItem.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.instituteId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, message: 'Item updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Adjust / Issue stock with negative stock prevention
router.post('/items/:id/adjust-stock', authenticateAdmin, async (req, res) => {
  try {
    const { adjustmentType, quantity, reason } = req.body;
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
    }

    const item = await InventoryItem.findOne({ _id: req.params.id, instituteId: req.instituteId });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    if (adjustmentType === 'Issue' || adjustmentType === 'Deduction') {
      if (item.currentStock < qty) {
        return res.status(400).json({
          success: false,
          message: `Cannot issue ${qty} ${item.unit}. Only ${item.currentStock} ${item.unit} available in stock (Negative stock prevented).`
        });
      }
      item.currentStock -= qty;
    } else {
      // 'Add' or 'Return'
      item.currentStock += qty;
    }

    await item.save();
    res.json({
      success: true,
      message: `Stock updated: ${item.itemName} new balance is ${item.currentStock} ${item.unit}`,
      data: item,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ---------------- VENDORS ----------------
 */
router.get('/vendors', authenticateAdmin, async (req, res) => {
  try {
    const vendors = await Vendor.find({ instituteId: req.instituteId }).sort({ vendorName: 1 });
    res.json({ success: true, data: vendors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/vendors', authenticateAdmin, async (req, res) => {
  try {
    const vendor = new Vendor({ ...req.body, instituteId: req.instituteId });
    const saved = await vendor.save();
    res.status(201).json({ success: true, message: 'Vendor added successfully', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * ---------------- PURCHASE ORDERS & RECEIPT ----------------
 */
router.get('/orders', authenticateAdmin, async (req, res) => {
  try {
    const query = { instituteId: req.instituteId };
    if (req.query.status && req.query.status !== 'ALL') query.status = req.query.status;
    const orders = await PurchaseOrder.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/orders', authenticateAdmin, async (req, res) => {
  try {
    const inst = await Institute.findById(req.instituteId);
    const prefix = inst ? inst.code : 'PO';
    const year = new Date().getFullYear();
    const count = await PurchaseOrder.countDocuments({ instituteId: req.instituteId });
    const poNumber = `${prefix}-PO-${year}-${(count + 1).toString().padStart(4, '0')}`;

    const order = new PurchaseOrder({
      ...req.body,
      instituteId: req.instituteId,
      poNumber,
      approvedBy: req.user ? req.user.name : 'Procurement Officer',
    });

    const saved = await order.save();
    res.status(201).json({ success: true, message: 'Purchase order created successfully', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Receive Goods -> Auto-increment stock
router.patch('/orders/:id/receive', authenticateAdmin, async (req, res) => {
  try {
    const order = await PurchaseOrder.findOne({ _id: req.params.id, instituteId: req.instituteId });
    if (!order) return res.status(404).json({ success: false, message: 'Purchase order not found' });
    if (order.status === 'Goods Received') {
      return res.status(400).json({ success: false, message: 'Goods have already been received for this PO.' });
    }

    // Auto-update stock levels for all items in order
    for (const item of order.items) {
      if (item.itemId) {
        await InventoryItem.findByIdAndUpdate(item.itemId, {
          $inc: { currentStock: item.quantity },
        });
      }
    }

    order.status = 'Goods Received';
    order.receivedDate = new Date();
    order.invoiceNumber = req.body.invoiceNumber || order.invoiceNumber;
    await order.save();

    res.json({
      success: true,
      message: `Goods received and ${order.items.length} item stock quantities updated in inventory.`,
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ---------------- FIXED ASSETS ----------------
 */
router.get('/assets', authenticateAdmin, async (req, res) => {
  try {
    const query = { instituteId: req.instituteId };
    if (req.query.category && req.query.category !== 'ALL') query.category = req.query.category;
    if (req.query.status && req.query.status !== 'ALL') query.status = req.query.status;

    const assets = await Asset.find(query).sort({ assetCode: 1 });
    res.json({ success: true, data: assets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/assets', authenticateAdmin, async (req, res) => {
  try {
    const asset = new Asset({ ...req.body, instituteId: req.instituteId });
    const saved = await asset.save();
    res.status(201).json({ success: true, message: 'Asset registered successfully', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/assets/:id', authenticateAdmin, async (req, res) => {
  try {
    const updated = await Asset.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.instituteId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Asset not found' });
    res.json({ success: true, message: 'Asset updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
