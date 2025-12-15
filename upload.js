const http = require('http');

// This is the JSON data you want to send
const data = JSON.stringify({
    "DoctorID": "TS01AV0001",
    "Name": "Aniket Vaidya",
    "Gender": "Male",
    "Speciality": ["Ayurvedic Doctor"],
    "Designation": "Ayurvedic Doctor",
    "Address": {
      "Locality": null,
      "Location": "Anand Nivas, Ashok Road",
      "City": "Adilabad",
      "State": "Telangana",
      "Zip": "504001"
    },
    "geo": {
      "type": "Point",
      "coordinates": [78.5376497091777, 19.6732537925715]
    },
    "Experience": "12 Years",
    "Languages": ["English", "Hindi", "Kannada", "Marathi", "Telugu"],
    "Qualification": "Bachelor of Ayurveda, Medicine and Surgery (BAMS), MD",
    "Teleconsultation": true,
    "Profile_Summary": "He has been a successful Ayurveda for the last 4 years...",
    "Samastham_Association": "No",
    "Pricing": null,
    "openingHours": [
      "Fri : 10:30 AM - 12:30 PM,04:30 PM - 08:00 PM",
      "Mon : 10:30 AM - 12:30 PM,04:30 PM - 08:00 PM"
    ]
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/doctors/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write("RESPONSE: " + d);
  });
});

req.on('error', (error) => {
  console.error("ERROR:", error);
});

req.write(data);
req.end();