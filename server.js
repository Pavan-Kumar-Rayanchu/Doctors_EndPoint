const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // Install: npm install jsonwebtoken
const dotenv = require('dotenv');    // Install: npm install dotenv

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const ADMIN_PHONE = process.env.ADMIN_PHONE || "7416974772";
const JWT_SECRET = process.env.JWT_SECRET || "your-secure-secret-key-change-this";

// Simple in-memory OTP store (Use Redis for production)
let otpStore = {
  code: null,
  expiresAt: null
};

// --- DATABASE ---
mongoose.connect('mongodb://127.0.0.1:27017/doctorDB')
  .then(() => console.log('>>> MongoDB Connected! <<<'))
  .catch(err => console.error("MongoDB Error:", err));

const doctorSchema = new mongoose.Schema({
  DoctorID: { type: String, unique: true, required: true }, // Fixed: require -> required: true
  Name: { type: String, required: true },
  Experience: String,
  Address: { City: String },
  geo: { coordinates: [Number] }
}, { strict: false });

const Doctor = mongoose.model('Doctor', doctorSchema);

// --- MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) return res.status(401).json({ message: "Access Denied: No Token" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid Token" });
    req.user = user;
    next();
  });
};

// --- AUTH ROUTES ---

// STEP 1: Send Phone Number -> Generate OTP
app.post('/api/auth/step1', (req, res) => {
  const { phoneNumber } = req.body;
  
  if (phoneNumber === ADMIN_PHONE) {
    const otp = Math.floor(100000 + Math.random() * 900000);
    
    // Store OTP with 5-minute expiration
    otpStore = {
      code: otp.toString(),
      expiresAt: Date.now() + 5 * 60 * 1000
    };
    
    // Simulating SMS Service
    console.log("--------------------------------");
    console.log("📲 SMS SENT TO: " + phoneNumber);
    console.log("🔐 YOUR OTP CODE IS: " + otpStore.code); 
    console.log("--------------------------------");
    
    res.json({ success: true, message: "OTP sent to phone" });
  } else {
    res.status(401).json({ success: false, message: "Phone number not authorized" });
  }
});

// STEP 2: Verify OTP -> Get JWT Token
app.post('/api/auth/step2', (req, res) => {
  const { otp } = req.body;

  if (otpStore.code && otp === otpStore.code) {
    // Check Expiration
    if (Date.now() > otpStore.expiresAt) {
      otpStore = { code: null, expiresAt: null };
      return res.status(400).json({ success: false, message: "OTP Expired" });
    }

    otpStore = { code: null, expiresAt: null }; // Clear used OTP
    
    // Generate JWT
    const token = jwt.sign({ role: 'admin', phone: ADMIN_PHONE }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token }); 
  } else {
    res.status(401).json({ success: false, message: "Invalid OTP" });
  }
});

// --- DOCTOR ROUTES ---

app.get('/api/doctors', async (req, res) => {
  try {
    const docs = await Doctor.find();
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/doctors/search/:key', async (req, res) => {
  try {
    const key = req.params.key;
    const docs = await Doctor.find({
      "$or": [{ DoctorID: key }, { Name: { $regex: key, $options: 'i' } }]
    });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Protected Route: Add Doctor
app.post('/api/doctors/register', authenticateToken, async (req, res) => {
  try {
    const { _id, ...data } = req.body;
    const newDoc = new Doctor(data);
    await newDoc.save();
    res.status(201).json({ message: "Saved", data: newDoc });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Protected Route: Delete Doctor
app.delete('/api/doctors/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Doctor.findOneAndDelete({ DoctorID: req.params.id });
    if (!result) return res.status(404).json({ message: "Doctor not found" });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}...`));