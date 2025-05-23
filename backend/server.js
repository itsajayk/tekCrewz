// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fetch = require('node-fetch');               // for AI Insights call
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'https://tekcrewz.com',
  'https://www.tekcrewz.com'
];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.options('*', cors({ origin: allowedOrigins, credentials: true }));

// ── Body Parsers ───────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── MongoDB ───────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB error:', err));

// ── Cloudinary ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name:   process.env.CLOUDINARY_CLOUD_NAME,
  api_key:      process.env.CLOUDINARY_API_KEY,
  api_secret:   process.env.CLOUDINARY_API_SECRET,
});

// ── Multer + Cloudinary ────────────────────────────────────────────────
// for candidate images/docs (auto detect image or PDF)
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'candidates',
    resource_type: 'auto'
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// for course documents (PDF only)
const courseDocStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'course_docs', resource_type: 'raw' }
});
const uploadCourseDoc = multer({
  storage: courseDocStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed.'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ── Schemas & Models ──────────────────────────────────────────────────
const candidateSchema = new mongoose.Schema({
  referrerId:         String,
  studentId:          { type: String, unique: true },
  candidateName:      String,
  college:            String,
  candidateDegree:    String,
  programme:          String,
  candidateCourseName:String,
  marksType:          { type: String, enum: ['CGPA','Percentage'] },
  score:              Number,
  scholarshipSecured: String,
  mobile:             String,
  parentMobile:       String,
  email:              String,
  coursesEnquired:    String,
  dateOfVisit:        Date,
  paymentTerm:        String,
  communicationScore: Number,
  candidatePic:       String,
  markStatement:      String,
  signature:          String,
  paidAmount:         Number,
  courseRegistered:   String,
  paidDate:           Date,
  status:             String,
  role:               String
}, { timestamps: true });
const Candidate = mongoose.model('Candidate', candidateSchema);

const studentProfileSchema = new mongoose.Schema({
  studentId:     String,
  candidateName: String,
  email:         String,
  mobile:        String
}, { timestamps: true });
const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);

const attendanceSchema = new mongoose.Schema({
  studentId: String,
  date:      Date,
  status:    String
});
const Attendance = mongoose.model('Attendance', attendanceSchema);

const courseDocSchema = new mongoose.Schema({
  courseId: String,
  type:     String,
  url:      String
}, { timestamps: true });
const CourseDoc = mongoose.model('CourseDoc', courseDocSchema);

const assignmentSchema = new mongoose.Schema({
  studentId:        String,
  unit:             String,
  studyMaterialUrl: String,
  closedAt:         Date,
  unlockedUntil:    Date,
  submissionCode:   String,
  results: {
    score: Number,
    passed: Boolean
  },
  feedback:         String
}, { timestamps: true });
const Assignment = mongoose.model('Assignment', assignmentSchema);

// ── Routes ─────────────────────────────────────────────────────────────

// Create Candidate (with file uploads)
app.post(
  '/api/candidates',
  (req, res, next) => {
    upload.fields([
      { name: 'candidatePic',  maxCount: 1 },
      { name: 'markStatement', maxCount: 1 },
      { name: 'signature',     maxCount: 1 }
    ])(req, res, err => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  },
  async (req, res) => {
    try {
      ['score','communicationScore','paidAmount'].forEach(k => {
        if (req.body[k] != null) req.body[k] = Number(req.body[k]);
      });
      const newCandidate = new Candidate({
        ...req.body,
        candidatePic:  req.files.candidatePic?.[0]?.path,
        markStatement: req.files.markStatement?.[0]?.path,
        signature:     req.files.signature?.[0]?.path
      });
      await newCandidate.save();
      res.status(201).json({ message: 'Candidate saved', candidate: newCandidate });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Read Candidates
app.get('/api/candidates', async (req, res) => {
  try {
    const list = await Candidate.find();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Candidate
app.put('/api/candidates/:id', async (req, res) => {
  try {
    const updated = await Candidate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Candidate
app.delete('/api/candidates/:id', async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Candidate deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Insights
app.post('/api/ai/insights', async (req, res) => {
  try {
    const { performance, projects, role, month } = req.body;
    const prompt = `
You are a helpful assistant. Here is the ${role} data for ${month}:
${JSON.stringify({ performance, projects }, null, 2)}

Please provide:
1. A 2-sentence summary.
2. Top 3 improvement suggestions.
3. One follow-up action item.
`;
    const apiRes = await fetch(
      'https://gemini.googleapis.com/v1beta2/models/gemini-1.5-flash:generateText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GOOGLE_API_KEY}`
        },
        body: JSON.stringify({ prompt })
      }
    );
    const data = await apiRes.json();
    if (!apiRes.ok) throw new Error(data);
    res.json({ text: data.candidates?.[0]?.output || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student Dashboard
app.get('/api/students/:studentId/profile', async (req, res) => {
  const prof = await StudentProfile.findOne({ studentId: req.params.studentId });
  res.json(prof);
});
app.get('/api/students/:studentId/attendance', async (req, res) => {
  const atts = await Attendance.find({ studentId: req.params.studentId }).sort('date');
  res.json(atts);
});
app.get('/api/courses/:courseId/docs', async (req, res) => {
  const docs = await CourseDoc.find({ courseId: req.params.courseId });
  const out = {};
  docs.forEach(d => (out[d.type] = d.url));
  res.json(out);
});
app.get('/api/assignments/:studentId', async (req, res) => {
  const all = await Assignment.find({ studentId: req.params.studentId });
  const now = new Date();
  res.json(all.map(a => ({
    unit: a.unit,
    studyMaterialUrl: a.studyMaterialUrl,
    closed:     a.closedAt     ? now > a.closedAt     : false,
    unlocked:   a.unlockedUntil? now < a.unlockedUntil: false,
    submissionCode: a.submissionCode,
    results:    a.results,
    feedback:   a.feedback
  })));
});
app.post('/api/assignments/:studentId/submit', async (req, res) => {
  await Assignment.findOneAndUpdate(
    { studentId: req.params.studentId, unit: req.body.unit },
    { submissionCode: req.body.code }
  );
  res.sendStatus(204);
});
app.post('/api/assignments/:studentId/unlock', async (req, res) => {
  await Assignment.findOneAndUpdate(
    { studentId: req.params.studentId, unit: req.body.unit },
    { unlockedUntil: new Date(Date.now() + 2*86400000) }
  );
  res.sendStatus(204);
});
app.post('/api/assignments/:studentId/feedback', async (req, res) => {
  await Assignment.findOneAndUpdate(
    { studentId: req.params.studentId, unit: req.body.unit },
    { feedback: req.body.feedback }
  );
  res.sendStatus(204);
});

// Admin Aggregations
app.get('/api/admin/students', async (req, res) => {
  const profiles = await StudentProfile.find();
  const atts     = await Attendance.find();
  const docs     = await CourseDoc.find();
  const asns     = await Assignment.find();
  const out = profiles.map(p => ({
    studentId: p.studentId,
    candidateName: p.candidateName,
    email: p.email,
    mobile: p.mobile,
    attendance:  atts.filter(a => a.studentId === p.studentId),
    docs:        docs.filter(d => d.courseId === 'COURSE1'),
    assignments: asns.filter(a => a.studentId === p.studentId)
  }));
  res.json(out);
});

// ── NEW: Admin endpoints for the frontend ──────────────────────────────
// List all assignments (for ManageAssignments)
app.get('/api/admin/assignments', async (req, res) => {
  const all = await Assignment.find();
  res.json(all);
});

// List only assignment results (for AssignmentResults)
app.get('/api/admin/assignments/results', async (req, res) => {
  const results = await Assignment.find({ 'results.score': { $exists: true } });
  res.json(results);
});

// List all feedback records (for ReviewFeedback)
app.get('/api/admin/feedback', async (req, res) => {
  const fb = await Assignment.find({ feedback: { $exists: true, $ne: null } })
    .select('studentId feedback')
    .lean();
  res.json(fb);
});

// Admin: Upload Course Docs
app.post(
  '/api/admin/course-docs/upload',
  uploadCourseDoc.fields([
    { name:'syllabus', maxCount:1 },
    { name:'schedule', maxCount:1 }
  ]),
  async (req, res) => {
    try {
      const syllabus = req.files.syllabus?.[0]?.path;
      const schedule = req.files.schedule?.[0]?.path;
      await CourseDoc.findOneAndUpdate(
        { courseId:'COURSE1', type:'syllabus' },
        { url: syllabus },
        { upsert: true }
      );
      await CourseDoc.findOneAndUpdate(
        { courseId:'COURSE1', type:'schedule' },
        { url: schedule },
        { upsert: true }
      );
      res.json({ syllabus, schedule });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

// Admin: Manage Assignments / Results / Unlock / Feedback
app.post(
  '/api/admin/students/:id/manageAssignments',
  async (req, res) => {
    try {
      const { unit, studyMaterialUrl, closeDays } = req.body;
      if (!unit || !studyMaterialUrl)
        return res.status(400).json({ error: 'unit and studyMaterialUrl required' });
      const days = parseInt(closeDays, 10);
      if (isNaN(days)) 
        return res.status(400).json({ error: 'closeDays must be a number' });

      await Assignment.findOneAndUpdate(
        { studentId: req.params.id, unit },
        { studyMaterialUrl, closedAt: new Date(Date.now() + days * 86400000) },
        { upsert: true }
      );
      // ensure CORS headers are on every response
      res.set('Access-Control-Allow-Origin', req.get('Origin'));
      res.sendStatus(204);
    } catch (err) {
      console.error(err);
      // still send CORS header on errors
      res
        .status(500)
        .set('Access-Control-Allow-Origin', req.get('Origin'))
        .json({ error: err.message });
    }
  }
);

app.post('/api/admin/students/:id/enterResults', async (req, res) => {
  await Assignment.findOneAndUpdate(
    { studentId: req.params.id, unit: req.body.unit },
    { results: req.body.results }
  );
  res.sendStatus(204);
});
app.post('/api/admin/students/:id/approveUnlock', async (req, res) => {
  await Assignment.findOneAndUpdate(
    { studentId: req.params.id, unit: req.body.unit },
    { unlockedUntil: new Date(Date.now() + 2*86400000) }
  );
  res.sendStatus(204);
});
app.post('/api/admin/students/:id/reviewFeedback', (_req, res) => {
  res.sendStatus(204);
});

// Static PDF endpoints
app.get('/api/student/syllabus', (req, res) =>
  res.sendFile(path.join(__dirname, 'docs/syllabus.pdf'))
);
app.get('/api/student/schedule', (req, res) =>
  res.sendFile(path.join(__dirname, 'docs/schedule.pdf'))
);


const QuestionSchema = new mongoose.Schema({
  question:     String,
  options:      [String],
  correctIndex: Number   // 0-3 for a four-option MCQ
});

const QuizSchema = new mongoose.Schema({
  title:     String,
  questions: [QuestionSchema]
}, { timestamps: true });

app.post('/api/admin/quizzes', async (req, res) => {
  const { id, title, questions } = req.body;
  const quiz = await Quiz.findOneAndUpdate(
    { _id: id },
    { title, questions },
    { upsert: true, new: true }
  );
  res.json(quiz);
});

// — Public: list all quizzes
app.get('/api/quizzes', async (req, res) => {
  const all = await Quiz.find().select('title');
  res.json(all);
});

// — Public: get a single quiz
app.get('/api/quizzes/:quizId', async (req, res) => {
  const quiz = await Quiz.findById(req.params.quizId).lean();
  // strip out correctIndex so the student can’t cheat
  quiz.questions = quiz.questions.map(q => ({
    question: q.question,
    options: q.options
  }));
  res.json(quiz);
});

// — Student: submit answers
app.post('/api/students/:studentId/quizzes/:quizId/submit', async (req, res) => {
  const { answers } = req.body; // e.g. [0,2,1,…]
  const quiz = await Quiz.findById(req.params.quizId).lean();
  let score = 0;
  quiz.questions.forEach((q, i) => {
    if (q.correctIndex === answers[i]) score++;
  });
  const percent = Math.round((score / quiz.questions.length) * 100);

  // Save it
  await StudentQuiz.create({
    studentId: req.params.studentId,
    quizId:    req.params.quizId,
    answers,
    score:     percent
  });

  res.json({ score: percent, total: quiz.questions.length });
});

// ── Start Server ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
