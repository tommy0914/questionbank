(async () => {
  const fetch = require('node-fetch');
  const base = 'http://localhost:4000';
  try {
    const loginRes = await fetch(`${base}/api/bank/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'admin123' }) });
    const loginData = await loginRes.json();
    console.log('login status', loginRes.status);
    if (!loginRes.ok) { console.log(loginData); process.exit(0); }
    const token = loginData.token;
    console.log('token len', token.length);

    const classesRes = await fetch(`${base}/api/classes`, { headers: { Authorization: `Bearer ${token}` } });
    const classes = await classesRes.json();
    console.log('GET /api/classes status', classesRes.status);
    console.log(JSON.stringify(classes, null, 2));
    if (Array.isArray(classes) && classes.length > 0) {
      const id = classes[0]._id || classes[0].id;
      console.log('Attempting delete class id=', id);
      const del = await fetch(`${base}/api/classes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      console.log('DELETE status', del.status);
      const delBody = await del.json();
      console.log(delBody);
    } else {
      console.log('No classes to delete');
    }
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
