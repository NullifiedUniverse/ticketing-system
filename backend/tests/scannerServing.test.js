const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Mocking the app structure locally to test just the static file serving part
// independent of the rest of the app logic/db connections
describe('Scanner File Serving', () => {
    let app;

    beforeAll(() => {
        app = express();
        
        // Replicate the route from server.js
        app.get('/html5-qrcode.min.js', (req, res) => {
            res.sendFile(path.join(__dirname, '../scanner/html5-qrcode.min.js'));
        });

        app.get('/scanner', (req, res) => {
            res.sendFile(path.join(__dirname, '../scanner/scanner.html'));
        });
    });

    test('GET /html5-qrcode.min.js returns the javascript file', async () => {
        const res = await request(app).get('/html5-qrcode.min.js');
        expect(res.statusCode).toEqual(200);
        expect(res.headers['content-type']).toMatch(/javascript/);
        expect(res.text).toContain('__Html5QrcodeLibrary__');
    });

    test('GET /scanner returns the html file', async () => {
        const res = await request(app).get('/scanner');
        expect(res.statusCode).toEqual(200);
        expect(res.headers['content-type']).toMatch(/html/);
        expect(res.text).toContain('Ticket Scanner');
    });
});
