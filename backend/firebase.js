const admin = require('firebase-admin');
const config = require('./config');

admin.initializeApp({
  credential: admin.credential.cert(config.serviceAccount)
});

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

module.exports = { db, admin };

