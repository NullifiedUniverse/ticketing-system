const admin = require('firebase-admin');
const config = require('./config');

admin.initializeApp({
  credential: admin.credential.cert(config.serviceAccount)
});

const db = admin.firestore();

module.exports = { db, admin };

