require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();

// 1️⃣ Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// 2️⃣ Allowed origins array - include both versions of your domain & localhost
const allowedOrigins = [
  'https://tekcrewz.com',
  'https://www.tekcrewz.com',
  'http://localhost:3000'
];

// 3️⃣ Use CORS with a dynamic origin callback
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g., mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'CORS policy does not allow access from this origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// 4️⃣ Set Content Security Policy headers to allow fonts and other assets.
// You can adjust these directives as needed.
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "font-src 'self' data: https://fonts.gstatic.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https://tekcrewz.onrender.com; " +
    "script-src 'self' 'unsafe-inline'"
  );
  next();
});

// 5️⃣ Serve static files from "uploads" so the frontend can download/display them
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 6️⃣ Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 7️⃣ Configure Multer storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// 8️⃣ Connect to MongoDB Atlas using the URI in .env (MONGODB_URI)
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Atlas connected'))
  .catch(err => console.error(err));

// 9️⃣ Define the Candidate schema
const candidateSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  candidateName: { type: String, required: true },
  college: { type: String, required: true },
  // These fields are optional here; our pre‑validation enforces the rule.
  candidateDegree: { type: String },
  candidateCourseName: { type: String },
  programme: { type: String },
  marksType: { type: String, enum: ['CGPA', 'Percentage'], required: true },
  score: { type: Number, required: true },
  scholarshipSecured: { type: String },
  mobile: { type: String, required: true },
  parentMobile: { type: String, required: true },
  email: { type: String, required: true },
  coursesEnquired: { type: String, required: true },
  dateOfVisit: { type: Date, required: true },
  paymentTerm: { type: String, required: true },
  communicationScore: { type: Number, required: true },
  remarks: { type: String },
  // File fields – store relative file paths
  candidatePic: { type: String },
  markStatement: { type: String }, // Can be an image or PDF file
  signature: { type: String },
  // Additional fields (admin updates)
  paidAmount: { type: Number, default: 0 },
  courseRegistered: { type: String, default: '' },
  paidDate: { type: Date },
  status: { type: String, default: 'Registered' }
}, { timestamps: true });

// Pre-validation hook: either candidateCourseName is provided, or both candidateDegree and programme
candidateSchema.pre('validate', function(next) {
  if (!this.candidateCourseName && (!this.candidateDegree || !this.programme)) {
    return next(new Error('Either candidateCourseName or both candidateDegree and programme must be provided.'));
  }
  next();
});

const Candidate = mongoose.model('Candidate', candidateSchema);

// 1️⃣0️⃣ POST endpoint to receive candidate data with file uploads
app.post('/api/referrals',
  upload.fields([
    { name: 'candidatePic', maxCount: 1 },
    { name: 'markStatement', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      // Attach file paths if uploaded (store relative paths)
      if (req.files['candidatePic'] && req.files['candidatePic'][0]) {
        req.body.candidatePic = req.files['candidatePic'][0].path;
      }
      if (req.files['markStatement'] && req.files['markStatement'][0]) {
        req.body.markStatement = req.files['markStatement'][0].path;
      }
      if (req.files['signature'] && req.files['signature'][0]) {
        req.body.signature = req.files['signature'][0].path;
      }
      // Create and save a new Candidate document
      const candidate = new Candidate(req.body);
      await candidate.save();
      res.status(201).json({ message: 'Referral submitted successfully', candidate });
    } catch (error) {
      console.error('Error saving referral:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 1️⃣1️⃣ GET endpoint to list candidates with optional filters
app.get('/api/candidates', async (req, res) => {
  try {
    const { date, status, sortOrder, userId } = req.query;
    let filter = {};

    // Filter by date (expects "YYYY-MM")
    if (date) {
      const [year, month] = date.split('-');
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      filter.dateOfVisit = { $gte: start, $lte: end };
    }
    if (status) {
      filter.status = status;
    }
    if (userId) {
      filter.userId = userId;
    }
    const sortValue = sortOrder === 'asc' ? 1 : -1;
    const candidates = await Candidate.find(filter).sort({ dateOfVisit: sortValue });
    // Return candidates with relative file paths
    res.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 1️⃣2️⃣ PUT endpoint to update candidate data
app.put('/api/candidates/:id', async (req, res) => {
  try {
    const updatedCandidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedCandidate);
  } catch (error) {
    console.error('Error updating candidate:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 1️⃣3️⃣ DELETE endpoint to remove a candidate
app.delete('/api/candidates/:id', async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Candidate removed successfully' });
  } catch (error) {
    console.error('Error removing candidate:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 1️⃣4️⃣ Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
