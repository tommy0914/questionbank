"use client";
import React, { useEffect, useState } from "react";

export default function ExamsAdminPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectionType, setSelectionType] = useState("random");
  const [questionCount, setQuestionCount] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [randomized, setRandomized] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") : null;

  async function fetchExams() {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch("http://localhost:4000/api/exams", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Failed to fetch exams ${res.status}`);
      }
      const data = await res.json();
      setExams(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const token = getToken();
    if (!token) return setError('No admin token found. Please login as admin.');
    try {
      const payload = {
        title,
        description,
        selectionType,
        questionCount: Number(questionCount),
        durationMinutes: Number(durationMinutes),
        startAt: startAt ? new Date(startAt).toISOString() : undefined,
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
        randomized
      };
      const res = await fetch("http://localhost:4000/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || JSON.stringify(body));
      // Add to list
      setExams(prev => [body, ...prev]);
      // reset form
      setTitle(""); setDescription(""); setQuestionCount(10); setDurationMinutes(30); setStartAt(""); setEndAt(""); setRandomized(true);
      alert('Exam created');
    } catch (err: any) {
      setError(err.message || String(err));
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white shadow rounded p-6">
        <h2 className="text-2xl font-bold mb-4">Exam Builder (Admin)</h2>
        {error && <div className="text-red-600 mb-3">{error}</div>}
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3">
          <input className="border px-2 py-1" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
          <textarea className="border px-2 py-1" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
          <div className="flex gap-3">
            <label className="flex items-center gap-2"><input type="radio" name="selType" checked={selectionType==='random'} onChange={() => setSelectionType('random')} /> Random</label>
            <label className="flex items-center gap-2"><input type="radio" name="selType" checked={selectionType==='manual'} onChange={() => setSelectionType('manual')} /> Manual</label>
            <input type="number" className="border px-2 py-1 w-28" value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} min={1} />
            <input type="number" className="border px-2 py-1 w-28" value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} min={1} />
            <label className="flex items-center gap-2"><input type="checkbox" checked={randomized} onChange={e => setRandomized(e.target.checked)} /> Randomize order</label>
          </div>

          <div className="flex gap-3">
            <div>
              <div className="text-xs text-gray-600">Start</div>
              <input type="datetime-local" className="border px-2 py-1" value={startAt} onChange={e => setStartAt(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-gray-600">End</div>
              <input type="datetime-local" className="border px-2 py-1" value={endAt} onChange={e => setEndAt(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create Exam</button>
            <button type="button" onClick={fetchExams} className="px-4 py-2 bg-gray-200 rounded">Refresh List</button>
          </div>
        </form>

        <hr className="my-4" />

        <h3 className="text-xl font-semibold mb-2">Existing Exams</h3>
        {loading ? <div>Loading...</div> : (
          <div className="space-y-3">
            {exams.length === 0 && <div className="text-gray-500">No exams found</div>}
            {exams.map((ex) => (
              <div key={ex._id || ex.id} className="border rounded p-3 flex justify-between items-start">
                <div>
                  <div className="font-medium">{ex.title}</div>
                  <div className="text-sm text-gray-600">{ex.description}</div>
                  <div className="text-xs text-gray-500">Start: {ex.startAt ? new Date(ex.startAt).toLocaleString() : 'N/A'} • End: {ex.endAt ? new Date(ex.endAt).toLocaleString() : 'N/A'}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <a className="px-3 py-1 bg-green-600 text-white rounded text-sm" href={`/exam/${ex._id || ex.id}/start`}>Open as student</a>
                  <a className="px-3 py-1 bg-gray-200 rounded text-sm" href={`/dashboard/exams/${ex._id || ex.id}/attempts`}>View attempts</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
