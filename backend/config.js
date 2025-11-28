require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3001,
    apiKey: process.env.API_KEY || 'default_scanner_api_key_12345',
    serviceAccount: require('./serviceAccountKey.json'),
};