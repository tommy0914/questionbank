"use client";
import React, { useEffect, useState } from "react";

export default function AnalyticsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [showItemModal, setShowItemModal] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchExams(); }, []);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  async function fetchExams() {
    setError(null);
    try {
      const token = getToken();
      const res = await fetch('http://localhost:4000/api/exams', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('Failed to load exams');
      const data = await res.json();
      setExams(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) setSelectedExam(String(data[0]._id || data[0].id));
    } catch (err: any) {
      setError(err.message || String(err));
    }
  }

  useEffect(() => {
    if (selectedExam) fetchSummary(selectedExam);
    if (selectedExam) fetchItems(selectedExam);
  }, [selectedExam]);

  async function fetchSummary(examId: string) {
    setLoading(true); setError(null); setSummary(null);
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:4000/api/analytics/exams/${examId}/analytics`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to fetch analytics');
      }
      const data = await res.json();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally { setLoading(false); }
  }

  async function handleExport() {
    if (!selectedExam) return;
    setLoading(true); setError(null);
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:4000/api/analytics/export/exam/${selectedExam}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exam_${selectedExam}_analytics.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally { setLoading(false); }
  }

  async function handleDownloadScores() {
    setLoading(true); setError(null);
    try {
      const token = getToken();
      const res = await fetch('http://localhost:4000/api/download-scores', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Download failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scores.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally { setLoading(false); }
  }

  async function fetchItems(examId: string) {
    setError(null);
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:4000/api/analytics/exams/${examId}/items?limit=200`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to fetch items');
      }
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err: any) {
      setError(err.message || String(err));
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto bg-white rounded shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <div>
            <select value={selectedExam || ''} onChange={(e) => setSelectedExam(e.target.value)} className="border px-2 py-1 mr-3">
              {exams.map(ex => <option key={ex._id || ex.id} value={ex._id || ex.id}>{ex.title}</option>)}
            </select>
            <button onClick={handleExport} className="px-3 py-1 bg-blue-600 text-white rounded mr-2">Export XLSX</button>
            <button onClick={() => handleDownloadScores()} className="px-3 py-1 bg-green-600 text-white rounded">Download Scores</button>
          </div>
        </div>

        {error && <div className="text-red-600 mb-3">{error}</div>}
        {loading && <div className="mb-3">Loading...</div>}

        {summary ? (
          <div>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="p-4 bg-gray-50 rounded shadow">
                <div className="text-sm text-gray-500">Total Attempts</div>
                <div className="text-2xl font-bold">{summary.totalAttempts}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded shadow">
                <div className="text-sm text-gray-500">Average Score</div>
                <div className="text-2xl font-bold">{summary.avgScore}%</div>
              </div>
              <div className="p-4 bg-gray-50 rounded shadow">
                <div className="text-sm text-gray-500">Pass Rate</div>
                <div className="text-2xl font-bold">{summary.passRate}%</div>
              </div>
              <div className="p-4 bg-gray-50 rounded shadow">
                <div className="text-sm text-gray-500">Median Time</div>
                <div className="text-2xl font-bold">{Math.round(summary.medianTimeSeconds)}s</div>
              </div>
            </div>

            <hr className="my-4" />
            <h3 className="text-xl font-semibold mb-2">Item Analysis</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Question</th>
                    <th className="px-3 py-2">Attempts</th>
                    <th className="px-3 py-2">Difficulty %</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it.questionId} className="border-t">
                      <td className="px-3 py-2 max-w-xl truncate">{it.text}</td>
                      <td className="px-3 py-2 text-center">{it.totalAttempts}</td>
                      <td className="px-3 py-2 text-center">{it.difficulty}%</td>
                      <td className="px-3 py-2 text-center"><button onClick={() => setShowItemModal(it)} className="px-2 py-1 bg-gray-200 rounded">Details</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showItemModal && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <div className="bg-white rounded p-4 w-11/12 max-w-2xl">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold">Question Details</h4>
                    <button onClick={() => setShowItemModal(null)} className="px-2 py-1 bg-gray-200 rounded">Close</button>
                  </div>
                  <div className="mb-2"><strong>Question:</strong> {showItemModal.text}</div>
                  <div className="mb-2"><strong>Total Attempts:</strong> {showItemModal.totalAttempts}</div>
                  <div className="mb-2"><strong>Difficulty:</strong> {showItemModal.difficulty}%</div>
                  <div>
                    <strong>Option distribution:</strong>
                    <ul className="list-disc pl-6 mt-2">
                      {Array.isArray(showItemModal.optionCounts) && showItemModal.optionCounts.length > 0 ? showItemModal.optionCounts.map((o: any, i: number) => (
                        <li key={i}>{o.answer} — {o.count}</li>
                      )) : <li className="text-gray-500">No option data</li>}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            <h3 className="text-xl font-semibold mb-2">Recent Attempts</h3>
            <div className="space-y-2">
              {summary.recentAttempts && summary.recentAttempts.length > 0 ? summary.recentAttempts.map((a: any) => (
                <div key={a.id} className="border rounded p-3 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{a.userId?.username || String(a.userId)}</div>
                    <div className="text-sm text-gray-600">Score: {a.score} • {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : 'N/A'}</div>
                  </div>
                  <div>
                    <a className="px-3 py-1 bg-gray-200 rounded" href={`/dashboard/exams/${selectedExam}/attempts`}>View</a>
                  </div>
                </div>
              )) : <div className="text-gray-500">No recent attempts</div>}
            </div>
          </div>
        ) : (
          <div className="text-gray-500">Select an exam to view analytics.</div>
        )}
      </div>
    </div>
  );
}
