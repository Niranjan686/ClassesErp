import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LifeBuoy, Activity, Server, Cpu, Database, 
  MessageSquare, Plus, Clock, CheckCircle2, AlertTriangle, Send, RefreshCw, X
} from 'lucide-react';
import AdminLayout from '../Common/AdminLayout';
import { PageTransition } from '../Common/MotionWrapper';

const SupportHealthTelemetry = () => {
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' | 'telemetry'
  const [tickets, setTickets] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    subject: '',
    category: 'Bug / System Error',
    priority: 'Medium',
    description: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch tickets
      let ticketUrl = 'http://localhost:5000/api/support/tickets';
      if (statusFilter !== 'ALL') ticketUrl += `?status=${statusFilter}`;
      const tktRes = await axios.get(ticketUrl, { headers });
      setTickets(Array.isArray(tktRes.data?.data) ? tktRes.data.data : (Array.isArray(tktRes.data) ? tktRes.data : []));

      // Fetch health
      const healthRes = await axios.get('http://localhost:5000/api/support/system-health');
      setHealth(healthRes.data);
    } catch (err) {
      console.error('Error fetching support/health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/support/tickets', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowCreateModal(false);
      setFormData({
        subject: '',
        category: 'Bug / System Error',
        priority: 'Medium',
        description: ''
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`http://localhost:5000/api/support/tickets/${selectedTicket._id}/reply`, {
        message: replyText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedTicket(res.data.data);
      setReplyText('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error sending reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(`http://localhost:5000/api/support/tickets/${ticketId}/status`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket(res.data.data);
      }
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const formatUptime = (seconds) => {
    if (!seconds) return '0m';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d > 0 ? d + 'd ' : ''}${h > 0 ? h + 'h ' : ''}${m}m`;
  };

  return (
    <AdminLayout>
      <PageTransition>
        <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <LifeBuoy className="w-7 h-7 text-indigo-600" />
            Support Helpdesk & System Health Telemetry
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Enterprise technical assistance, issue tracking, and real-time database cluster telemetry
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Open Support Ticket
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-5 py-3 text-sm font-medium border-b-2 flex items-center gap-2 ${
            activeTab === 'tickets'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Support Tickets ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`px-5 py-3 text-sm font-medium border-b-2 flex items-center gap-2 ${
            activeTab === 'telemetry'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Activity className="w-4 h-4" />
          System Health Telemetry
        </button>
      </div>

      {/* Tab 1: Support Tickets */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Quick Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {['ALL', 'Open', 'In Progress', 'Resolved', 'Closed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-400">
              Showing {tickets.length} tickets
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Ticket #</th>
                  <th className="px-6 py-3">Subject & Category</th>
                  <th className="px-6 py-3">Reported By</th>
                  <th className="px-6 py-3">Priority</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Replies</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">Loading tickets...</td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No support tickets found. Click "Open Support Ticket" if you need technical assistance.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750 transition">
                      <td className="px-6 py-4 font-mono font-medium text-xs text-indigo-600 dark:text-indigo-400">
                        {t.ticketNo}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white">{t.subject}</div>
                        <div className="text-xs text-gray-400">{t.category} • {new Date(t.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-medium text-gray-800 dark:text-gray-200">{t.reportedByName}</div>
                        <div className="text-xs text-gray-400">{t.reportedByRole}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          t.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                          t.priority === 'High' ? 'bg-amber-100 text-amber-700' :
                          t.priority === 'Medium' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          t.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                          t.status === 'In Progress' ? 'bg-indigo-100 text-indigo-800' :
                          t.status === 'Closed' ? 'bg-gray-100 text-gray-700' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {t.replies?.length || 0} messages
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedTicket(t)}
                          className="px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded text-xs font-semibold"
                        >
                          View & Reply
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: System Health Telemetry */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>Cluster State</span>
                <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg">
                  <Activity className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-bold text-emerald-600 flex items-center gap-2">
                <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                {health?.status || 'OPTIMAL'}
              </div>
              <p className="text-xs text-gray-400 mt-1">Multi-tenant backend nodes active</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>Database Latency</span>
                <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-lg">
                  <Database className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-bold text-indigo-600">
                {health?.database?.latencyMs ?? 2} ms
              </div>
              <p className="text-xs text-gray-400 mt-1">MongoDB admin ping response</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>Node Process Uptime</span>
                <span className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-bold text-blue-600">
                {formatUptime(health?.uptimeSeconds)}
              </div>
              <p className="text-xs text-gray-400 mt-1">Continuous uptime without restart</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>Heap Memory Used</span>
                <span className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-lg">
                  <Cpu className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-bold text-purple-600">
                {health?.resources?.heapUsedMB || 0} / {health?.resources?.heapTotalMB || 0} MB
              </div>
              <p className="text-xs text-gray-400 mt-1">RSS: {health?.resources?.rssMB || 0} MB</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-600" />
              Runtime Infrastructure Environment
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-xs text-gray-400">Node Engine</div>
                <div className="font-semibold text-gray-800 dark:text-gray-200">{health?.environment?.nodeVersion || 'v24.x'}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-xs text-gray-400">Platform OS</div>
                <div className="font-semibold text-gray-800 dark:text-gray-200">{health?.environment?.platform || 'win32'}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-xs text-gray-400">Database Engine</div>
                <div className="font-semibold text-gray-800 dark:text-gray-200">MongoDB 7.x (Replica Set)</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-xs text-gray-400">API Gateway</div>
                <div className="font-semibold text-gray-800 dark:text-gray-200">Express REST + JWT Gateway</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details & Chat Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <span className="font-mono text-xs text-indigo-600 font-semibold">{selectedTicket.ticketNo}</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedTicket.subject}</h2>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status change toolbar */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg text-xs">
              <span className="text-gray-500">Status: <strong className="text-gray-800 dark:text-gray-200">{selectedTicket.status}</strong></span>
              <div className="flex gap-2">
                {['Open', 'In Progress', 'Resolved'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(selectedTicket._id, st)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      selectedTicket.status === st ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Mark {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Replies Thread */}
            <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-gray-50/50 dark:bg-gray-900/50 rounded-lg min-h-[220px]">
              {selectedTicket.replies?.map((r, i) => (
                <div 
                  key={i} 
                  className={`p-3 rounded-lg text-sm max-w-[85%] ${
                    r.senderRole.includes('SuperAdmin') || r.senderRole.includes('Platform')
                      ? 'ml-auto bg-indigo-600 text-white' 
                      : 'bg-white dark:bg-gray-800 border text-gray-900 dark:text-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1 opacity-80">
                    <span className="font-semibold">{r.senderName} ({r.senderRole})</span>
                    <span>{new Date(r.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{r.message}</p>
                </div>
              ))}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} className="flex gap-2 pt-2">
              <input
                type="text"
                required
                placeholder="Type your message or technical reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-1 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Reply
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-indigo-600" />
              Open New Support Ticket
            </h2>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Issue generating fee receipt PDF"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                  >
                    <option value="Bug / System Error">Bug / System Error</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Data Correction">Data Correction</option>
                    <option value="Billing / Subscription">Billing / Subscription</option>
                    <option value="Biometrics / Hardware Integration">Biometrics / Hardware</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Detailed Description *</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Explain what happened, expected behavior, and steps to reproduce..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
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

export default SupportHealthTelemetry;
