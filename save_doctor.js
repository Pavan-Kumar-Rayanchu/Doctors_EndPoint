const http = require('http');

const doctorData = JSON.stringify({
    "DoctorID": "TS01AV9999",
    "Name": "Aniket Vaidya",
    "Gender": "Male",
    "Speciality": ["Ayurvedic Doctor"],
    "Address": {
      "City": "Adilabad",
      "State": "Telangana"
    },
    "geo": {
      "type": "Point",
      "coordinates": [78.53, 19.67]
    },
    "Experience": "12 Years"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/doctors/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': doctorData.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (d) => process.stdout.write("RESPONSE: " + d));
});

req.on('error', (e) => console.error(e));
req.write(doctorData);
req.end();