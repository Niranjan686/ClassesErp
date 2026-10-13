const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const QuestionBank = require('../models/QuestionBank');
const Student = require('../models/Students');
const { authenticateAdmin, authenticateStudent } = require('../middleware/auth');

/**
 * ---------------- QUESTION BANK ENDPOINTS ----------------
 */

// 1. List questions from question bank
router.get('/questions', authenticateAdmin, async (req, res) => {
  try {
    const query = { instituteId: req.instituteId };
    if (req.query.courseId) query.courseId = req.query.courseId;
    if (req.query.subject) query.subject = req.query.subject;
    if (req.query.difficulty && req.query.difficulty !== 'ALL') query.difficulty = req.query.difficulty;

    const questions = await QuestionBank.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Add question to bank
router.post('/questions', authenticateAdmin, async (req, res) => {
  try {
    const { courseId, subject, topic, difficulty, questionType, questionText, options, marks, explanation } = req.body;
    if (!courseId || !subject || !questionText || !options || options.length < 2) {
      return res.status(400).json({ success: false, message: 'Please provide course, subject, question text and at least 2 options.' });
    }

    const question = new QuestionBank({
      instituteId: req.instituteId,
      courseId,
      subject,
      topic: topic || 'General',
      difficulty: difficulty || 'Medium',
      questionType: questionType || 'mcq',
      questionText,
      options,
      marks: Number(marks) || 1,
      explanation: explanation || '',
      createdBy: req.user ? req.user.name : 'Faculty',
    });

    const saved = await question.save();
    res.status(201).json({ success: true, message: 'Question saved to bank', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 3. Delete question
router.delete('/questions/:id', authenticateAdmin, async (req, res) => {
  try {
    await QuestionBank.findOneAndDelete({ _id: req.params.id, instituteId: req.instituteId });
    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ---------------- QUIZ MANAGEMENT ENDPOINTS ----------------
 */

// 4. List all quizzes
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.instituteId) query.instituteId = req.query.instituteId;
    if (req.query.courseId) query.courseId = req.query.courseId;
    if (req.query.batchId) query.batchId = req.query.batchId;

    const quizzes = await Quiz.find(query)
      .select('-questions.options.isCorrect -questions.explanation')
      .populate('courseId', 'courseName courseCode')
      .populate('batchId', 'batchName batchCode')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: quizzes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Get single quiz (Admin gets answer keys; students do not get answers before submission)
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('courseId', 'courseName courseCode')
      .populate('batchId', 'batchName batchCode');

    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    // Check if requester is student or public
    const isStudent = req.query.viewAs === 'student';
    let data = quiz.toObject();

    if (isStudent) {
      data.questions = data.questions.map(q => ({
        _id: q._id,
        questionText: q.questionText,
        questionType: q.questionType,
        marks: q.marks,
        options: q.options.map(o => ({ text: o.text })), // Hide isCorrect
      }));
      delete data.attempts; // Hide other attempts
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Create Quiz (Manual or Auto-generate from Question Bank)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const {
      title,
      courseId,
      batchId,
      subject,
      description,
      durationMinutes,
      questions: inputQuestions,
      autoGenerateCount,
      difficulty,
    } = req.body;

    let finalQuestions = [];

    if (autoGenerateCount && Number(autoGenerateCount) > 0) {
      // Auto-sample from Question Bank
      const qQuery = { instituteId: req.instituteId, courseId };
      if (difficulty && difficulty !== 'ALL') qQuery.difficulty = difficulty;
      const bankQuestions = await QuestionBank.find(qQuery).limit(Number(autoGenerateCount) * 2);
      
      // Shuffle & slice
      const shuffled = bankQuestions.sort(() => 0.5 - Math.random()).slice(0, Number(autoGenerateCount));
      finalQuestions = shuffled.map(q => ({
        questionId: q._id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        marks: q.marks,
        explanation: q.explanation,
      }));
    } else if (Array.isArray(inputQuestions) && inputQuestions.length > 0) {
      finalQuestions = inputQuestions;
    }

    if (finalQuestions.length === 0) {
      return res.status(400).json({ success: false, message: 'Quiz must contain at least one question.' });
    }

    const totalMarks = finalQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);

    const quiz = new Quiz({
      instituteId: req.instituteId,
      title,
      courseId,
      batchId: batchId || undefined,
      subject: subject || 'General Assessment',
      description: description || '',
      durationMinutes: Number(durationMinutes) || 30,
      totalMarks,
      passingPercentage: Number(req.body.passingPercentage) || 40,
      questions: finalQuestions,
      isPublished: req.body.isPublished !== undefined ? req.body.isPublished : true,
    });

    const saved = await quiz.save();
    res.status(201).json({ success: true, message: 'Quiz created successfully', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 7. Submit Quiz attempt and auto-grade
router.post('/:id/submit', async (req, res) => {
  try {
    const { studentId, studentName, grno, timeTakenSeconds, answers = [] } = req.body;
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    let totalScore = 0;
    let correctCount = 0;
    const gradedAnswers = [];

    quiz.questions.forEach((q, idx) => {
      const studentAns = answers.find(a => a.questionIndex === idx);
      const selectedIdx = studentAns ? studentAns.selectedOptionIndex : null;

      let isCorrect = false;
      let marksAwarded = 0;

      if (selectedIdx !== null && selectedIdx !== undefined && q.options[selectedIdx]) {
        if (q.options[selectedIdx].isCorrect) {
          isCorrect = true;
          marksAwarded = q.marks || 1;
          totalScore += marksAwarded;
          correctCount++;
        }
      }

      gradedAnswers.push({
        questionIndex: idx,
        questionText: q.questionText,
        selectedOptionIndex: selectedIdx,
        isCorrect,
        marksAwarded,
        explanation: q.explanation || '',
        correctOptionIndex: q.options.findIndex(o => o.isCorrect),
      });
    });

    const percentage = quiz.totalMarks > 0 ? Math.round((totalScore / quiz.totalMarks) * 100) : 0;
    const passed = percentage >= (quiz.passingPercentage || 40);

    const attemptRecord = {
      studentId,
      studentName: studentName || 'Student',
      grno: grno || '',
      submittedAt: new Date(),
      timeTakenSeconds: Number(timeTakenSeconds) || 0,
      score: totalScore,
      totalQuestions: quiz.questions.length,
      correctCount,
      percentage,
      passed,
      answers: gradedAnswers.map(g => ({
        questionIndex: g.questionIndex,
        selectedOptionIndex: g.selectedOptionIndex,
        isCorrect: g.isCorrect,
        marksAwarded: g.marksAwarded,
      })),
    };

    quiz.attempts.push(attemptRecord);
    await quiz.save();

    res.json({
      success: true,
      message: passed ? 'Congratulations! You passed the quiz!' : 'Quiz completed. Keep practicing!',
      result: {
        score: totalScore,
        totalMarks: quiz.totalMarks,
        totalQuestions: quiz.questions.length,
        correctCount,
        percentage,
        passed,
        passingPercentage: quiz.passingPercentage,
        gradedQuestions: gradedAnswers,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8. Quiz Leaderboard
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const sortedAttempts = quiz.attempts
      .map(a => ({
        studentName: a.studentName,
        grno: a.grno,
        score: a.score,
        percentage: a.percentage,
        timeTakenSeconds: a.timeTakenSeconds,
        passed: a.passed,
        submittedAt: a.submittedAt,
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.timeTakenSeconds - b.timeTakenSeconds;
      })
      .slice(0, 50);

    res.json({ success: true, data: sortedAttempts, quizTitle: quiz.title, totalMarks: quiz.totalMarks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 9. Delete Quiz
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await Quiz.findOneAndDelete({ _id: req.params.id, instituteId: req.instituteId });
    res.json({ success: true, message: 'Quiz removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
