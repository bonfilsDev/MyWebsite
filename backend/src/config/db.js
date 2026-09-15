require('dotenv').config();

const mysql = require('mysql2/promise');

const requiredVariables = [
  'MYSQLHOST',
  'MYSQLPORT',
  'MYSQLUSER',
  'MYSQLPASSWORD',
  'MYSQL_DATABASE'
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    console.error(`Missing environment variable: ${variable}`);
  }
}

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: Number(process.env.MYSQLPORT || 3306),
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  dateStrings: true
});

pool.getConnection()
  .then((connection) => {
    console.log('MySQL connected successfully');
    connection.release();
  })
  .catch((error) => {
    console.error('MySQL connection failed:', error.message);
  });

module.exports = pool;