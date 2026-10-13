const mongoose = require('mongoose');

// 1. Book Schema
const bookSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
  accessionNumber: { type: String, required: true, uppercase: true, trim: true },
  isbn: { type: String, default: '', trim: true },
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  publisher: { type: String, default: '' },
  edition: { type: String, default: '1st Edition' },
  category: {
    type: String,
    enum: ['Computer Science', 'Commerce & Accounting', 'Mathematics', 'Science', 'Literature & Languages', 'General Knowledge', 'Reference', 'Other'],
    default: 'Computer Science',
    index: true,
  },
  totalCopies: { type: Number, required: true, default: 1, min: 1 },
  availableCopies: { type: Number, required: true, default: 1, min: 0 },
  shelfLocation: { type: String, default: 'Shelf A-1' },
  status: {
    type: String,
    enum: ['Available', 'Issued Out', 'Archived / Lost'],
    default: 'Available',
  },
}, { timestamps: true });

bookSchema.index({ instituteId: 1, accessionNumber: 1 }, { unique: true });
bookSchema.index({ instituteId: 1, title: 'text', author: 'text', isbn: 'text' });

// 2. Book Issue Record Schema
const bookIssueSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
  bookTitle: { type: String, required: true },
  accessionNumber: { type: String, required: true },
  borrowerType: { type: String, enum: ['Student', 'Staff'], default: 'Student' },
  borrowerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  borrowerName: { type: String, required: true },
  borrowerIdentifier: { type: String, default: '' }, // GR No or Staff ID
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: Date,
  renewCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Issued', 'Returned', 'Overdue', 'Lost / Damaged'],
    default: 'Issued',
    index: true,
  },
  overdueDays: { type: Number, default: 0 },
  finePerDay: { type: Number, default: 5 }, // Default ₹5 per day
  fineAmount: { type: Number, default: 0 },
  finePaid: { type: Boolean, default: false },
  remarks: String,
  issuedBy: { type: String, default: 'Librarian' },
  receivedBy: String,
}, { timestamps: true });

bookIssueSchema.index({ instituteId: 1, status: 1 });
bookIssueSchema.index({ instituteId: 1, borrowerId: 1 });

const Book = mongoose.model('Book', bookSchema);
const BookIssue = mongoose.model('BookIssue', bookIssueSchema);

module.exports = {
  Book,
  BookIssue,
};
