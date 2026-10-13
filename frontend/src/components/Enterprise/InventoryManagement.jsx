import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, IconButton, Alert, Snackbar, Grid, CircularProgress, Tabs, Tab
} from '@mui/material';
import { Plus, Package, ShoppingCart, CheckCircle, AlertTriangle } from 'lucide-react';
import AdminLayout from '../Common/AdminLayout';
import { PageTransition } from '../Common/MotionWrapper';
import api from '../../api';

const InventoryManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [items, setItems] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Dialogs
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [openPODialog, setOpenPODialog] = useState(false);

  // Forms
  const [itemForm, setItemForm] = useState({
    name: '',
    sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
    category: 'Stationery',
    currentStock: 50,
    minStockLevel: 10,
    unitPrice: 120
  });

  const [poForm, setPoForm] = useState({
    supplierName: 'Apex Educational Supplies Ltd',
    itemId: '',
    quantity: 100,
    totalCost: 12000
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [iRes, pRes] = await Promise.all([
        api.get('/inventory/items'),
        api.get('/inventory/purchase-orders')
      ]);
      setItems(Array.isArray(iRes.data) ? iRes.data : (iRes.data?.data || []));
      setPurchaseOrders(Array.isArray(pRes.data) ? pRes.data : (pRes.data?.data || []));
    } catch (err) {
      setToast({ open: true, message: 'Failed to load inventory assets', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/items', {
        ...itemForm,
        currentStock: Number(itemForm.currentStock),
        minStockLevel: Number(itemForm.minStockLevel),
        unitPrice: Number(itemForm.unitPrice)
      });
      setToast({ open: true, message: 'Item catalogued into school store!', severity: 'success' });
      setOpenItemDialog(false);
      fetchData();
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Error saving item', severity: 'error' });
    }
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    try {
      const selectedItem = items.find(i => i._id === poForm.itemId);
      const payload = {
        supplierName: poForm.supplierName,
        items: [{
          itemId: poForm.itemId,
          itemName: selectedItem ? selectedItem.name : 'Store Item',
          quantity: Number(poForm.quantity),
          unitPrice: selectedItem ? selectedItem.unitPrice : 100
        }],
        totalAmount: Number(poForm.totalCost)
      };
      await api.post('/inventory/purchase-orders', payload);
      setToast({ open: true, message: 'Purchase Order generated (PO-YYYY-XXXX)!', severity: 'success' });
      setOpenPODialog(false);
      fetchData();
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Error creating PO', severity: 'error' });
    }
  };

  const handleReceiveStock = async (poId) => {
    try {
      await api.post(`/inventory/purchase-orders/${poId}/receive`, {});
      setToast({ open: true, message: 'Goods received! Stock balances updated.', severity: 'success' });
      fetchData();
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Failed to receive goods', severity: 'error' });
    }
  };

  return (
    <AdminLayout>
      <PageTransition>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight="900" color="#0f172a">
              Inventory & School Asset Management
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage school store supplies, track minimum reorder limits, and generate standardized purchase orders
            </Typography>
          </Box>
          <Box display="flex" gap={1.5}>
            <Button
              variant="outlined"
              startIcon={<Package className="w-4 h-4" />}
              onClick={() => setOpenItemDialog(true)}
              sx={{ borderColor: '#4338CA', color: '#4338CA', fontWeight: 700, textTransform: 'none' }}
            >
              Add Item
            </Button>
            <Button
              variant="contained"
              startIcon={<ShoppingCart className="w-4 h-4" />}
              onClick={() => setOpenPODialog(true)}
              sx={{ bgcolor: '#4338CA', '&:hover': { bgcolor: '#3730A3' }, fontWeight: 700, textTransform: 'none' }}
            >
              Generate PO
            </Button>
          </Box>
        </Box>

        <Paper sx={{ mb: 3, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            sx={{ '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', py: 1.5 }, '& .Mui-selected': { color: '#4338CA' } }}
          >
            <Tab label="Stock Store & Asset Catalogue" />
            <Tab label="Purchase Orders & Goods Receipt" />
          </Tabs>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress sx={{ color: '#4338CA' }} />
          </Box>
        ) : (
          <>
            {activeTab === 0 && (
              <Paper sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>SKU</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Item Name</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Current Stock</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Unit Price</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Stock Health</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5, color: '#64748B' }}>
                            Zero inventory items registered. Click "Add Item" to add store items.
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map(i => {
                          const isLowStock = i.currentStock <= (i.minStockLevel || 10);
                          return (
                            <TableRow key={i._id} hover>
                              <TableCell sx={{ fontWeight: 800, color: '#4338CA' }}>{i.sku}</TableCell>
                              <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>{i.name}</TableCell>
                              <TableCell><Chip label={i.category} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>{i.currentStock} Units</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>₹{i.unitPrice}</TableCell>
                              <TableCell>
                                {isLowStock ? (
                                  <Chip label="Reorder Needed" size="small" sx={{ bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 800 }} />
                                ) : (
                                  <Chip label="Optimal Stock" size="small" sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 800 }} />
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            {activeTab === 1 && (
              <Paper sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>PO Number</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Vendor / Supplier</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Order Date</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Total Value</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {purchaseOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5, color: '#64748B' }}>
                            No purchase orders issued yet. Click "Generate PO" to create one.
                          </TableCell>
                        </TableRow>
                      ) : (
                        purchaseOrders.map(po => (
                          <TableRow key={po._id} hover>
                            <TableCell sx={{ fontWeight: 800, color: '#4338CA' }}>{po.orderNo || `PO-2026-${po._id.slice(-4).toUpperCase()}`}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{po.supplierName || 'School Supplies Partner'}</TableCell>
                            <TableCell>{new Date(po.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#16A34A' }}>₹{(po.totalAmount || 0).toLocaleString()}</TableCell>
                            <TableCell>
                              <Chip
                                label={po.status || 'Pending'}
                                size="small"
                                sx={{
                                  bgcolor: po.status === 'Received' ? '#DCFCE7' : '#FEF3C7',
                                  color: po.status === 'Received' ? '#166534' : '#92400E',
                                  fontWeight: 800
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'right' }}>
                              {po.status !== 'Received' ? (
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleReceiveStock(po._id)}
                                  sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none', fontWeight: 700 }}
                                >
                                  Receive Goods
                                </Button>
                              ) : (
                                <span className="text-xs font-bold text-slate-400">Stock Updated</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </>
        )}

        {/* Add Item Dialog */}
        <Dialog open={openItemDialog} onClose={() => setOpenItemDialog(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleAddItem}>
            <DialogTitle sx={{ fontWeight: 800 }}>Catalogue Inventory Item</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Item Name" required value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="SKU / Barcode" value={itemForm.sku} onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Category" value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Initial Stock Units" type="number" value={itemForm.currentStock} onChange={(e) => setItemForm({ ...itemForm, currentStock: Number(e.target.value) })} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Reorder Threshold" type="number" value={itemForm.minStockLevel} onChange={(e) => setItemForm({ ...itemForm, minStockLevel: Number(e.target.value) })} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Unit Price (₹)" type="number" value={itemForm.unitPrice} onChange={(e) => setItemForm({ ...itemForm, unitPrice: Number(e.target.value) })} />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenItemDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4338CA' }}>Save Item</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Generate PO Dialog */}
        <Dialog open={openPODialog} onClose={() => setOpenPODialog(false)} maxWidth="xs" fullWidth>
          <form onSubmit={handleCreatePO}>
            <DialogTitle sx={{ fontWeight: 800 }}>Create Purchase Order (PO)</DialogTitle>
            <DialogContent dividers>
              <TextField fullWidth label="Vendor / Supplier Name" required value={poForm.supplierName} onChange={(e) => setPoForm({ ...poForm, supplierName: e.target.value })} sx={{ mb: 2 }} />
              <TextField select fullWidth label="Select Item" required value={poForm.itemId} onChange={(e) => setPoForm({ ...poForm, itemId: e.target.value })} sx={{ mb: 2 }}>
                {items.map(i => <MenuItem key={i._id} value={i._id}>{i.name} (Stock: {i.currentStock})</MenuItem>)}
              </TextField>
              <TextField fullWidth label="Order Quantity" type="number" required value={poForm.quantity} onChange={(e) => setPoForm({ ...poForm, quantity: Number(e.target.value) })} sx={{ mb: 2 }} />
              <TextField fullWidth label="Total Order Value (₹)" type="number" required value={poForm.totalCost} onChange={(e) => setPoForm({ ...poForm, totalCost: Number(e.target.value) })} />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenPODialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4338CA' }}>Generate PO</Button>
            </DialogActions>
          </form>
        </Dialog>

        <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })}>
          <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })}>{toast.message}</Alert>
        </Snackbar>
      </PageTransition>
    </AdminLayout>
  );
};

export default InventoryManagement;
