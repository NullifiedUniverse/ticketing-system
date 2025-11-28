const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Start the server process
const serverProcess = exec('node server.js', { cwd: path.join(__dirname, '..') });

serverProcess.stdout.on('data', (data) => {
    // console.log(`Server stdout: ${data}`);
    if (data.includes('Server is running')) {
        runTests();
    }
});

serverProcess.stderr.on('data', (data) => {
    console.error(`Server stderr: ${data}`);
});

function runTests() {
    const options = {
        hostname: 'localhost',
        port: 3001, // Assuming default port
        path: '/html5-qrcode.min.js',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        
        if (res.statusCode === 200 && res.headers['content-type'].includes('javascript')) {
            console.log('PASS: /html5-qrcode.min.js served correctly.');
            process.exit(0);
        } else {
            console.error('FAIL: Incorrect status or content-type.');
            process.exit(1);
        }
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
        process.exit(1);
    });

    req.end();
}

// Timeout safety
setTimeout(() => {
    console.error('Test timed out.');
    process.exit(1);
}, 10000);
