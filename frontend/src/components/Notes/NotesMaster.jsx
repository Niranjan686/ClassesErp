import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, TextField,
  MenuItem, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Snackbar, Alert
} from '@mui/material';
import {
  BookOpen, FileText, Download, Eye, Plus, Trash2, Search, Filter, ShieldCheck, Lock
} from 'lucide-react';
import AdminLayout from '../Common/AdminLayout';
import api from '../../api';

const NotesMaster = () => {
  const [notes, setNotes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [previewNote, setPreviewNote] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    courseId: '',
    subject: 'Physics',
    chapter: 'Kinematics & Vector Laws',
    title: '',
    description: '',
    fileType: 'pdf',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileSize: '3.5 MB',
    allowDownload: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [noteRes, courseRes, batchRes] = await Promise.all([
        api.get('/notes'),
        api.get('/courses'),
        api.get('/batches'),
      ]);
      setNotes(noteRes.data.data || []);
      setCourses(courseRes.data.data || []);
      setBatches(batchRes.data.data || []);
    } catch (err) {
      setToast({ open: true, message: 'Failed to load study notes', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/notes', formData);
      if (res.data.success) {
        setToast({ open: true, message: 'Study material uploaded and published successfully!', severity: 'success' });
        setOpenModal(false);
        setFormData({
          courseId: '',
          subject: 'Physics',
          chapter: '',
          title: '',
          description: '',
          fileType: 'pdf',
          fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          fileSize: '3.5 MB',
          allowDownload: true,
        });
        fetchData();
      }
    } catch (err) {
      setToast({ open: true, message: 'Failed to publish note', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this study note?')) return;
    try {
      await api.delete(`/notes/${id}`);
      setToast({ open: true, message: 'Note deleted', severity: 'info' });
      fetchData();
    } catch (err) {
      setToast({ open: true, message: 'Delete failed', severity: 'error' });
    }
  };

  return (
    <AdminLayout>
      {/* Header Hero Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-white border border-blue-100 rounded-3xl p-6 mb-6 text-slate-900 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">Study Material & Digital Notes Master</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Organize PDF lecture notes, chapter formula sheets, watermarked anti-piracy documents and publish by batch
            </p>
          </div>
        </div>

        <button
          onClick={() => setOpenModal(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Upload New Material
        </button>
      </div>

        {/* Study Notes Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div
              key={note._id}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
                    {note.subject}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {note.fileSize}
                  </span>
                </div>

                <h3 className="text-sm font-black text-slate-800 line-clamp-1 mb-1">{note.title}</h3>
                <p className="text-xs font-bold text-indigo-600 mb-2">Chapter: {note.chapter}</p>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">{note.description || 'Comprehensive exam-focused study material with solved derivations.'}</p>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100 mb-3">
                  <span>Course: <b>{note.courseId?.courseName || 'All Courses'}</b></span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {note.viewCount || 0} views
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewNote(note)}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview PDF
                  </button>

                  <button
                    onClick={() => handleDelete(note._id)}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                    title="Delete Material"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Watermarked PDF Viewer Modal */}
        <Dialog open={!!previewNote} onClose={() => setPreviewNote(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, bgcolor: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>{previewNote?.title}</span>
            </div>
            <span className="text-xs font-mono text-slate-300">Watermark Protected</span>
          </DialogTitle>
          <DialogContent sx={{ p: 0, position: 'relative', height: '520px', bgcolor: '#f1f5f9' }}>
            {/* Dynamic Watermark Overlay */}
            <div className="watermark-overlay flex items-center justify-center pointer-events-none select-none">
              <div className="transform -rotate-45 text-center text-slate-400/25 font-black text-2xl tracking-widest leading-loose">
                APEX SCHOLARS ERP • CONFIDENTIAL<br />
                LICENSED STUDY MATERIAL • DO NOT DISTRIBUTE
              </div>
            </div>

            <iframe
              src={`${previewNote?.fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'}#toolbar=0`}
              title="PDF Reader"
              className="w-full h-full border-none"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
            <Button onClick={() => setPreviewNote(null)} sx={{ fontWeight: 700 }}>Close Preview</Button>
          </DialogActions>
        </Dialog>

        {/* Upload Material Dialog */}
        <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, bgcolor: '#0f172a', color: '#fff' }}>
            Upload Digital Study Material
          </DialogTitle>
          <form onSubmit={handleCreate}>
            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Material Document Title"
                    required
                    fullWidth
                    size="small"
                    placeholder="e.g. Mechanics & Newton Laws Comprehensive Formula Book"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Linked Course"
                    required
                    fullWidth
                    size="small"
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  >
                    {courses.map((c) => (
                      <MenuItem key={c._id} value={c._id}>{c.courseName}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Subject"
                    required
                    fullWidth
                    size="small"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Chapter / Module Name"
                    required
                    fullWidth
                    size="small"
                    placeholder="e.g. Chapter 04: Work, Energy and Power"
                    value={formData.chapter}
                    onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description & Solved Problem Count"
                    multiline
                    rows={2}
                    fullWidth
                    size="small"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
              <Button onClick={() => setOpenModal(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ fontWeight: 800, bgcolor: '#2563eb' }}>
                Publish Study Material
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Toast */}
        <Snackbar
          open={toast.open}
          autoHideDuration={4000}
          onClose={() => setToast({ ...toast, open: false })}
        >
          <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })}>
            {toast.message}
          </Alert>
        </Snackbar>
    </AdminLayout>
  );
};

export default NotesMaster;
