require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({ origin: 'https://www.tekcrewz.com', credentials: true }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Atlas connected'))
  .catch(err => console.error(err));

const candidateSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  candidateName: { type: String, required: true },
  college: { type: String, required: true },
  candidateDegree: { type: String, required: true },
  candidateCourseName: { type: String, required: true },
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
  // Additional fields (admin updates)
  paidAmount: { type: Number, default: 0 },
  courseRegistered: { type: String, default: '' },
  paidDate: { type: Date },
  status: { type: String, default: 'Registered' }
}, { timestamps: true });

const Candidate = mongoose.model('Candidate', candidateSchema);

//  receive referral data
app.post('/api/referrals', async (req, res) => {
  try {
    const candidate = new Candidate(req.body);
    await candidate.save();
    res.status(201).json({ message: 'Referral submitted successfully', candidate });
  } catch (error) {
    console.error('Error saving referral:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET list candidates 
app.get('/api/candidates', async (req, res) => {
  try {
    const { date, status, sortOrder, userId } = req.query;
    let filter = {};
    if (date) {
      // Extract year and month from the "YYYY-MM" string
      const [year, month] = date.split('-');
      // First day of the month
      const start = new Date(year, month - 1, 1);
      // Last day of the month
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
    res.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT to update candidate data
app.put('/api/candidates/:id', async (req, res) => {
  try {
    const updatedCandidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedCandidate);
  } catch (error) {
    console.error('Error updating candidate:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE to remove candidate data
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
