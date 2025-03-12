require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Allowed origins array - include both versions of your domain
const allowedOrigins = [
  'https://tekcrewz.com',
  'https://www.tekcrewz.com',
  'http://localhost:3000'
];

// Use cors with a dynamic origin callback
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Serve static files from the "uploads" directory so the frontend can display/download files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // ensure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Connect to MongoDB Atlas using the URI in your .env file (MONGODB_URI)
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Atlas connected'))
  .catch(err => console.error(err));

// Define the Candidate schema
const candidateSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  candidateName: { type: String, required: true },
  college: { type: String, required: true },
  candidateDegree: { type: String, required: true },
  candidateCourseName: { type: String, required: true },
  programme: { type: String, required: true },
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
  // File fields – store the file paths (as strings)
  candidatePic: { type: String },
  markStatement: { type: String },
  signature: { type: String },
  // Additional fields (admin updates)
  paidAmount: { type: Number, default: 0 },
  courseRegistered: { type: String, default: '' },
  paidDate: { type: Date },
  status: { type: String, default: 'Registered' }
}, { timestamps: true });

const Candidate = mongoose.model('Candidate', candidateSchema);

// POST endpoint to receive candidate data with file uploads
app.post('/api/referrals', 
  // Use multer to handle file uploads; expect candidatePic, markStatement, and signature files
  upload.fields([
    { name: 'candidatePic', maxCount: 1 },
    { name: 'markStatement', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      // If files are uploaded, attach their paths to the request body
      if (req.files['candidatePic'] && req.files['candidatePic'][0]) {
        req.body.candidatePic = req.files['candidatePic'][0].path;
      }
      if (req.files['markStatement'] && req.files['markStatement'][0]) {
        req.body.markStatement = req.files['markStatement'][0].path;
      }
      if (req.files['signature'] && req.files['signature'][0]) {
        req.body.signature = req.files['signature'][0].path;
      }
      // Create and save a new Candidate document using text fields and file paths
      const candidate = new Candidate(req.body);
      await candidate.save();
      res.status(201).json({ message: 'Referral submitted successfully', candidate });
    } catch (error) {
      console.error('Error saving referral:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// GET endpoint to list candidates with optional filters
app.get('/api/candidates', async (req, res) => {
  try {
    const { date, status, sortOrder, userId } = req.query;
    let filter = {};
    if (date) {
      // Expecting date in "YYYY-MM" format; filter by the month of dateOfVisit
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
    
    // Adjust each candidate's markStatement field to return an absolute URL if available.
    const candidatesWithAbsoluteMarksheet = candidates.map(candidate => {
      const candidateObj = candidate.toObject();
      if (candidateObj.markStatement) {
        candidateObj.markStatement = `${req.protocol}://${req.get('host')}/${candidateObj.markStatement}`;
      }
      return candidateObj;
    });
    
    res.json(candidatesWithAbsoluteMarksheet);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT endpoint to update candidate data
app.put('/api/candidates/:id', async (req, res) => {
  try {
    const updatedCandidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedCandidate);
  } catch (error) {
    console.error('Error updating candidate:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE endpoint to remove candidate data
app.delete('/api/candidates/:id', async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Candidate removed successfully' });
  } catch (error) {
    console.error('Error removing candidate:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
