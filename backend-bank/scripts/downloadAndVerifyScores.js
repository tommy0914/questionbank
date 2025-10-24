(async () => {
  const fs = require('fs');
  const path = require('path');
  const fetch = require('node-fetch');

  const base = 'http://localhost:4000';
  const loginBody = { username: 'admin', password: 'admin123' };

  try {
    console.log('Logging in...');
    const loginRes = await fetch(`${base}/api/bank/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginBody)
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error('Login failed: ' + (loginData.error || JSON.stringify(loginData)));
    const token = loginData.token;
    console.log('Got token, length=', token.length);

  // Download all scores (use Authorization header)
  console.log('Downloading all scores...');
  const dlAllRes = await fetch(`${base}/api/download-scores`, { headers: { Authorization: `Bearer ${token}` } });
    if (!dlAllRes.ok) {
      const txt = await dlAllRes.text();
      throw new Error('Failed to download all scores: ' + txt);
    }
    const allBuf = await dlAllRes.arrayBuffer();
    const allPath = path.join(__dirname, '..', 'scores_downloaded.xlsx');
    fs.writeFileSync(allPath, Buffer.from(allBuf));
    console.log('Saved all scores to', allPath, 'size=', fs.statSync(allPath).size);

    // Fetch subjects to pick one for subject download
    console.log('Fetching subjects...');
    const subjRes = await fetch(`${base}/api/subjects`, { headers: { Authorization: `Bearer ${token}` } });
    const subjData = await subjRes.json();
    if (!Array.isArray(subjData) || subjData.length === 0) {
      console.log('No subjects found, skipping subject download.');
      process.exit(0);
    }
    const subjectId = subjData[0]._id || subjData[0].id;
    console.log('Picking subject id=', subjectId, 'name=', subjData[0].name);

    // Download subject scores
    console.log('Downloading subject scores...');
  const dlSubjRes = await fetch(`${base}/api/scores/by-subject/${subjectId}/download`, { headers: { Authorization: `Bearer ${token}` } });
    if (!dlSubjRes.ok) {
      const txt = await dlSubjRes.text();
      throw new Error('Failed to download subject scores: ' + txt);
    }
    const subjBuf = await dlSubjRes.arrayBuffer();
    const subjPath = path.join(__dirname, '..', `scores_subject_${subjectId}.xlsx`);
    fs.writeFileSync(subjPath, Buffer.from(subjBuf));
    console.log('Saved subject scores to', subjPath, 'size=', fs.statSync(subjPath).size);

  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
