const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/doctors/TS01AV0001', // The ID to delete
  method: 'DELETE',
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

req.end();