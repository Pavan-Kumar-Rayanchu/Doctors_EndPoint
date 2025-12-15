const http = require('http');

// Data to update (We are changing Experience and adding Pricing)
const data = JSON.stringify({
    "Experience": "15 Years", 
    "Pricing": 500
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/doctors/TS01AV0001', // Targeting the specific doctor ID
  method: 'PUT',                   // PUT means "Update"
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write("UPDATED RESPONSE: " + d);
  });
});

req.on('error', (error) => {
  console.error("ERROR:", error);
});

req.write(data);
req.end();