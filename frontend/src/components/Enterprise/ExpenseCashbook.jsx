import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DollarSign, TrendingUp, TrendingDown, Plus, Download, 
  Filter, Calendar, Trash2, CheckCircle2, Clock, AlertCircle, FileText
} from 'lucide-react';
import AdminLayout from '../Common/AdminLayout';
import { PageTransition } from '../Common/MotionWrapper';

const ExpenseCashbook = () => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netSurplus: 0,
    operatingMarginPercent: 0
  });
  const [categoryBreakdown, setCategoryBreakdown] = useState({});
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: 'Utilities',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    payeeName: '',
    invoiceNumber: '',
    paymentMode: 'Bank Transfer',
    paymentStatus: 'Paid',
    remarks: ''
  });

  const categories = [
    'Salaries & Wages',
    'Utilities',
    'Repairs & Maintenance',
    'Books & Learning Materials',
    'Transport & Fuel',
    'Events & Functions',
    'IT & Software',
    'Marketing & Advertising',
    'Office Supplies',
    'Miscellaneous'
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch expenses list
      let url = `http://localhost:5000/api/expenses?month=${month}`;
      if (categoryFilter !== 'ALL') url += `&category=${encodeURIComponent(categoryFilter)}`;
      if (statusFilter !== 'ALL') url += `&paymentStatus=${statusFilter}`;
      
      const expRes = await axios.get(url, { headers });
      setExpenses(Array.isArray(expRes.data?.data) ? expRes.data.data : (Array.isArray(expRes.data) ? expRes.data : []));

      // 2. Fetch financial summary
      const sumRes = await axios.get(`http://localhost:5000/api/expenses/financial-summary?month=${month}`, { headers });
      if (sumRes.data?.summary) {
        setSummary(sumRes.data.summary);
      }
      if (sumRes.data?.categoryBreakdown) {
        setCategoryBreakdown(sumRes.data.categoryBreakdown);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, categoryFilter, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/expenses', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Expense voucher created successfully!');
      setShowAddModal(false);
      setFormData({
        title: '',
        category: 'Utilities',
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
        payeeName: '',
        invoiceNumber: '',
        paymentMode: 'Bank Transfer',
        paymentStatus: 'Paid',
        remarks: ''
      });
      fetchData();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting expense');
    }
  };

  const handleExportCSV = () => {
    if (!expenses.length) return alert('No data to export');
    const headers = ['Voucher No', 'Title', 'Category', 'Payee', 'Date', 'Mode', 'Amount (INR)', 'Status'];
    const rows = expenses.map(e => [
      e.voucherNo,
      `"${e.title?.replace(/"/g, '""') || ''}"`,
      `"${e.category}"`,
      `"${e.payeeName || ''}"`,
      e.expenseDate,
      e.paymentMode,
      e.amount,
      e.paymentStatus
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `School_Expenses_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <PageTransition>
        <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-indigo-600" />
            Financial Cashbook & Expense Ledger
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track institutional operating costs, fee inflows, vouchers, and operating surplus
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="month" 
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 text-sm font-medium"
          />
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            New Expense Voucher
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          {message}
        </div>
      )}

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Fee Collections ({month})</span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            ₹{summary.totalIncome?.toLocaleString('en-IN') || 0}
          </div>
          <p className="text-xs text-gray-400 mt-1">Total revenue collected from fees</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Operating Expenses</span>
            <span className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-lg">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-600">
            ₹{summary.totalExpenses?.toLocaleString('en-IN') || 0}
          </div>
          <p className="text-xs text-gray-400 mt-1">Paid operating expenditures</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Net Surplus / Deficit</span>
            <span className={`p-2 rounded-lg ${summary.netSurplus >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-2xl font-bold ${summary.netSurplus >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
            ₹{summary.netSurplus?.toLocaleString('en-IN') || 0}
          </div>
          <p className="text-xs text-gray-400 mt-1">Operating Cashflow</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Operating Margin</span>
            <span className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {summary.operatingMarginPercent}%
          </div>
          <p className="text-xs text-gray-400 mt-1">Surplus efficiency ratio</p>
        </div>
      </div>

      {/* Category Breakdown Badges */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Cost Categories Breakdown</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryBreakdown).map(([cat, amt]) => (
              <div key={cat} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/60 rounded-lg text-xs">
                <span className="font-medium text-gray-700 dark:text-gray-300">{cat}:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">₹{amt.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters & Ledger Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
            <FileText className="w-4 h-4 text-indigo-500" />
            Expense Vouchers ({expenses.length})
          </div>
          <div className="flex items-center gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-xs dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="ALL">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-xs dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="ALL">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Voucher #</th>
                <th className="px-6 py-3">Title & Payee</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Payment Mode</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">Loading ledger...</td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No expense vouchers recorded for this period.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750 transition">
                    <td className="px-6 py-4 font-mono font-medium text-xs text-indigo-600 dark:text-indigo-400">
                      {e.voucherNo}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{e.title}</div>
                      <div className="text-xs text-gray-400">Payee: {e.payeeName} {e.invoiceNumber ? `| Inv #${e.invoiceNumber}` : ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 text-xs rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs">
                      {e.expenseDate}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-400">
                      {e.paymentMode}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      ₹{e.amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        e.paymentStatus === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {e.paymentStatus === 'Paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {e.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(e._id)}
                        className="p-1 text-gray-400 hover:text-rose-600 transition rounded"
                        title="Delete Voucher"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Voucher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              Create Expense Voucher
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Campus Generator Diesel Refill"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 15000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Payee Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bharat Petroleum Agency"
                    value={formData.payeeName}
                    onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice / Bill #</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Mode</label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI / Netbanking</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Remarks</label>
                <textarea
                  rows="2"
                  placeholder="Additional context or approval notes..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Save Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </PageTransition>
    </AdminLayout>
  );
};

export default ExpenseCashbook;
