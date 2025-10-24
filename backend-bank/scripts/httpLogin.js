(async () => {
  try {
    const res = await fetch('http://localhost:4000/api/bank/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log('BODY', text);
  } catch (err) {
    console.error('ERR', err.message || err);
  }
})();
