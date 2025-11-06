
// It is recommended to use environment variables to store sensitive information.
// Create a .env file in the backend directory and add the following:
// GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_BASE64=YOUR_BASE64_ENCODED_SERVICE_ACCOUNT_JSON
// API_KEY=YOUR_SUPER_SECRET_API_KEY_HERE

const config = {
    serviceAccount: process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_BASE64 
        ? JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_BASE64, 'base64').toString('ascii'))
        : undefined,
    apiKey: process.env.API_KEY || "YOUR_SUPER_SECRET_API_KEY_HERE",
    port: process.env.PORT || 3001
};

module.exports = config;
