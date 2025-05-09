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
  userId:             { type: String, required: true },
  candidateName:      { type: String, required: true },
  college:            { type: String, required: true },
  candidateDegree:    { type: String, required: true },
  programme:          { type: String },
  candidateCourseName:{ type: String },
  marksType:          { type: String, enum: ['CGPA', 'Percentage'], required: true },
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
  signature:          { type: String }, // optional
  paidAmount:         { type: Number, default: 0 },
  courseRegistered:   { type: String, default: '' },
  paidDate:           { type: Date },
  status:             { type: String, default: 'Registered' },
  role:               { type: String, default: 'student' }
}, { timestamps: true });

const Candidate = mongoose.model('Candidate', candidateSchema);

// ── POST: Add Candidate ────────────────────────────────────────────────
app.post(
  '/api/candidates',
  (req, res, next) => {
    upload.fields([
      { name: 'candidatePic',  maxCount: 1 },
      { name: 'markStatement', maxCount: 1 },
      { name: 'signature',     maxCount: 1 }
    ])(req, res, err => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      ['score','communicationScore','paidAmount'].forEach(key => {
        if (req.body[key] != null) req.body[key] = Number(req.body[key]);
      });

      const newCandidate = new Candidate({
        ...req.body,
        candidatePic:  req.files.candidatePic?.[0]?.path,
        markStatement: req.files.markStatement?.[0]?.path,
        signature:     req.files.signature?.[0]?.path || undefined
      });

      await newCandidate.save();
      res.status(201).json({ message: 'Candidate saved', candidate: newCandidate });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ── GET: All Candidates ────────────────────────────────────────────────
app.get('/api/candidates', async (req, res) => {
  try {
    const { date, status, sortOrder, userId } = req.query;
    const filter = {};
    if (date) {
      const [year, month] = date.split('-').map(Number);
      filter.dateOfVisit = {
        $gte: new Date(year, month - 1, 1),
        $lte: new Date(year, month, 0, 23,59,59,999)
      };
    }
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const candidates = await Candidate.find(filter).sort({ dateOfVisit: sortDir });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT: Update Candidate ──────────────────────────────────────────────
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

// ── Start Server ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
