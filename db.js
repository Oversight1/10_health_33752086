require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.HEALTH_HOST,
    user: process.env.HEALTH_USER,
    password: process.env.HEALTH_PASSWORD,
    database: process.env.HEALTH_DATABASE,
    port: process.env.HEALTH_PORT || 3306,
    // The (process.env.HEALTH_HOST || '') prevents the app from crashing if the .env file is empty
    ssl: (process.env.HEALTH_HOST || '').includes('aivencloud.com') ? { rejectUnauthorized: false } : false,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();