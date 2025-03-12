require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');  // ✅ Import cors package

const app = express();

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Allowed origins array
const allowedOrigins = ['https://www.tekcrewz.com', 'http://localhost:3000'];

// ✅ Use CORS Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// ✅ Serve static files (for images, marksheets, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Configure multer storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Atlas connected'))
  .catch(err => console.error(err));

// ✅ Define the Candidate schema
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
  candidatePic: { type: String },
  markStatement: { type: String },
  signature: { type: String },
  paidAmount: { type: Number, default: 0 },
  courseRegistered: { type: String, default: '' },
  paidDate: { type: Date },
  status: { type: String, default: 'Registered' }
}, { timestamps: true });

const Candidate = mongoose.model('Candidate', candidateSchema);

// ✅ POST: Add a new candidate with file uploads
app.post('/api/referrals', 
  upload.fields([
    { name: 'candidatePic', maxCount: 1 },
    { name: 'markStatement', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      // Attach file paths if uploaded
      if (req.files['candidatePic']) {
        req.body.candidatePic = req.files['candidatePic'][0].path;
      }
      if (req.files['markStatement']) {
        req.body.markStatement = req.files['markStatement'][0].path;
      }
      if (req.files['signature']) {
        req.body.signature = req.files['signature'][0].path;
      }
      
      // Save to database
      const candidate = new Candidate(req.body);
      await candidate.save();
      res.status(201).json({ message: 'Candidate added successfully', candidate });
    } catch (error) {
      console.error('Error adding candidate:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ✅ GET: Fetch candidates with optional filters
app.get('/api/candidates', async (req, res) => {
  try {
    const { date, status, sortOrder, userId } = req.query;
    let filter = {};

    if (date) {
      const [year, month] = date.split('-');
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      filter.dateOfVisit = { $gte: start, $lte: end };
    }
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const sortValue = sortOrder === 'asc' ? 1 : -1;
    let candidates = await Candidate.find(filter).sort({ dateOfVisit: sortValue });

    // ✅ Convert markStatement paths to absolute URLs
    candidates = candidates.map(candidate => {
      const candidateObj = candidate.toObject();
      if (candidateObj.markStatement) {
        candidateObj.markStatement = `${req.protocol}://${req.get('host')}/${candidateObj.markStatement}`;
      }
      return candidateObj;
    });

    res.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ PUT: Update candidate details
app.put('/api/candidates/:id', async (req, res) => {
  try {
    const updatedCandidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedCandidate);
  } catch (error) {
    console.error('Error updating candidate:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ DELETE: Remove a candidate
app.delete('/api/candidates/:id', async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Candidate removed successfully' });
  } catch (error) {
    console.error('Error removing candidate:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
