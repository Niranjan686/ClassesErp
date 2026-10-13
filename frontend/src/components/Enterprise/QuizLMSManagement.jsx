import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Award, HelpCircle, Plus, BookOpen, Clock, 
  Trash2, Eye, CheckCircle2, ListChecks, Filter, Layers
} from 'lucide-react';
import AdminLayout from '../Common/AdminLayout';
import { PageTransition } from '../Common/MotionWrapper';

const QuizLMSManagement = () => {
  const [activeTab, setActiveTab] = useState('quizzes'); // 'quizzes' | 'question_bank'
  const [quizzes, setQuizzes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  // Modals
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [showCreateQuizModal, setShowCreateQuizModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Question Form
  const [qForm, setQForm] = useState({
    courseId: '',
    subject: '',
    topic: '',
    difficulty: 'Medium',
    questionText: '',
    marks: 1,
    explanation: '',
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ]
  });

  // Quiz Form
  const [quizForm, setQuizForm] = useState({
    title: '',
    courseId: '',
    batchId: '',
    subject: '',
    description: '',
    durationMinutes: 30,
    creationMode: 'bank', // 'bank' | 'manual'
    autoGenerateCount: 5,
    difficulty: 'Medium',
    manualQuestions: [
      {
        questionText: '',
        marks: 1,
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ]
      }
    ]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Courses & Batches
      const [cRes, bRes] = await Promise.all([
        axios.get('http://localhost:5000/api/courses', { headers }).catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/batches', { headers }).catch(() => ({ data: [] })),
      ]);

      const cData = Array.isArray(cRes.data?.data) ? cRes.data.data : (Array.isArray(cRes.data) ? cRes.data : []);
      const bData = Array.isArray(bRes.data?.data) ? bRes.data.data : (Array.isArray(bRes.data) ? bRes.data : []);
      setCourses(cData);
      setBatches(bData);

      if (cData.length > 0 && !qForm.courseId) {
        setQForm(prev => ({ ...prev, courseId: cData[0]._id, subject: cData[0].courseName }));
        setQuizForm(prev => ({ ...prev, courseId: cData[0]._id, subject: cData[0].courseName }));
      }
      if (bData.length > 0 && !quizForm.batchId) {
        setQuizForm(prev => ({ ...prev, batchId: bData[0]._id }));
      }

      // Quizzes
      const qzRes = await axios.get('http://localhost:5000/api/quizzes', { headers }).catch(() => ({ data: [] }));
      setQuizzes(Array.isArray(qzRes.data?.data) ? qzRes.data.data : (Array.isArray(qzRes.data) ? qzRes.data : []));

      // Question Bank
      const qbRes = await axios.get('http://localhost:5000/api/quizzes/questions', { headers }).catch(() => ({ data: [] }));
      setQuestions(Array.isArray(qbRes.data?.data) ? qbRes.data.data : (Array.isArray(qbRes.data) ? qbRes.data : []));
    } catch (err) {
      console.error('Error fetching quiz data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/quizzes/questions', qForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddQuestionModal(false);
      setQForm({
        courseId: courses[0]?._id || '',
        subject: courses[0]?.courseName || '',
        topic: '',
        difficulty: 'Medium',
        questionText: '',
        marks: 1,
        explanation: '',
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ]
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: quizForm.title,
        courseId: quizForm.courseId,
        batchId: quizForm.batchId,
        subject: quizForm.subject,
        description: quizForm.description,
        durationMinutes: Number(quizForm.durationMinutes),
      };

      if (quizForm.creationMode === 'bank') {
        payload.autoGenerateCount = Number(quizForm.autoGenerateCount);
        payload.difficulty = quizForm.difficulty;
      } else {
        payload.questions = quizForm.manualQuestions;
      }

      await axios.post('http://localhost:5000/api/quizzes', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowCreateQuizModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this question from question bank?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/quizzes/questions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting question');
    }
  };

  const handleOptionChange = (idx, text) => {
    const opts = [...qForm.options];
    opts[idx].text = text;
    setQForm({ ...qForm, options: opts });
  };

  const handleCorrectOptionSelect = (idx) => {
    const opts = qForm.options.map((o, i) => ({
      ...o,
      isCorrect: i === idx
    }));
    setQForm({ ...qForm, options: opts });
  };

  return (
    <AdminLayout>
      <PageTransition>
        <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="w-7 h-7 text-indigo-600" />
            LMS Assessments & Online Quizzes
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Question bank taxonomy, auto-generated timed tests, and student assessment tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'quizzes' ? (
            <button
              onClick={() => setShowCreateQuizModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Create Assessment Quiz
            </button>
          ) : (
            <button
              onClick={() => setShowAddQuestionModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Add Question to Bank
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`px-5 py-3 text-sm font-medium border-b-2 flex items-center gap-2 ${
            activeTab === 'quizzes'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <ListChecks className="w-4 h-4" />
          Active Quizzes ({quizzes.length})
        </button>
        <button
          onClick={() => setActiveTab('question_bank')}
          className={`px-5 py-3 text-sm font-medium border-b-2 flex items-center gap-2 ${
            activeTab === 'question_bank'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Question Bank Repository ({questions.length})
        </button>
      </div>

      {/* Tab 1: Quizzes List */}
      {activeTab === 'quizzes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-gray-500">Loading quizzes...</div>
          ) : quizzes.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-gray-200">
              No quizzes published yet. Click "Create Assessment Quiz" to publish your first online test.
            </div>
          ) : (
            quizzes.map((q) => (
              <div key={q._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-4 hover:border-indigo-300 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                      {q.subject || 'Academic'}
                    </span>
                    <h3 className="font-bold text-gray-900 dark:text-white mt-1 text-base">{q.title}</h3>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    <Clock className="w-3 h-3" />
                    {q.durationMinutes}m
                  </span>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <div>Course: <strong className="text-gray-700 dark:text-gray-200">{q.courseId?.courseName || 'General'}</strong></div>
                  <div>Batch: <strong className="text-gray-700 dark:text-gray-200">{q.batchId?.batchName || 'All Batches'}</strong></div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span>Questions: <strong>{q.questions?.length || 0}</strong></span>
                    <span>Total Marks: <strong>{q.totalMarks || 10}</strong></span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Created {new Date(q.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setSelectedQuiz(q)}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Question Bank */}
      {activeTab === 'question_bank' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Item Repository ({questions.length} questions)
              </span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <div className="py-8 text-center text-gray-500">Loading questions...</div>
              ) : questions.length === 0 ? (
                <div className="py-8 text-center text-gray-500">No questions in the repository yet.</div>
              ) : (
                questions.map((q, idx) => (
                  <div key={q._id} className="p-5 hover:bg-gray-50/50 dark:hover:bg-gray-750 transition space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-400">Q{idx + 1}.</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {q.subject}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                            q.difficulty === 'Hard' ? 'bg-red-50 text-red-700' :
                            q.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700' :
                            'bg-emerald-50 text-emerald-700'
                          }`}>
                            {q.difficulty}
                          </span>
                          <span className="text-xs text-gray-400">{q.marks} Mark{q.marks > 1 ? 's' : ''}</span>
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white pt-1">{q.questionText}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(q._id)}
                        className="text-gray-400 hover:text-rose-600 p-1 rounded"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                      {q.options?.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-lg border flex items-center justify-between ${
                            opt.isCorrect 
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-medium' 
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          <span>{String.fromCharCode(65 + oIdx)}. {opt.text}</span>
                          {opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800/60 p-2 rounded">
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              Add Question to Bank
            </h2>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Course *</label>
                  <select
                    value={qForm.courseId}
                    onChange={(e) => {
                      const c = courses.find(item => item._id === e.target.value);
                      setQForm({ ...qForm, courseId: e.target.value, subject: c ? c.courseName : qForm.subject });
                    }}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                  >
                    {courses.map(c => <option key={c._id} value={c._id}>{c.courseName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={qForm.subject}
                    onChange={(e) => setQForm({ ...qForm, subject: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
                  <select
                    value={qForm.difficulty}
                    onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={qForm.marks}
                    onChange={(e) => setQForm({ ...qForm, marks: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Question Statement *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Enter the question text..."
                  value={qForm.questionText}
                  onChange={(e) => setQForm({ ...qForm, questionText: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Multiple Choice Options (Select radio for correct answer) *
                </label>
                {qForm.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={opt.isCorrect}
                      onChange={() => handleCorrectOptionSelect(i)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-gray-500 w-4">{String.fromCharCode(65 + i)}.</span>
                    <input
                      type="text"
                      required
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      value={opt.text}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      className="flex-1 px-3 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Solution / Explanation (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Why is this answer correct?"
                  value={qForm.explanation}
                  onChange={(e) => setQForm({ ...qForm, explanation: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save to Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Quiz Modal */}
      {showCreateQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Publish Online Quiz
            </h2>
            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Quiz Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Physics Assessment 2026"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Target Course *</label>
                  <select
                    value={quizForm.courseId}
                    onChange={(e) => setQuizForm({ ...quizForm, courseId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                  >
                    {courses.map(c => <option key={c._id} value={c._id}>{c.courseName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Target Batch *</label>
                  <select
                    value={quizForm.batchId}
                    onChange={(e) => setQuizForm({ ...quizForm, batchId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                  >
                    {batches.map(b => <option key={b._id} value={b._id}>{b.batchName}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={quizForm.subject}
                    onChange={(e) => setQuizForm({ ...quizForm, subject: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (Minutes) *</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    required
                    value={quizForm.durationMinutes}
                    onChange={(e) => setQuizForm({ ...quizForm, durationMinutes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                  />
                </div>
              </div>

              {/* Mode Selection */}
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-lg space-y-3">
                <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-300">
                  Question Source Strategy
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="qMode"
                      value="bank"
                      checked={quizForm.creationMode === 'bank'}
                      onChange={() => setQuizForm({ ...quizForm, creationMode: 'bank' })}
                    />
                    Auto-sample from Question Bank
                  </label>
                </div>

                {quizForm.creationMode === 'bank' && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Number of Questions</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={quizForm.autoGenerateCount}
                        onChange={(e) => setQuizForm({ ...quizForm, autoGenerateCount: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded text-xs bg-white dark:bg-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Difficulty Filter</label>
                      <select
                        value={quizForm.difficulty}
                        onChange={(e) => setQuizForm({ ...quizForm, difficulty: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded text-xs bg-white dark:bg-gray-800"
                      >
                        <option value="ALL">Any Difficulty</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateQuizModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Publish Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Quiz Details Modal */}
      {selectedQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">
                  {selectedQuiz.subject}
                </span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{selectedQuiz.title}</h2>
              </div>
              <button onClick={() => setSelectedQuiz(null)} className="px-3 py-1 bg-gray-100 rounded text-xs">
                Close
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs bg-gray-50 p-3 rounded-lg">
              <div>Duration: <strong>{selectedQuiz.durationMinutes} Mins</strong></div>
              <div>Questions: <strong>{selectedQuiz.questions?.length || 0}</strong></div>
              <div>Total Marks: <strong>{selectedQuiz.totalMarks || 10}</strong></div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Assessment Questions</h4>
              {selectedQuiz.questions?.map((q, i) => (
                <div key={i} className="p-3 border rounded-lg space-y-2 text-xs">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {i + 1}. {q.questionText} ({q.marks} mark)
                  </div>
                  <div className="grid grid-cols-2 gap-2 pl-3">
                    {q.options?.map((opt, oIdx) => (
                      <div key={oIdx} className="text-gray-600 dark:text-gray-400">
                        {String.fromCharCode(65 + oIdx)}. {opt.text}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
        </div>
      </PageTransition>
    </AdminLayout>
  );
};

export default QuizLMSManagement;
