(async () => {
  const fetch = require('node-fetch');
  const base = 'http://localhost:4000';
  try {
    console.log('Logging in...');
    const loginRes = await fetch(`${base}/api/bank/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'admin123' }) });
    const loginData = await loginRes.json();
    if (!loginRes.ok) { console.error('Login failed', loginData); process.exit(1); }
    const token = loginData.token;
    console.log('Logged in, token length', token.length);

    const classesRes = await fetch(`${base}/api/classes`, { headers: { Authorization: `Bearer ${token}` } });
    const classes = await classesRes.json();
    if (!Array.isArray(classes) || classes.length === 0) {
      console.error('No classes found; cannot create question linked to class/subject'); process.exit(1);
    }
    const cls = classes[0];
    const classId = cls._id || cls.id;
    const subjectId = (cls.subjects && cls.subjects[0] && (cls.subjects[0]._id || cls.subjects[0].id));
    console.log('Using classId', classId, 'subjectId', subjectId);

    const questions = [
      {
        text: 'Sample test question from script',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        answer: 'Option A',
        topic: 'Scripting',
        classId,
        subjectId
      }
    ];

    console.log('Importing questions...');
    const importRes = await fetch(`${base}/api/bank/questions/import`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(questions) });
    const importData = await importRes.json();
    console.log('Import status', importRes.status, importData);

    console.log('Fetching questions...');
    const qRes = await fetch(`${base}/api/bank/questions`, { headers: { Authorization: `Bearer ${token}` } });
    const qData = await qRes.json();
    console.log('Questions fetch status', qRes.status);
    console.log(JSON.stringify(qData, null, 2).slice(0, 2000));

  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
