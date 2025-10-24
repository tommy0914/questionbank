require('dotenv').config();
(async () => {
  const jwt = require('jsonwebtoken');
  const fetch = require('node-fetch');
  const base = 'http://localhost:4000';
  console.log('process.env.JWT_SECRET=', process.env.JWT_SECRET);
  try {
    const loginRes = await fetch(`${base}/api/bank/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'admin123' }) });
    const loginData = await loginRes.json();
    console.log('login status', loginRes.status);
    if (!loginRes.ok) { console.log(loginData); process.exit(0); }
    const token = loginData.token;
    console.log('token:', token);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      console.log('jwt.verify succeeded, decoded:', decoded);
    } catch (err) {
      console.error('jwt.verify failed locally:', err.message);
    }
  } catch (err) {
    console.error(err);
  }
})();
