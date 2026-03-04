// Simple test script to verify API endpoints
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001';

async function testEndpoints() {
  console.log('Testing API endpoints...\n');

  // Test 1: Check if server is running
  try {
    const healthRes = await fetch(`${API_BASE}/health`);
    console.log('✓ Server is running');
  } catch (err) {
    console.log('✗ Server is not running:', err.message);
    return;
  }

  // Test 2: Test auth endpoints
  try {
    const authRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        role: 'patient'
      })
    });
    
    const authData = await authRes.json();
    console.log('Auth endpoint test:', authRes.status, authData.message || 'Endpoint exists');
  } catch (err) {
    console.log('Auth endpoint error:', err.message);
  }

  // Test 3: Test sessions endpoints
  try {
    const sessionsRes = await fetch(`${API_BASE}/api/sessions`, {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    console.log('Sessions endpoint test:', sessionsRes.status, 'Endpoint exists');
  } catch (err) {
    console.log('Sessions endpoint error:', err.message);
  }
}

testEndpoints();