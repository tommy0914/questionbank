(async () => {
  try {
    // Login as admin
    const loginRes = await fetch('http://localhost:4000/api/bank/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const loginJson = await loginRes.json();
    if (!loginRes.ok) return console.error('Login failed', loginJson);
    const token = loginJson.token;

    // Create exam
    const examPayload = {
      title: 'Sample Math Quiz',
      description: 'Auto-created by test script',
      selectionType: 'random',
      questionCount: 5,
      durationMinutes: 10,
      startAt: new Date(Date.now() - 1000 * 60).toISOString(),
      endAt: new Date(Date.now() + 1000 * 60 * 60).toISOString()
    };

    const res = await fetch('http://localhost:4000/api/exams', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(examPayload)
    });
    const body = await res.json();
    console.log('Create exam status', res.status, body);
  } catch (err) {
    console.error('ERR', err.message || err);
  }
})();
