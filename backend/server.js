// 1️⃣ Load env vars before anything else
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const app = express();

// 2️⃣ Configure Cloudinary
cloudinary.config({
  cloud_name:   process.env.CLOUDINARY_CLOUD_NAME,
  api_key:      process.env.CLOUDINARY_API_KEY,
  api_secret:   process.env.CLOUDINARY_API_SECRET,
});

// 3️⃣ Configure Multer + CloudinaryStorage with synchronous params
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'candidates',
    resource_type: 'auto',
    public_id: (req, file) =>
      `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`
  }
});
const upload = multer({ storage });

// 4️⃣ CORS & body parsing
const allowedOrigins = [
  'https://tekcrewz.com',
  'https://www.tekcrewz.com',
  'http://localhost:3000'
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (!allowedOrigins.includes(origin)) {
      return cb(new Error('CORS policy does not allow this origin'), false);
    }
    return cb(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5️⃣ MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// 6️⃣ Candidate schema & model
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

// 7️⃣ Routes

// Create candidate (with file uploads + Multer error handling)
app.post(
  '/api/referrals',
  (req, res, next) => {
    upload.fields([
      { name: 'candidatePic',  maxCount: 1 },
      { name: 'markStatement', maxCount: 1 },
      { name: 'signature',     maxCount: 1 }
    ])(req, res, err => {
      if (err) {
        console.error('Multer/Cloudinary error:', err);
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      console.log('Request Body:', req.body);
      console.log('Request Files:', req.files);

      // Convert numeric fields
      const { body, files = {} } = req;
      ['score', 'communicationScore', 'paidAmount'].forEach(key => {
        if (body[key] != null) body[key] = Number(body[key]);
      });

      const newCandidate = new Candidate({
        ...body,
        candidatePic:  files.candidatePic?.[0]?.path,
        markStatement: files.markStatement?.[0]?.path,
        signature:     files.signature?.[0]?.path || body.signature
      });

      await newCandidate.save();
      res.status(201).json({
        message: 'Candidate saved',
        candidate: newCandidate
      });
    } catch (error) {
      console.error('Error creating candidate:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// List candidates
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
    console.error('Error fetching candidates:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update candidate
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

// Delete candidate
app.delete('/api/candidates/:id', async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Candidate deleted' });
  } catch (err) {
    console.error('Error deleting candidate:', err);
    res.status(500).json({ error: err.message });
  }
});

// 8️⃣ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
