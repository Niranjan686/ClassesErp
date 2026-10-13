const mongoose = require('mongoose');

// 1. Inventory Item Schema
const inventoryItemSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
  itemCode: { type: String, required: true, uppercase: true, trim: true },
  itemName: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['Lab Equipment & Consumables', 'Electronics & IT', 'Office & Stationery', 'Books & Printing', 'Sports & Physical Education', 'Maintenance & Cleaning', 'Other'],
    default: 'Office & Stationery',
    index: true,
  },
  currentStock: { type: Number, required: true, default: 0, min: 0 },
  minStockAlert: { type: Number, default: 5 },
  unit: { type: String, default: 'Units' }, // pcs, boxes, reams, etc.
  unitPrice: { type: Number, default: 0 },
  location: { type: String, default: 'Central Store' },
  supplierName: String,
}, { timestamps: true });

inventoryItemSchema.index({ instituteId: 1, itemCode: 1 }, { unique: true });

// 2. Vendor Schema
const vendorSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
  vendorName: { type: String, required: true, trim: true },
  contactPerson: String,
  phone: { type: String, required: true },
  email: String,
  gstin: String,
  address: String,
  category: String,
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

vendorSchema.index({ instituteId: 1, vendorName: 1 });

// 3. Purchase Order Schema
const purchaseOrderSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
  poNumber: { type: String, required: true, uppercase: true, trim: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  vendorName: { type: String, required: true },
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
    itemName: String,
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  }],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Draft', 'Pending Approval', 'Approved', 'Goods Received', 'Cancelled'],
    default: 'Pending Approval',
    index: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Partially Paid', 'Paid'],
    default: 'Unpaid',
  },
  invoiceNumber: String,
  orderDate: { type: Date, default: Date.now },
  expectedDeliveryDate: Date,
  receivedDate: Date,
  approvedBy: String,
  notes: String,
}, { timestamps: true });

purchaseOrderSchema.index({ instituteId: 1, poNumber: 1 }, { unique: true });

// 4. Fixed Asset Schema
const assetSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
  assetCode: { type: String, required: true, uppercase: true, trim: true },
  assetName: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['Computer Hardware', 'Lab Machinery', 'Furniture & Fixtures', 'Audio/Visual & Projectors', 'Air Conditioning & Electrical', 'Vehicle', 'Other'],
    default: 'Computer Hardware',
  },
  location: { type: String, default: 'Main Building' },
  custodianName: { type: String, default: 'Lab Admin' },
  custodianStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  purchaseCost: { type: Number, default: 0 },
  purchaseDate: Date,
  warrantyExpiryDate: Date,
  status: {
    type: String,
    enum: ['In Use', 'Under Maintenance', 'Damaged', 'Retired / Disposed'],
    default: 'In Use',
    index: true,
  },
  maintenanceNotes: String,
}, { timestamps: true });

assetSchema.index({ instituteId: 1, assetCode: 1 }, { unique: true });

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);
const Vendor = mongoose.model('Vendor', vendorSchema);
const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
const Asset = mongoose.model('Asset', assetSchema);

module.exports = {
  InventoryItem,
  Vendor,
  PurchaseOrder,
  Asset,
};
