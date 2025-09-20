#!/usr/bin/env node

const http = require('http');
const mongoose = require('mongoose');

// Health check configuration
const HEALTH_CHECK_PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/export-india';

/**
 * Check if the HTTP server is responding
 */
function checkHttpServer() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: 'localhost',
      port: HEALTH_CHECK_PORT,
      path: '/api/health',
      method: 'GET',
      timeout: 3000
    }, (res) => {
      if (res.statusCode === 200) {
        resolve('HTTP server is healthy');
      } else {
        reject(new Error(`HTTP server returned status: ${res.statusCode}`));
      }
    });

    req.on('error', (err) => {
      reject(new Error(`HTTP server error: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('HTTP server timeout'));
    });

    req.end();
  });
}

/**
 * Check MongoDB connection
 */
function checkDatabase() {
  return new Promise((resolve, reject) => {
    const connection = mongoose.createConnection(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });

    connection.on('connected', () => {
      connection.close();
      resolve('Database is healthy');
    });

    connection.on('error', (err) => {
      connection.close();
      reject(new Error(`Database error: ${err.message}`));
    });

    // Timeout after 3 seconds
    setTimeout(() => {
      if (connection.readyState === 0 || connection.readyState === 2) {
        connection.close();
        reject(new Error('Database connection timeout'));
      }
    }, 3000);
  });
}

/**
 * Main health check function
 */
async function healthCheck() {
  const checks = {
    http: { status: 'unknown', message: '' },
    database: { status: 'unknown', message: '' }
  };

  try {
    // Check HTTP server
    try {
      const httpMessage = await checkHttpServer();
      checks.http = { status: 'healthy', message: httpMessage };
    } catch (error) {
      checks.http = { status: 'unhealthy', message: error.message };
    }

    // Check Database
    try {
      const dbMessage = await checkDatabase();
      checks.database = { status: 'healthy', message: dbMessage };
    } catch (error) {
      checks.database = { status: 'unhealthy', message: error.message };
    }

    // Determine overall health
    const isHealthy = Object.values(checks).every(check => check.status === 'healthy');
    
    if (isHealthy) {
      console.log('✅ All health checks passed');
      console.log(JSON.stringify(checks, null, 2));
      process.exit(0);
    } else {
      console.error('❌ Health check failed');
      console.error(JSON.stringify(checks, null, 2));
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Health check error:', error.message);
    process.exit(1);
  }
}

// Run health check if called directly
if (require.main === module) {
  healthCheck();
}

module.exports = { healthCheck, checkHttpServer, checkDatabase };