import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CreditCard, DollarSign, Calendar, CheckCircle2, Clock, 
  Printer, ArrowRight, UserCheck, AlertCircle, RefreshCw, X, ShieldAlert
} from 'lucide-react';
import AdminLayout from '../Common/AdminLayout';
import { PageTransition } from '../Common/MotionWrapper';

const StaffPayrollManagement = () => {
  const [records, setRecords] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
  const [totalWorkingDays, setTotalWorkingDays] = useState(26);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');

  // Modals
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [payModalSlip, setPayModalSlip] = useState(null);
  const [payData, setPayData] = useState({
    paymentMode: 'Bank Transfer',
    transactionReference: '',
    remarks: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/staff/payroll/records?month=${month}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error('Error fetching payroll records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [month]);

  const handleGeneratePayroll = async () => {
    if (!window.confirm(`Generate automated payroll slips for all active staff for ${month}? Unpaid leave deductions will be calculated automatically.`)) return;
    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/staff/payroll/generate', {
        month,
        totalWorkingDays: Number(totalWorkingDays)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data?.message || 'Payroll generated successfully!');
      fetchRecords();
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating payroll');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkAsPaid = async (e) => {
    e.preventDefault();
    if (!payModalSlip) return;
    setSubmittingPayment(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/staff/payroll/${payModalSlip._id}/pay`, payData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayModalSlip(null);
      setPayData({ paymentMode: 'Bank Transfer', transactionReference: '', remarks: '' });
      fetchRecords();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating payment status');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // KPIs
  const totalBaseSalary = records.reduce((s, r) => s + (r.baseSalary || 0), 0);
  const totalDeductions = records.reduce((s, r) => s + ((r.deductions || []).reduce((d, item) => d + (item.amount || 0), 0)), 0);
  const totalNetPay = records.reduce((s, r) => s + (r.netPay || 0), 0);
  const totalPaid = records.filter(r => r.paymentStatus === 'Paid').reduce((s, r) => s + (r.netPay || 0), 0);

  return (
    <AdminLayout>
      <PageTransition>
        <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-600" />
            Staff Payroll & Salary Disbursement
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Automated monthly salary calculation, attendance/leave deductions, and formal payslips
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
            onClick={handleGeneratePayroll}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Calculating...' : 'Run Monthly Payroll'}
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          {message}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Total Gross Salary</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ₹{totalBaseSalary.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-gray-400 mt-1">{records.length} Staff on payroll</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Leave Deductions</div>
          <div className="text-2xl font-bold text-rose-600">
            ₹{totalDeductions.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-gray-400 mt-1">Unpaid absence adjustments</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Net Payable Total</div>
          <div className="text-2xl font-bold text-indigo-600">
            ₹{totalNetPay.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-gray-400 mt-1">Institutional liability</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Disbursed to Date</div>
          <div className="text-2xl font-bold text-emerald-600">
            ₹{totalPaid.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {records.filter(r => r.paymentStatus === 'Paid').length} of {records.length} paid
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
            <UserCheck className="w-4 h-4 text-indigo-500" />
            Payroll Slips for {month} ({records.length})
          </div>
          <div className="text-xs text-gray-500">
            Standard Working Days: <strong>{totalWorkingDays} days</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Staff Code</th>
                <th className="px-6 py-3">Staff Name & Designation</th>
                <th className="px-6 py-3">Base Salary</th>
                <th className="px-6 py-3">Working / Leave</th>
                <th className="px-6 py-3">Deductions</th>
                <th className="px-6 py-3">Net Pay</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">Loading payroll data...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No payroll slips generated for {month}. Click "Run Monthly Payroll" above to compute.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const totalDed = (r.deductions || []).reduce((s, d) => s + (d.amount || 0), 0);
                  return (
                    <tr key={r._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750 transition">
                      <td className="px-6 py-4 font-mono font-medium text-xs text-indigo-600 dark:text-indigo-400">
                        {r.staffCode || r.staffId?.staffId || 'STF-001'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white">{r.staffName || r.staffId?.name}</div>
                        <div className="text-xs text-gray-400">{r.designation || r.staffId?.designation || 'Staff'}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                        ₹{r.baseSalary?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-400">
                        <div>Pres: <strong className="text-emerald-600">{r.presentDays}d</strong></div>
                        <div>Leaves: <strong className={r.leaveDays > 0 ? 'text-rose-600' : 'text-gray-400'}>{r.leaveDays}d</strong></div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-rose-600">
                        {totalDed > 0 ? `-₹${totalDed.toLocaleString('en-IN')}` : '₹0'}
                      </td>
                      <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">
                        ₹{r.netPay?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          r.paymentStatus === 'Paid' 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {r.paymentStatus === 'Paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {r.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {r.paymentStatus !== 'Paid' && (
                          <button
                            onClick={() => setPayModalSlip(r)}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedSlip(r)}
                          className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 rounded text-xs font-medium"
                        >
                          Payslip
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Disbursement Modal */}
      {payModalSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Disburse Salary: {payModalSlip.staffName}
            </h2>
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-900 text-sm">
              Net Amount: <strong>₹{payModalSlip.netPay?.toLocaleString('en-IN')}</strong> for {payModalSlip.month}
            </div>
            <form onSubmit={handleMarkAsPaid} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Disbursement Mode</label>
                <select
                  value={payData.paymentMode}
                  onChange={(e) => setPayData({ ...payData, paymentMode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Cheque">Bank Cheque</option>
                  <option value="UPI">UPI / Net Banking</option>
                  <option value="Cash">Cash Voucher</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Transaction Ref / UTR / Cheque #</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-2026-991203"
                  value={payData.transactionReference}
                  onChange={(e) => setPayData({ ...payData, transactionReference: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Salary credited to HDFC salary account"
                  value={payData.remarks}
                  onChange={(e) => setPayData({ ...payData, remarks: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setPayModalSlip(null)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {submittingPayment ? 'Processing...' : 'Confirm Paid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formal Payslip Modal / Print View */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-xs uppercase tracking-wider font-bold text-gray-400">Formal Salary Statement</span>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-semibold">
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button onClick={() => setSelectedSlip(null)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Payslip Card Layout */}
            <div className="p-6 border border-gray-200 rounded-xl space-y-4 bg-white text-gray-900">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold tracking-tight">CLASSTECH MODEL ACADEMY</h2>
                <p className="text-xs text-gray-500">Official Staff Salary Slip • Month of {selectedSlip.month}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs border-b pb-4">
                <div>
                  <div>Staff Name: <strong>{selectedSlip.staffName}</strong></div>
                  <div>Staff ID: <strong>{selectedSlip.staffCode}</strong></div>
                  <div>Designation: <strong>{selectedSlip.designation}</strong></div>
                </div>
                <div>
                  <div>Working Days: <strong>{selectedSlip.totalWorkingDays} days</strong></div>
                  <div>Present Days: <strong>{selectedSlip.presentDays} days</strong></div>
                  <div>Leave Days: <strong>{selectedSlip.leaveDays} days</strong></div>
                  <div>Status: <strong className={selectedSlip.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}>{selectedSlip.paymentStatus}</strong></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div className="font-semibold text-gray-700 uppercase border-b pb-1">Earnings</div>
                  <div className="flex justify-between">
                    <span>Basic Salary</span>
                    <span>₹{selectedSlip.baseSalary?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>Gross Earnings</span>
                    <span>₹{selectedSlip.grossPay?.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-semibold text-gray-700 uppercase border-b pb-1">Deductions</div>
                  {(selectedSlip.deductions || []).map((d, i) => (
                    <div key={i} className="flex justify-between text-rose-600">
                      <span>{d.title}</span>
                      <span>₹{d.amount?.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  {(!selectedSlip.deductions || selectedSlip.deductions.length === 0) && (
                    <div className="text-gray-400">None</div>
                  )}
                  <div className="flex justify-between font-bold pt-2 border-t text-rose-600">
                    <span>Total Deductions</span>
                    <span>₹{((selectedSlip.deductions || []).reduce((s, d) => s + (d.amount || 0), 0)).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-indigo-50 rounded-lg flex items-center justify-between font-bold text-sm text-indigo-900 border border-indigo-100">
                <span>NET TAKE HOME PAYABLE:</span>
                <span className="text-lg">₹{selectedSlip.netPay?.toLocaleString('en-IN')}</span>
              </div>

              <div className="pt-8 flex items-center justify-between text-xs text-gray-400">
                <div>Prepared By: Accounts Dept</div>
                <div>Authorized Signatory: Principal / Director</div>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </PageTransition>
    </AdminLayout>
  );
};

export default StaffPayrollManagement;
