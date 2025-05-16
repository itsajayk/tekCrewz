require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const mongoose   = require('mongoose');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer     = require('multer');

const app = express();

// ── CORS ───────────────────────────────────────────────────────────────
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

// ── MongoDB ────────────────────────────────────────────────────────────
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
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'candidates',
    resource_type: 'auto',
    public_id: (req, file) => {
      const base = file.originalname
        .replace(/\.[^/.]+$/, '')
        .replace(/[^\w\-]+/g, '-');
      return `${Date.now()}-${base}`;
    }
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (/^image\/|application\/pdf$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image or PDF files allowed.'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ── Schema ─────────────────────────────────────────────────────────────
const candidateSchema = new mongoose.Schema({
  referrerId:         { type: String, required: true },
  studentId:          { type: String, required: true },
  candidateName:      { type: String, required: true },
  college:            { type: String, required: true },
  candidateDegree:    { type: String, required: true },
  programme:          { type: String },
  candidateCourseName:{ type: String },
  marksType:          { type: String, enum: ['CGPA','Percentage'], required: true },
  score:              { type: Number, default: 0 },
  scholarshipSecured: { type: String },
  mobile:             { type: String, required: true },
  parentMobile:       { type: String, required: true },
  email:              { type: String, required: true },
  coursesEnquired:    { type: String, required: true },
  dateOfVisit:        { type: Date, required: true },
  paymentTerm:        { type: String, required: true },
  communicationScore: { type: Number, required: true },
  candidatePic:       { type: String },
  markStatement:      { type: String },
  signature:          { type: String },
  paidAmount:         { type: Number, default: 0 },
  courseRegistered:   { type: String, default: '' },
  paidDate:           { type: Date },
  status:             { type: String, default: 'Registered' },
  role:               { type: String, default: 'student' }
}, { timestamps: true });

const Candidate = mongoose.model('Candidate', candidateSchema);

// ── POST: Add Candidate
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
        signature:     req.files.signature?.[0]?.path || undefined
      });
      await newCandidate.save();
      res.status(201).json({
        message: 'Candidate saved',
        candidate: newCandidate
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ── GET: All Candidates (filter by date, status, referrerId) :contentReference[oaicite:8]{index=8}:contentReference[oaicite:9]{index=9}
app.get('/api/candidates', async (req, res) => {
  try {
    const { date, status, referrerId, sortOrder } = req.query;
    const filter = {};
    if (date) {
      const [y, m] = date.split('-').map(Number);
      filter.dateOfVisit = {
        $gte: new Date(y, m-1, 1),
        $lte: new Date(y, m, 0, 23,59,59,999)
      };
    }
    if (status)      filter.status     = status;
    if (referrerId)  filter.referrerId = referrerId;
    const dir = sortOrder === 'asc' ? 1 : -1;
    const list = await Candidate.find(filter).sort({ dateOfVisit: dir });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT: Update Candidate by ID :contentReference[oaicite:10]{index=10}:contentReference[oaicite:11]{index=11}
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
    // built-in fetch
    const response = await fetch(
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
    const data = await response.json();
    if (!response.ok) {
      console.error('Gemini error', data);
      return res.status(500).json({ error: 'Gemini API error' });
    }
    const text = data.candidates?.[0]?.output || '';
    res.json({ text });
  } catch (err) {
    console.error('AI insights error:', err);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// ── DELETE: Remove Candidate ───────────────────────────────────────────
app.delete('/api/candidates/:id', async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Candidate deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── New Student Dashboard Routes ────────────────────────────────────────

// ── Student Dashboard Routes (existing) ────────────────────────────
// 1. Profile
app.get('/api/students/:studentId/profile', async (req,res)=>{
  res.json(await StudentProfile.findOne({ studentId:req.params.studentId }))
})
// 2. Attendance
app.get('/api/students/:studentId/attendance', async (req,res)=>{
  res.json(await Attendance.find({ studentId:req.params.studentId }).sort('date'))
})
// 3. Course Docs
app.get('/api/courses/:courseId/docs', async (req,res)=>{
  const docs = await CourseDoc.find({ courseId:req.params.courseId })
  const out  = {}
  docs.forEach(d=>out[d.type]=d.url)
  res.json(out)
})
// 4. List Assignments
app.get('/api/assignments/:studentId', async (req,res)=>{
  const all = await Assignment.find({ studentId:req.params.studentId })
  const now = new Date()
  res.json(all.map(a=>({
    unit:a.unit,
    studyMaterialUrl:a.studyMaterialUrl,
    closed: a.closedAt && now>a.closedAt,
    unlocked: a.unlockedUntil && now<a.unlockedUntil,
    submissionCode:a.submissionCode,
    results:a.results,
    feedback:a.feedback
  })))
})
// 5. Submit Code
app.post('/api/assignments/:studentId/submit', async (req,res)=>{
  await Assignment.findOneAndUpdate(
    { studentId:req.params.studentId, unit:req.body.unit },
    { submissionCode:req.body.code }
  )
  res.sendStatus(204)
})
// 6. Request Unlock
app.post('/api/assignments/:studentId/unlock', async (req,res)=>{
  await Assignment.findOneAndUpdate(
    { studentId:req.params.studentId, unit:req.body.unit },
    { unlockedUntil: new Date(Date.now()+2*86400000) }
  )
  res.sendStatus(204)
})
// 7. Submit Feedback
app.post('/api/assignments/:studentId/feedback', async (req,res)=>{
  await Assignment.findOneAndUpdate(
    { studentId:req.params.studentId, unit:req.body.unit },
    { feedback:req.body.feedback }
  )
  res.sendStatus(204)
})

// ── Admin Routes: aggregate & CRUD ──────────────────────────────────
// Get everything joined
app.get('/api/admin/students', async (req,res)=>{
  const profiles = await StudentProfile.find()
  const atts     = await Attendance.find()
  const docs     = await CourseDoc.find()
  const asns     = await Assignment.find()
  // map each profile to include sub-docs
  const out = profiles.map(p=>({
    ...p.toObject(),
    attendance: atts.filter(a=>a.studentId===p.studentId),
    docs: docs.filter(d=>d.courseId==='COURSE1'),
    assignments: asns.filter(a=>a.studentId===p.studentId)
  }))
  res.json(out)
})
// Upload syllabus & schedule
app.post('/api/admin/students/:id/uploadDocs', async (req,res)=>{
  const { syllabus, schedule } = req.body
  await CourseDoc.findOneAndUpdate(
    { courseId:'COURSE1', type:'syllabus' }, { url:syllabus }, { upsert:true }
  )
  await CourseDoc.findOneAndUpdate(
    { courseId:'COURSE1', type:'schedule' }, { url:schedule }, { upsert:true }
  )
  res.sendStatus(204)
})
// Manage assignment creation/closing
app.post('/api/admin/students/:id/manageAssignments', async (req,res)=>{
  const { unit, studyMaterialUrl, closeDays } = req.body
  await Assignment.findOneAndUpdate(
    { studentId:req.params.id, unit },
    {
      studyMaterialUrl,
      closedAt: new Date(Date.now()+closeDays*86400000)
    },
    { upsert:true }
  )
  res.sendStatus(204)
})
// Enter results
app.post('/api/admin/students/:id/enterResults', async (req,res)=>{
  await Assignment.findOneAndUpdate(
    { studentId:req.params.id, unit:req.body.unit },
    { results:req.body.results }
  )
  res.sendStatus(204)
})
// Approve unlock
app.post('/api/admin/students/:id/approveUnlock', async (req,res)=>{
  await Assignment.findOneAndUpdate(
    { studentId:req.params.id, unit:req.body.unit },
    { unlockedUntil: new Date(Date.now()+2*86400000) }
  )
  res.sendStatus(204)
})
// Review feedback (no changes)
app.post('/api/admin/students/:id/reviewFeedback', async (_req,res)=>{
  res.sendStatus(204)
})

// ── Start Server ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
