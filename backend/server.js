require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const mongoose   = require('mongoose');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer     = require('multer');

const app = express();

// ── 0) CORS ────────────────────────────────────────────────────────────────
// Apply to ALL requests, including errors and preflights
const allowedOrigins = [
  'http://localhost:3000',
  'https://tekcrewz.com',
  'https://www.tekcrewz.com'
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true
}));

// ── 1) Body parsers ─────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── 2) MongoDB ──────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ── 3) Cloudinary ───────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name:   process.env.CLOUDINARY_CLOUD_NAME,
  api_key:      process.env.CLOUDINARY_API_KEY,
  api_secret:   process.env.CLOUDINARY_API_SECRET,
});
if (!process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET) {
  console.error('⚠️ Missing Cloudinary environment variables!');
}

// ── 4) Multer + CloudinaryStorage ───────────────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // PDFs → raw, everything else → image
    const isPdf = file.mimetype === 'application/pdf';
    const resource_type = isPdf ? 'raw' : 'image';

    // Sanitize public_id
    const baseName = file.originalname
      .replace(/\.[^/.]+$/, '')
      .replace(/[^\w\-]+/g, '-');
    const public_id = `${Date.now()}-${baseName}`;

    console.log(`📤 Uploading ${file.originalname} as ${resource_type}, public_id=${public_id}`);
    return { folder: 'candidates', resource_type, public_id };
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // allow images & PDFs only
    if (/^image\/|application\/pdf/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported file type: ' + file.mimetype));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// ── 5) Candidate schema & model ─────────────────────────────────────────────
const candidateSchema = new mongoose.Schema({
  userId:             { type: String, required: true },
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
  dateOfVisit:        { type: Date,   required: true },
  paymentTerm:        { type: String, required: true },
  communicationScore: { type: Number, required: true },
  remarks:            { type: String },
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

// ── 6) POST /api/candidates ─────────────────────────────────────────────────
app.post(
  '/api/candidates',
  (req, res, next) => {
    upload.fields([
      { name: 'candidatePic',  maxCount: 1 },
      { name: 'markStatement', maxCount: 1 },
      { name: 'signature',     maxCount: 1 }
    ])(req, res, err => {
      if (err) {
        console.error('🛑 Upload error:', err);
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      // Cast numeric fields
      ['score','communicationScore','paidAmount'].forEach(key => {
        if (req.body[key] != null) req.body[key] = Number(req.body[key]);
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
      console.error('Error creating candidate:', err);
      res.status(500).json({ error: err.message });
    }
  }
);


// 8) GET /api/candidates
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
    if (status)   filter.status = status;
    if (userId)   filter.userId = userId;

    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const candidates = await Candidate.find(filter).sort({ dateOfVisit: sortDir });
    res.json(candidates);
  } catch (err) {
    console.error('Error fetching candidates:', err);
    res.status(500).json({ error: err.message });
  }
});

// 9) PUT /api/candidates/:id
app.put('/api/candidates/:id', async (req, res) => {
  try {
    const updated = await Candidate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json(updated);
  } catch (err) {
    console.error('Error updating candidate:', err);
    res.status(500).json({ error: err.message });
  }
});

// 10) DELETE /api/candidates/:id
app.delete('/api/candidates/:id', async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Candidate deleted' });
  } catch (err) {
    console.error('Error deleting candidate:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));