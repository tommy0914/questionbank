const xlsx = require('xlsx');
const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');

(async () => {
  try {
    const filePath = path.join(__dirname, '..', 'questions.csv');
    if (!fs.existsSync(filePath)) {
      console.error('Place your CSV file at', filePath);
      process.exit(1);
    }
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

    const transform = (r) => {
      const options = [];
      ['option1','option2','option3','option4','option_1','option_2','option_3','option_4','opt1','opt2','opt3','opt4'].forEach(k => {
        if (r[k] && String(r[k]).trim() !== '') options.push(String(r[k]).trim());
      });
      if (options.length === 0 && r.options && typeof r.options === 'string') {
        const s = r.options.trim();
        if (s.startsWith('[') && s.endsWith(']')) {
          try { return { ...r, options: JSON.parse(s) }; } catch (e) { /* ignore */ }
        }
        if (s.includes('|')) return { ...r, options: s.split('|').map(x => x.trim()).filter(Boolean) };
        if (s.includes(';')) return { ...r, options: s.split(';').map(x => x.trim()).filter(Boolean) };
        if (s.includes(',')) return { ...r, options: s.split(',').map(x => x.trim()).filter(Boolean) };
      }
      return { ...r, options };
    };

    const questions = rows.map(transform).map(r => ({
      text: r.text || r.question || r.Question || '',
      options: r.options || [],
      answer: r.answer || r.Answer || '',
      topic: r.topic || r.Topic || 'General',
      className: r.className || r.class || r.Class || '',
      subjectName: r.subjectName || r.subject || r.Subject || ''
    })).filter(q => q.text && q.options && q.options.length >= 2 && q.answer);

    if (questions.length === 0) {
      console.error('No valid questions parsed from CSV');
      process.exit(1);
    }

    // Prompt: paste admin token or read from env
    const tokenFromEnv = process.env.ADMIN_TOKEN;
    let token = tokenFromEnv;
    if (!token) {
      console.error('Set ADMIN_TOKEN env var to an admin JWT, or modify the script to login programmatically.');
      console.error('Parsed', questions.length, 'questions. First sample:', JSON.stringify(questions[0], null, 2));
      process.exit(1);
    }

    const res = await fetch('http://localhost:4000/api/bank/questions/import', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(questions)
    });
    const data = await res.json();
    console.log('Import status', res.status, data);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
