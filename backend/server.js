require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const app = express();

// 1️⃣ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2️⃣ Set up multer-storage-cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Store everything under a "candidates" folder
    const folder = 'candidates';
    // Allow auto-detection of file type (images, PDFs, etc.)
    return {
      folder,
      resource_type: 'auto',
      public_id: `${Date.now()}-${file.originalname}`,
    };
  },
});
const upload = multer({ storage });

// 3️⃣ CORS & Middleware
const allowedOrigins = [
  'https://tekcrewz.com',
  'https://www.tekcrewz.com',
  'http://localhost:3000'
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!allowedOrigins.includes(origin)) {
      return callback(new Error('CORS policy does not allow this origin'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4️⃣ Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// 5️⃣ Candidate Schema & Model
const candidateSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  candidateName: { type: String, required: true },
  college: { type: String, required: true },
  candidateDegree: { type: String, required: true },
  programme: { type: String },
  candidateCourseName: { type: String },
  marksType: { type: String, enum: ['CGPA', 'Percentage'], required: true },
  score: { type: Number, default: 0 },
  scholarshipSecured: { type: String },
  mobile: { type: String, required: true },
  parentMobile: { type: String, required: true },
  email: { type: String, required: true },
  coursesEnquired: { type: String, required: true },
  dateOfVisit: { type: Date, required: true },
  paymentTerm: { type: String, required: true },
  communicationScore: { type: Number, required: true },
  remarks: { type: String },
  candidatePic: { type: String },       // Cloudinary URL
  markStatement: { type: String },     // Cloudinary URL
  signature: { type: String },         // Cloudinary URL or typed text
  paidAmount: { type: Number, default: 0 },
  courseRegistered: { type: String, default: '' },
  paidDate: { type: Date },
  status: { type: String, default: 'Registered' },
  role: { type: String, default: 'student' }
}, { timestamps: true });

const Candidate = mongoose.model('Candidate', candidateSchema);

// 6️⃣ Routes

// Create candidate (with file uploads)
app.post('/api/referrals', upload.fields([
  { name: 'candidatePic', maxCount: 1 },
  { name: 'markStatement', maxCount: 1 },
  { name: 'signature', maxCount: 1 }
]), async (req, res) => {
  try {
    const files = req.files;
    const body = req.body;

    const newCandidate = new Candidate({
      ...body,
      candidatePic: files.candidatePic?.[0].path,
      markStatement: files.markStatement?.[0].path,
      // If signature was uploaded, it's in files.signature; otherwise use typed text
      signature: files.signature?.[0].path || body.signature
    });

    await newCandidate.save();
    res.status(201).json({ message: 'Candidate saved', candidate: newCandidate });
  } catch (error) {
    console.error('Error creating candidate:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// List, update, delete endpoints (unchanged, except now file URLs are in DB)
app.get('/api/candidates', async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ dateOfVisit: -1 });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/candidates/:id', async (req, res) => {
  try {
    const updated = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/candidates/:id', async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Candidate deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 7️⃣ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));