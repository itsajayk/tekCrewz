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
  'https://tekcrewz.onrender.com',
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
  params: { 
    folder: 'course_docs', 
    resource_type: 'raw', 
    format: 'pdf',
    public_id: (req, file) => {
      return file.originalname.replace(/\.pdf$/i, '');
    }}
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
  trainingMode: {             // new
    type: String,
    enum: ['Online', 'On-campus@ Thanjavur'],
    required: true
  },
  candidatePic:       String,
  markStatement:      String,
  signature:          String,
  paidAmount:         Number,
  courseRegistered:   { type: [String], default: [] }, // CHANGED: was String → now array of course names
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
  unlockRequested:  {
    type: Boolean,
    default: false
  },
  wasExtended:      {
    type: Boolean,
    default: false
  },
  submissionCode:   String,
  submissionFileUrl: String,       // <-- add this
  results: {
    score: Number,
    passed: Boolean
  },
  feedback:         String
}, { timestamps: true });
const Assignment = mongoose.model('Assignment', assignmentSchema);

// at top, instead of your existing assignmentStorage:
const assignmentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'assignment_materials',
    resource_type: 'raw',
    format: 'pdf',                    // <— force .pdf in URL
    public_id: (req, file) => {
      // strip “.pdf” from original before using as public_id
      return file.originalname.replace(/\.pdf$/i, '');
    }
  }
});

const uploadAssignment = multer({
  storage: assignmentStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed.'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ── NEW: Student file uploads (Cloudinary) ─────────────────────────────
const studentFileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'student_uploads',
    resource_type: 'raw',       // allow any file type (e.g., .zip, .pdf, .jpg)
    public_id: (req, file) => {
      // store under: studentId/unit/fileName (no extension stripping)
      const studentId = req.params.studentId;
      const unit = req.body.unit || 'unknown_unit';
      // sanitize original filename:
      const safeName = file.originalname.replace(/\.[^/.]+$/, "");
      return `${studentId}/${unit}/${safeName}`;
    }
  }
});

const uploadStudentFile = multer({
  storage: studentFileStorage,
  limits: { fileSize: 20 * 1024 * 1024 } // allow up to 20 MB for student files
});

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

      // ── ENSURE courseRegistered IS AN ARRAY ────────────────────────────────────
      let courses = [];
      if (Array.isArray(req.body.courseRegistered)) {
        courses = req.body.courseRegistered;
      } else if (typeof req.body.courseRegistered === 'string' && req.body.courseRegistered.trim()) {
        courses = [req.body.courseRegistered];
      }
      // ── ───────────────────────────────────────────────────────────────────────

      const newCandidate = new Candidate({
        ...req.body,
        courseRegistered: courses,        // CHANGED: store array
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
    // ── ENSURE courseRegistered IS AN ARRAY ────────────────────────────────────
    let bodyUpdate = { ...req.body };
    if (req.body.courseRegistered) {
      if (Array.isArray(req.body.courseRegistered)) {
        bodyUpdate.courseRegistered = req.body.courseRegistered;
      } else if (typeof req.body.courseRegistered === 'string' && req.body.courseRegistered.trim()) {
        bodyUpdate.courseRegistered = [req.body.courseRegistered];
      }
    }
    // ── ───────────────────────────────────────────────────────────────────────

    const updated = await Candidate.findByIdAndUpdate(
      req.params.id,
      bodyUpdate,                     // CHANGED: pass array
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
  try {
    const assignments = await Assignment.find({ studentId: req.params.studentId }).lean();
    const now = new Date();
    const result = assignments.map(a => {
      const closedByTime = a.closedAt && now > new Date(a.closedAt);
      const isUnlocked = a.unlockedUntil && now < new Date(a.unlockedUntil);
      const open = (!closedByTime) || isUnlocked;
      return {
        ...a,
        closed: !open,                      // true if fully closed
        unlocked: Boolean(isUnlocked),      // true if in extension window
        unlockRequested: Boolean(a.unlockRequested),
        wasExtended: Boolean(a.wasExtended),
      };
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/assignments/:studentId/submit', async (req, res) => {
  await Assignment.findOneAndUpdate(
    { studentId: req.params.studentId, unit: req.body.unit },
    { submissionCode: req.body.code }
  );
  res.sendStatus(204);
});
app.post('/api/assignments/:studentId/unlock', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { unit } = req.body;
    const assignment = await Assignment.findOne({ studentId, unit });
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const now = new Date();
    const closedByTime = assignment.closedAt && now > assignment.closedAt;
    const isUnlocked = assignment.unlockedUntil && now < assignment.unlockedUntil;
    if (!closedByTime && !isUnlocked) {
      return res.status(400).json({ error: 'Cannot request unlock: assignment still open' });
    }
    if (assignment.unlockRequested) {
      return res.status(400).json({ error: 'Unlock already requested' });
    }
    if (assignment.wasExtended) {
      return res.status(400).json({ error: 'No further extensions allowed' });
    }
    assignment.unlockRequested = true;
    await assignment.save();
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
app.post('/api/assignments/:studentId/feedback', async (req, res) => {
  await Assignment.findOneAndUpdate(
    { studentId: req.params.studentId, unit: req.body.unit },
    { feedback: req.body.feedback }
  );
  res.sendStatus(204);
});

// ── NEW: Upload student‐submitted file ─────────────────────────────────
// Existing multer setup for student files:
app.post(
  '/api/assignments/:studentId/submit-combined',
  uploadStudentFile.single('file'),
  async (req, res) => {
    try {
      const studentId = req.params.studentId;
      const unit = req.body.unit;
      const code = req.body.code;           // may be undefined or empty
      let update = {};
      if (typeof code === 'string' && code.trim() !== '') {
        update.submissionCode = code;
      }
      if (req.file && req.file.path) {
        update.submissionFileUrl = req.file.path;
      }
      if (Object.keys(update).length === 0) {
        return res.status(400).json({ error: 'No code or file provided' });
      }
      // Update assignment in one go
      const assignment = await Assignment.findOneAndUpdate(
        { studentId, unit },
        update,
        { new: true }
      );
      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      res.json({ message: 'Submission saved', assignment });
    } catch (err) {
      console.error('Unified submission error:', err);
      res.status(500).json({ error: err.message });
    }
  }
);


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

app.get(
  '/api/admin/course-docs/upload/:courseId',          // 🔧 CHANGED: new GET route
  async (req, res) => {
    try {
      const courseId = req.params.courseId;            // retrieve the courseId from the URL
      // Fetch all CourseDoc entries matching that courseId
      const docs = await CourseDoc.find({ courseId });

      // Build response object matching AdminPanel's state-shape expectations
      const result = {};
      docs.forEach(doc => {
        // doc.type is either 'syllabus' or 'schedule'
        result[doc.type] = doc.url;                    // e.g. { syllabus: 'https://…' }
        // derive an “original filename” from the URL path’s last segment:
        const segments = doc.url.split('/');
        const filename = segments[segments.length - 1] || '';
        result[`${doc.type}OriginalName`] = filename;  // e.g. { syllabusOriginalName: 'syllabus.pdf' }
      });

      return res.json(result);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// Admin: Upload Course Docs
app.post(
  '/api/admin/course-docs/upload/:courseId',
  uploadCourseDoc.fields([
    { name: 'syllabus', maxCount: 1 },
    { name: 'schedule', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const courseId = req.params.courseId;
      const syllabusFile = req.files.syllabus?.[0];
      const scheduleFile = req.files.schedule?.[0];

      const syllabusPath = syllabusFile?.path;
      const schedulePath = scheduleFile?.path;

      // upsert syllabus
      if (syllabusPath) {
        await CourseDoc.findOneAndUpdate(
          { courseId, type: 'syllabus' },
          { url: syllabusPath },
          { upsert: true }
        );
      }

      // upsert schedule
      if (schedulePath) {
        await CourseDoc.findOneAndUpdate(
          { courseId, type: 'schedule' },
          { url: schedulePath },
          { upsert: true }
        );
      }

      // return both path and original filenames (matching the GET shape above)
      return res.json({
        syllabus: syllabusPath,                         // 🔧 CHANGED: returned keys match AdminPanel’s expectations
        schedule: schedulePath
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// Admin: Manage Assignments / Results / Unlock / Feedback
app.post('/api/admin/students/:id/manageAssignments', uploadAssignment.single('studyMaterial'), async (req, res) => {
  try {
    const { unit } = req.body;
    if (!unit) return res.status(400).json({ error: 'unit is required' });

    const now = Date.now();
    const materialUrl = req.file ? req.file.path : req.body.studyMaterialUrl;

    await Assignment.findOneAndUpdate(
      { studentId: req.params.id, unit },
      {
        studyMaterialUrl: materialUrl,
        createdAt:       new Date(now),
        closedAt:        new Date(now + 3 * 86400000),
        unlockedUntil:   null,
        unlockRequested: false,
        wasExtended:     false
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.set('Access-Control-Allow-Origin', req.get('Origin'));
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/students/:studentId/enterResults', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { unit, results } = req.body; // results: { score: Number, passed: Boolean }
    const assignment = await Assignment.findOneAndUpdate(
      { studentId, unit },
      { results },
      { new: true }
    );
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    res.json({ message: 'Result entered', assignment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/admin/students/:id/approveUnlock', async (req, res) => {
  try {
    const studentId = req.params.id;
    const { unit } = req.body;
    const assignment = await Assignment.findOne({ studentId, unit });
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    if (!assignment.unlockRequested) {
      return res.status(400).json({ error: 'No unlock request pending' });
    }
    if (assignment.wasExtended) {
      return res.status(400).json({ error: 'Assignment already extended once' });
    }
    const now = Date.now();
    assignment.unlockedUntil = new Date(now + 2 * 86400000);
    assignment.unlockRequested = false;
    assignment.wasExtended = true;
    await assignment.save();
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
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

// ── Quiz Schemas & Models (moved before using them) ─────────────────────────────────────────

// 1) Define the Question sub‐schema
const QuestionSchema = new mongoose.Schema({
  question:     String,
  options:      [String],
  correctIndex: Number   // 0–3 for a four‐option MCQ
});

// 2) Define the main QuizSchema
const quizSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Types.ObjectId, required: true },
  unit: String,
  title: String,
  questions: [
    { question: String, options: [String], correctIndex: Number }
  ]
}, { timestamps: true });

const Quiz = mongoose.model('Quiz', quizSchema);

// 4) Define and register the StudentQuiz model
const StudentQuizSchema = new mongoose.Schema({
  studentId: String,
  quizId:    mongoose.Schema.Types.ObjectId,
  answers:   [Number],
  score:     Number
}, { timestamps: true });
const StudentQuiz = mongoose.model('StudentQuiz', StudentQuizSchema);

// ── Quiz Routes ───────────────────────────────────────────────────────────

// Admin: Create or update a quiz
app.post('/api/admin/quizzes', async (req, res) => {
  try {
    const { assignmentId, unit, title, questions } = req.body;
    const quiz = await Quiz.findOneAndUpdate(
      { assignmentId },
      { assignmentId, unit, title, questions },
      { upsert: true, new: true }
    );
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/quizzes/:assignmentId', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ assignmentId: req.params.assignmentId });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/quizzes/:quizId/submit', async (req, res) => {
  try {
    const { studentId, assignmentId, answers } = req.body;
    const quiz = await Quiz.findById(req.params.quizId);
    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) score++;
    });

    // Save into Assignment.results
    await Assignment.findOneAndUpdate(
      { _id: assignmentId, studentId },
      { $set: { 'result.quizScore': score, 'result.passed': score >= quiz.questions.length * 0.7 } }
    );

    res.json({ score, passed: score >= quiz.questions.length * 0.7 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: list all quizzes
app.get('/api/quizzes', async (req, res) => {
  const all = await Quiz.find().select('title');
  res.json(all);
});

// Public: get a single quiz (strip out correctIndex for students)
app.get('/api/quizzes/:quizId', async (req, res) => {
  const quiz = await Quiz.findById(req.params.quizId).lean();
  quiz.questions = quiz.questions.map(q => ({
    question: q.question,
    options:  q.options
  }));
  res.json(quiz);
});

// Student: submit quiz answers
app.post('/api/students/:studentId/quizzes/:quizId/submit', async (req, res) => {
  const { answers } = req.body;
  const quiz = await Quiz.findById(req.params.quizId).lean();
  let score = 0;
  quiz.questions.forEach((q, i) => {
    if (q.correctIndex === answers[i]) score++;
  });
  const percent = Math.round((score / quiz.questions.length) * 100);

  // Save the student's result
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
