const http = require('http');

// The data we are sending (The Password)
const data = JSON.stringify({
  password: "admin123"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/step1', // This is the route that is failing for you
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log("Testing Login Route...");

const req = http.request(options, (res) => {
  console.log(`STATUS CODE: ${res.statusCode}`);
  
  res.on('data', (d) => {
    console.log("RESPONSE: " + d);
  });
});

req.on('error', (error) => {
  console.error("CONNECTION ERROR:", error.message);
});

req.write(data);
req.end();