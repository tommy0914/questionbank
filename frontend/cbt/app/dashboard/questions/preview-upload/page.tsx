"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

function parseCSV(text: string) {
  // Simple CSV parser that handles quoted fields and commas. Not a full spec parser but sufficient for typical exports.
  const rows: string[][] = [];
  let cur: string = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i+1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      row.push(cur);
      cur = '';
      continue;
    }
    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (cur !== '' || row.length > 0) {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = '';
      }
      // skip consecutive line breaks
      if (ch === '\r' && text[i+1] === '\n') i++;
      continue;
    }
    cur += ch;
  }
  if (cur !== '' || row.length > 0) { row.push(cur); rows.push(row); }
  return rows;
}

export default function PreviewUploadPage() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string,string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fields = [
    '', 'text','option1','option2','option3','option4','answer','topic','className','subjectName'
  ];

  const handleFile = async (f?: File | null) => {
    setError(null);
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setError('Only CSV files are supported in this preview tool. Use the main upload for XLSX or DOCX.');
      return;
    }
    const txt = await f.text();
    const parsed = parseCSV(txt);
    if (!parsed || parsed.length === 0) { setError('No rows parsed'); return; }
    const head = parsed[0].map(h => (h || '').trim());
    const body = parsed.slice(1).map(r => r.map(c => (c||'').trim()));
    setHeaders(head);
    setRows(body);
    // initialize mapping with some heuristics
    const m: Record<string,string> = {};
    head.forEach(h => {
      const key = (h||'').toLowerCase();
      if (key.includes('text') || key.includes('question')) m[h] = 'text';
      else if (key.includes('option') || key.includes('opt') || key === 'a' || key === 'b') {
        // try to put into option1..4 based on number in header
        const n = key.match(/(\d)/);
        if (n) m[h] = 'option' + n[1];
        else if (!m[h]) m[h] = 'option1';
      }
      else if (key.includes('answer') || key.includes('ans')) m[h] = 'answer';
      else if (key.includes('topic')) m[h] = 'topic';
      else if (key.includes('class')) m[h] = 'className';
      else if (key.includes('subject')) m[h] = 'subjectName';
    });
    setMapping(m);
  };

  const handleImport = async () => {
    setError(null);
    if (headers.length === 0 || rows.length === 0) { setError('No data to import'); return; }
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) { setError('No admin token found. Login first.'); setLoading(false); return; }
      const payload = rows.map(r => {
        const obj: any = {};
        headers.forEach((h, idx) => {
          const mapTo = mapping[h] || '';
          if (!mapTo) return;
          obj[mapTo] = r[idx] || '';
        });
        // build options array from option1..option4
        const options = [];
        for (let i=1;i<=4;i++) {
          if (obj['option'+i] && String(obj['option'+i]).trim() !== '') options.push(String(obj['option'+i]).trim());
        }
        return {
          text: obj.text || '',
          options,
          answer: obj.answer || '',
          topic: obj.topic || 'General',
          className: obj.className || '',
          subjectName: obj.subjectName || ''
        };
      }).filter(q => q.text && q.options.length >= 2 && q.answer);

      if (payload.length === 0) { setError('No valid questions parsed (need text, at least 2 options, and answer)'); setLoading(false); return; }

      const res = await fetch('http://localhost:4000/api/bank/questions/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Import failed'); setLoading(false); return; }
      // success
      alert(`Imported ${data.importedQuestions ? data.importedQuestions.length : payload.length} questions`);
      router.push('/dashboard/questions');
    } catch (err: any) {
      setError(err.message || String(err));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">CSV Preview & Column Mapper</h1>
        <p className="text-sm text-gray-600 mb-4">Upload a CSV file, map columns to fields and import as questions. (CSV only.)</p>
        <div className="mb-4">
          <input type="file" accept=".csv" onChange={(e) => handleFile(e.target.files ? e.target.files[0] : null)} />
        </div>
        {error && <div className="text-red-500 mb-3">{error}</div>}

        {headers.length > 0 && (
          <div>
            <div className="mb-4 grid grid-cols-2 gap-4">
              {headers.map((h) => (
                <div key={h} className="flex items-center gap-2">
                  <div className="text-sm font-medium w-40">{h}</div>
                  <select value={mapping[h] || ''} onChange={(e) => setMapping({ ...mapping, [h]: e.target.value })} className="px-2 py-1 border rounded">
                    {fields.map(f => <option key={f} value={f}>{f === '' ? '---' : f}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto max-h-64 mb-4 border">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    {headers.map(h => <th key={h} className="px-2 py-1 border">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0,20).map((r, idx) => (
                    <tr key={idx} className={idx%2===0? 'bg-white':'bg-gray-50'}>
                      {headers.map((_, c) => <td key={c} className="px-2 py-1 border max-w-xs truncate">{r[c]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <button onClick={handleImport} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Importing...' : 'Import Mapped Questions'}</button>
              <button onClick={() => { setHeaders([]); setRows([]); setMapping({}); }} className="px-4 py-2 bg-gray-200 rounded">Clear</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
