(async () => {
  const fetch = require('node-fetch');
  const base = 'http://localhost:4000';
  try {
    const res = await fetch(base + '/api/save-score', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'student1', score: 75, totalQuestions: 100, classId: 'class1', subjectId: 'subject1', subjectName: 'Math', className: 'JSS1', timeTaken: 1800 })
    });
    const t = await res.text();
    console.log('save-score response:', res.status, t);
  } catch (err) {
    console.error('error:', err.message || err);
  }
})();
