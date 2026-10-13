import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, IconButton, Alert, Snackbar, Grid, CircularProgress, Tabs, Tab
} from '@mui/material';
import { Plus, BookOpen, RotateCcw, Search, CheckCircle, Clock } from 'lucide-react';
import AdminLayout from '../Common/AdminLayout';
import { PageTransition } from '../Common/MotionWrapper';
import api from '../../api';

const LibraryManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');

  // Dialogs
  const [openAddBookDialog, setOpenAddBookDialog] = useState(false);
  const [openIssueDialog, setOpenIssueDialog] = useState(false);

  // Forms
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    accessionNo: `ACC-${Math.floor(1000 + Math.random() * 9000)}`,
    category: 'Computer Science',
    totalCopies: 5
  });

  const [issueForm, setIssueForm] = useState({
    bookId: '',
    borrowerType: 'student',
    studentId: '',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bRes, iRes, sRes] = await Promise.all([
        api.get('/library/books'),
        api.get('/library/issues'),
        api.get('/students')
      ]);
      setBooks(Array.isArray(bRes.data) ? bRes.data : (bRes.data?.data || []));
      setIssues(Array.isArray(iRes.data) ? iRes.data : (iRes.data?.data || []));
      setStudents(Array.isArray(sRes.data) ? sRes.data : (sRes.data?.data || []));
    } catch (err) {
      setToast({ open: true, message: 'Failed to load library data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      await api.post('/library/books', { ...bookForm, totalCopies: Number(bookForm.totalCopies) });
      setToast({ open: true, message: 'Book catalogued into library!', severity: 'success' });
      setOpenAddBookDialog(false);
      fetchData();
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Error adding book', severity: 'error' });
    }
  };

  const handleIssueBook = async (e) => {
    e.preventDefault();
    try {
      await api.post('/library/issue', issueForm);
      setToast({ open: true, message: 'Book issued successfully!', severity: 'success' });
      setOpenIssueDialog(false);
      fetchData();
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Error issuing book', severity: 'error' });
    }
  };

  const handleReturnBook = async (issueId) => {
    try {
      const res = await api.post(`/library/return/${issueId}`, { conditionOnReturn: 'Good' });
      const fineMsg = res.data?.fineAmount ? ` (Fine collected: ₹${res.data.fineAmount})` : '';
      setToast({ open: true, message: `Book returned successfully!${fineMsg}`, severity: 'success' });
      fetchData();
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Error processing return', severity: 'error' });
    }
  };

  const filteredBooks = (Array.isArray(books) ? books : []).filter(b =>
    (b.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.author || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.isbn || '').includes(searchTerm)
  );

  return (
    <AdminLayout>
      <PageTransition>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight="900" color="#0f172a">
              Library & Asset Circulation Management
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage ISBN catalogues, loan issues, returns, and automated ₹5/day overdue fine calculation
            </Typography>
          </Box>
          <Box display="flex" gap={1.5}>
            <Button
              variant="outlined"
              startIcon={<BookOpen className="w-4 h-4" />}
              onClick={() => setOpenAddBookDialog(true)}
              sx={{ borderColor: '#4338CA', color: '#4338CA', fontWeight: 700, textTransform: 'none' }}
            >
              Add Book
            </Button>
            <Button
              variant="contained"
              startIcon={<Plus className="w-4 h-4" />}
              onClick={() => setOpenIssueDialog(true)}
              sx={{ bgcolor: '#4338CA', '&:hover': { bgcolor: '#3730A3' }, fontWeight: 700, textTransform: 'none' }}
            >
              Issue Book
            </Button>
          </Box>
        </Box>

        <Paper sx={{ mb: 3, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            sx={{ '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', py: 1.5 }, '& .Mui-selected': { color: '#4338CA' } }}
          >
            <Tab label="Book Catalogue" />
            <Tab label="Active Book Loans & Overdue" />
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
                <Box p={2} borderBottom="1px solid #E2E8F0">
                  <TextField
                    size="small"
                    placeholder="Search by title, author, ISBN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: { xs: '100%', sm: 380 } }}
                  />
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Accession No</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Book Title</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Author</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Available / Total</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredBooks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5, color: '#64748B' }}>
                            No books catalogued yet. Click "Add Book" to catalogue books.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredBooks.map(b => (
                          <TableRow key={b._id} hover>
                            <TableCell sx={{ fontWeight: 800, color: '#4338CA' }}>{b.accessionNo}</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>{b.title}</TableCell>
                            <TableCell>{b.author}</TableCell>
                            <TableCell><Chip label={b.category} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{b.availableCopies} / {b.totalCopies} Copies</TableCell>
                            <TableCell>
                              <Chip
                                label={b.availableCopies > 0 ? 'In Stock' : 'Out on Loan'}
                                size="small"
                                sx={{
                                  bgcolor: b.availableCopies > 0 ? '#DCFCE7' : '#FEE2E2',
                                  color: b.availableCopies > 0 ? '#166534' : '#991B1B',
                                  fontWeight: 800
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))
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
                        <TableCell sx={{ fontWeight: 800 }}>Book Title</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Borrower</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Issue Date</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Due Date</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Fine (₹5/day)</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {issues.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5, color: '#64748B' }}>
                            Zero active book loans currently pending return.
                          </TableCell>
                        </TableRow>
                      ) : (
                        issues.map(iss => {
                          const isOverdue = new Date(iss.dueDate) < new Date() && iss.status === 'Issued';
                          const diffDays = isOverdue ? Math.ceil((new Date() - new Date(iss.dueDate)) / (1000 * 60 * 60 * 24)) : 0;
                          const fine = diffDays * 5;
                          return (
                            <TableRow key={iss._id} hover>
                              <TableCell sx={{ fontWeight: 800 }}>{iss.bookId?.title || 'Library Book'}</TableCell>
                              <TableCell>{iss.studentId ? `${iss.studentId.fname} ${iss.studentId.lname}` : 'Staff Member'}</TableCell>
                              <TableCell>{new Date(iss.issueDate).toLocaleDateString()}</TableCell>
                              <TableCell sx={{ color: isOverdue ? '#DC2626' : 'inherit', fontWeight: isOverdue ? 'bold' : 'normal' }}>
                                {new Date(iss.dueDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {fine > 0 ? (
                                  <Chip label={`₹${fine} (${diffDays}d Late)`} size="small" sx={{ bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 800 }} />
                                ) : (
                                  <Chip label="₹0 (On Schedule)" size="small" sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 800 }} />
                                )}
                              </TableCell>
                              <TableCell sx={{ textAlign: 'right' }}>
                                {iss.status === 'Issued' ? (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => handleReturnBook(iss._id)}
                                    sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none', fontWeight: 700 }}
                                  >
                                    Accept Return
                                  </Button>
                                ) : (
                                  <Chip label="Returned" size="small" />
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
          </>
        )}

        {/* Add Book Dialog */}
        <Dialog open={openAddBookDialog} onClose={() => setOpenAddBookDialog(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleAddBook}>
            <DialogTitle sx={{ fontWeight: 800 }}>Catalogue New Book</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Book Title" required value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Author Name" required value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="ISBN / Catalogue Code" value={bookForm.isbn} onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Total Number of Copies" type="number" value={bookForm.totalCopies} onChange={(e) => setBookForm({ ...bookForm, totalCopies: Number(e.target.value) })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Category" value={bookForm.category} onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })} />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenAddBookDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4338CA' }}>Save Book</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Issue Book Dialog */}
        <Dialog open={openIssueDialog} onClose={() => setOpenIssueDialog(false)} maxWidth="xs" fullWidth>
          <form onSubmit={handleIssueBook}>
            <DialogTitle sx={{ fontWeight: 800 }}>Issue Library Book</DialogTitle>
            <DialogContent dividers>
              <TextField select fullWidth label="Select Book" required value={issueForm.bookId} onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })} sx={{ mb: 2 }}>
                {books.filter(b => b.availableCopies > 0).map(b => (
                  <MenuItem key={b._id} value={b._id}>{b.title} ({b.availableCopies} available)</MenuItem>
                ))}
              </TextField>
              <TextField select fullWidth label="Select Enrolled Student" required value={issueForm.studentId} onChange={(e) => setIssueForm({ ...issueForm, studentId: e.target.value })} sx={{ mb: 2 }}>
                {students.map(s => (
                  <MenuItem key={s._id} value={s._id}>{s.fname} {s.lname} (Roll #{s.rollno})</MenuItem>
                ))}
              </TextField>
              <TextField fullWidth label="Return Due Date" type="date" required value={issueForm.dueDate} onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })} />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenIssueDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4338CA' }}>Confirm Issue</Button>
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

export default LibraryManagement;
