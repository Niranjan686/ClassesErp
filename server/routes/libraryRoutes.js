const express = require('express');
const router = express.Router();
const { Book, BookIssue } = require('../models/Library');
const Student = require('../models/Students');
const Staff = require('../models/Staff');
const { authenticateAdmin, authenticateStudent } = require('../middleware/auth');

/**
 * ---------------- BOOK CATALOG ----------------
 */
router.get('/books', async (req, res) => {
  try {
    const query = {};
    if (req.query.instituteId) query.instituteId = req.query.instituteId;
    if (req.query.category && req.query.category !== 'ALL') query.category = req.query.category;
    if (req.query.search) {
      const reg = new RegExp(req.query.search, 'i');
      query.$or = [{ title: reg }, { author: reg }, { isbn: reg }, { accessionNumber: reg }];
    }

    const books = await Book.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: books });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/books', authenticateAdmin, async (req, res) => {
  try {
    const { accessionNumber, totalCopies } = req.body;
    const copies = Number(totalCopies) || 1;

    const book = new Book({
      ...req.body,
      instituteId: req.instituteId,
      totalCopies: copies,
      availableCopies: copies,
    });

    const saved = await book.save();
    res.status(201).json({ success: true, message: 'Book added to catalog', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/books/:id', authenticateAdmin, async (req, res) => {
  try {
    const updated = await Book.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.instituteId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Book not found' });
    res.json({ success: true, message: 'Book updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/books/:id', authenticateAdmin, async (req, res) => {
  try {
    await Book.findOneAndDelete({ _id: req.params.id, instituteId: req.instituteId });
    res.json({ success: true, message: 'Book removed from catalog' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ---------------- CIRCULATION (ISSUE / RETURN / RENEW) ----------------
 */

// Issue Book
router.post('/issue', authenticateAdmin, async (req, res) => {
  try {
    const { bookId, borrowerId, borrowerType = 'Student', durationDays = 14, finePerDay = 5 } = req.body;
    const book = await Book.findOne({ _id: bookId, instituteId: req.instituteId });

    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    if (book.availableCopies <= 0) {
      return res.status(400).json({ success: false, message: `All copies of "${book.title}" are currently issued out.` });
    }

    let borrowerName = 'Borrower';
    let borrowerIdentifier = '';

    if (borrowerType === 'Student') {
      const stu = await Student.findOne({ _id: borrowerId, instituteId: req.instituteId });
      if (!stu) return res.status(404).json({ success: false, message: 'Student not found' });
      borrowerName = `${stu.fname} ${stu.lname}`;
      borrowerIdentifier = stu.grno;
    } else {
      const stf = await Staff.findOne({ _id: borrowerId, instituteId: req.instituteId });
      if (!stf) return res.status(404).json({ success: false, message: 'Staff member not found' });
      borrowerName = stf.name;
      borrowerIdentifier = stf.staffId || '';
    }

    const now = new Date();
    const dueDate = new Date(now.getTime() + Number(durationDays) * 24 * 60 * 60 * 1000);

    const issueRecord = new BookIssue({
      instituteId: req.instituteId,
      bookId: book._id,
      bookTitle: book.title,
      accessionNumber: book.accessionNumber,
      borrowerType,
      borrowerId,
      borrowerName,
      borrowerIdentifier,
      issueDate: now,
      dueDate,
      finePerDay: Number(finePerDay) || 5,
      status: 'Issued',
      issuedBy: req.user ? req.user.name : 'Librarian',
    });

    await issueRecord.save();

    // Decrement available copies
    book.availableCopies = Math.max(0, book.availableCopies - 1);
    if (book.availableCopies === 0) book.status = 'Issued Out';
    await book.save();

    res.status(201).json({
      success: true,
      message: `Book "${book.title}" issued to ${borrowerName} until ${dueDate.toISOString().split('T')[0]}`,
      data: issueRecord,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Return Book
router.post('/return/:issueId', authenticateAdmin, async (req, res) => {
  try {
    const issue = await BookIssue.findOne({ _id: req.params.issueId, instituteId: req.instituteId });
    if (!issue) return res.status(404).json({ success: false, message: 'Issue record not found' });
    if (issue.status === 'Returned') {
      return res.status(400).json({ success: false, message: 'Book is already recorded as returned.' });
    }

    const returnDate = new Date();
    const dueDate = new Date(issue.dueDate);
    let overdueDays = 0;
    let fineAmount = 0;

    if (returnDate > dueDate) {
      const diffTime = returnDate.getTime() - dueDate.getTime();
      overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fineAmount = overdueDays * (issue.finePerDay || 5);
    }

    issue.status = 'Returned';
    issue.returnDate = returnDate;
    issue.overdueDays = overdueDays;
    issue.fineAmount = fineAmount;
    issue.receivedBy = req.user ? req.user.name : 'Librarian';
    if (req.body.finePaid !== undefined) issue.finePaid = !!req.body.finePaid;
    await issue.save();

    // Increment available copies
    await Book.findByIdAndUpdate(issue.bookId, {
      $inc: { availableCopies: 1 },
      status: 'Available',
    });

    res.json({
      success: true,
      message: `Book returned successfully. Overdue days: ${overdueDays}, Fine: ₹${fineAmount}`,
      data: issue,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Renew Book
router.post('/renew/:issueId', authenticateAdmin, async (req, res) => {
  try {
    const { extraDays = 14 } = req.body;
    const issue = await BookIssue.findOne({ _id: req.params.issueId, instituteId: req.instituteId });
    if (!issue) return res.status(404).json({ success: false, message: 'Issue record not found' });
    if (issue.status === 'Returned') return res.status(400).json({ success: false, message: 'Cannot renew a returned book' });

    const currentDue = new Date(issue.dueDate);
    issue.dueDate = new Date(currentDue.getTime() + Number(extraDays) * 24 * 60 * 60 * 1000);
    issue.renewCount = (issue.renewCount || 0) + 1;
    await issue.save();

    res.json({
      success: true,
      message: `Book renewal approved. New due date: ${issue.dueDate.toISOString().split('T')[0]}`,
      data: issue,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// List Circulation Records
router.get('/issues', authenticateAdmin, async (req, res) => {
  try {
    const query = { instituteId: req.instituteId };
    if (req.query.status && req.query.status !== 'ALL') query.status = req.query.status;

    const list = await BookIssue.find(query).sort({ createdAt: -1 });

    // Auto-calculate overdue days for active issues
    const now = new Date();
    const enriched = list.map(item => {
      const obj = item.toObject();
      if (obj.status === 'Issued' && new Date(obj.dueDate) < now) {
        const diffTime = now.getTime() - new Date(obj.dueDate).getTime();
        obj.currentOverdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        obj.estimatedFine = obj.currentOverdueDays * (obj.finePerDay || 5);
      }
      return obj;
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Student Self-View of Borrowed Books
 */
router.get('/my-books', authenticateStudent, async (req, res) => {
  try {
    const myIssues = await BookIssue.find({
      instituteId: req.instituteId,
      borrowerId: req.student._id,
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: myIssues });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
