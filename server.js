const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken'); 
const dotenv = require('dotenv');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const ADMIN_PHONE = process.env.ADMIN_PHONE || "7416974772";
const JWT_SECRET = process.env.JWT_SECRET || "your-secure-secret-key-change-this";

// Simple in-memory OTP store
let otpStore = {
  code: null,
  expiresAt: null
};

// --- DATABASE ---
mongoose.connect('mongodb://127.0.0.1:27017/doctorDB')
  .then(() => console.log('>>> MongoDB Connected! <<<'))
  .catch(err => console.error("MongoDB Error:", err));

// --- COMPREHENSIVE DOCTOR SCHEMA ---
const doctorSchema = new mongoose.Schema({
  DoctorID: { 
    type: String, 
    unique: true, 
    required: [true, "Doctor ID is required"] 
  },
  Name: { 
    type: String, 
    required: [true, "Full Name is required"] 
  },
  Email: {
    type: String,
    required: [true, "Email is required"],
    match: [/.+\@.+\..+/, "Please fill a valid email address"]
  },
  Phone: {
    type: String,
    required: [true, "Contact Number is required"]
  },
  Specialization: {
    type: String,
    required: [true, "Specialization (e.g., Cardiologist) is required"]
  },
  Qualification: {
    type: String,
    required: [true, "Qualification (e.g., MBBS, MD) is required"]
  },
  RegistrationNumber: {
    type: String,
    required: [true, "Medical Registration Number is required"],
    unique: true
  },
  Experience: { 
    type: String, 
    required: [true, "Experience (e.g., 5 Years) is required"] 
  },
  ConsultationFees: {
    type: Number,
    required: [true, "Consultation Fees are required"]
  },
  Timings: {
    type: String, // e.g., "Mon-Sat 10:00 AM - 07:00 PM"
    required: [true, "Availability Timings are required"]
  },
  Address: {
    ClinicName: { type: String, required: [true, "Clinic Name is required"] },
    Street: String,
    City: { 
      type: String, 
      required: [true, "City/Place is required"] 
    },
    State: String,
    ZipCode: String
  },
  Bio: String,
  geo: { coordinates: [Number] }
}, { strict: false });

const Doctor = mongoose.model('Doctor', doctorSchema);

// --- MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: "Access Denied: No Token" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid Token" });
    req.user = user;
    next();
  });
};

// --- AUTH ROUTES ---
app.post('/api/auth/step1', (req, res) => {
  const { phoneNumber } = req.body;
  
  if (phoneNumber === ADMIN_PHONE) {
    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore = {
      code: otp.toString(),
      expiresAt: Date.now() + 5 * 60 * 1000
    };
    
    console.log("--------------------------------");
    console.log("📲 SMS SENT TO: " + phoneNumber);
    console.log("🔐 YOUR OTP CODE IS: " + otpStore.code); 
    console.log("--------------------------------");
    
    res.json({ success: true, message: "OTP sent to phone" });
  } else {
    res.status(401).json({ success: false, message: "Phone number not authorized" });
  }
});

app.post('/api/auth/step2', (req, res) => {
  const { otp } = req.body;

  if (otpStore.code && otp === otpStore.code) {
    if (Date.now() > otpStore.expiresAt) {
      otpStore = { code: null, expiresAt: null };
      return res.status(400).json({ success: false, message: "OTP Expired" });
    }

    otpStore = { code: null, expiresAt: null };
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
      "$or": [
          { DoctorID: key }, 
          { Name: { $regex: key, $options: 'i' } },
          { Specialization: { $regex: key, $options: 'i' } },
          { "Address.City": { $regex: key, $options: 'i' } }
      ]
    });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Protected Route: Add Doctor
app.post('/api/doctors/register', authenticateToken, async (req, res) => {
  try {
    const { _id, ...data } = req.body;

    // Validate Mandatory Fields Manually (for custom error response before Mongoose)
    const requiredFields = [
        'DoctorID', 'Name', 'Email', 'Phone', 'Specialization', 
        'Qualification', 'Experience', 'ConsultationFees', 'Timings'
    ];
    
    const missingFields = requiredFields.filter(field => !data[field]);
    
    // Check nested Address.City explicitly
    if (!data.Address || !data.Address.City || !data.Address.ClinicName) {
        missingFields.push('Address (City & ClinicName)');
    }

    if (missingFields.length > 0) {
        return res.status(400).json({ 
            error: "Validation Failed", 
            message: `Missing required fields: ${missingFields.join(', ')}` 
        });
    }

    // Console log showing key details including Place, Experience, and Specialization
    console.log(`>> Saving Draft: ${data.Name} | Spec: ${data.Specialization} | Exp: ${data.Experience} | Place: ${data.Address.City}`);

    const newDoc = new Doctor(data);
    await newDoc.save(); 
    res.status(201).json({ message: "Doctor Registered Successfully", data: newDoc });

  } catch (err) { 
    if (err.name === 'ValidationError') {
      // Format Mongoose validation errors nicely
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ error: "Validation Error", message: messages });
    }
    // Handle Duplicate Key Error (e.g. Duplicate DoctorID or RegistrationNumber)
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({ error: "Duplicate Error", message: `${field} already exists.` });
    }
    res.status(500).json({ error: err.message }); 
  }
});

app.delete('/api/doctors/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Doctor.findOneAndDelete({ DoctorID: req.params.id });
    if (!result) return res.status(404).json({ message: "Doctor not found" });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}...`));