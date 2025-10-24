"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Question = {
  _id: string;
  text: string;
  options: string[];
  topic?: string;
};

export default function ExamStartPage({ params }: { params: { examId: string } }) {
  const examId = params.examId;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [examTitle, setExamTitle] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(0);
  const timerRef = useRef<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Attempt persistence key
  const storageKey = `exam_attempt_${examId}`;

  useEffect(() => {
    startOrResume();
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadSaved() {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function saveState(s: any) {
    try { localStorage.setItem(storageKey, JSON.stringify(s)); } catch (e) { /* ignore */ }
  }

  async function startOrResume() {
    setLoading(true);
    setError(null);
    const saved = loadSaved();
    if (saved && saved.attemptId) {
      // resume saved
      setAttemptId(saved.attemptId);
      setQuestions(saved.questions || []);
      setExamTitle(saved.examTitle || null);
      setDurationMinutes(saved.durationMinutes || 0);
      setAnswers(saved.answers || {});
      const remaining = saved.endsAt ? Math.max(0, Math.floor((new Date(saved.endsAt).getTime() - Date.now()) / 1000)) : 0;
      setTimeLeftSec(remaining);
      if (remaining > 0) startTimer(remaining);
      setLoading(false);
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`http://localhost:4000/api/exams/${examId}/start`, {
        method: 'POST', headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Failed to start exam (${res.status})`);
      }
      const data = await res.json();
      setAttemptId(data.attemptId);
      setQuestions(data.questions || []);
      setExamTitle(data.exam?.title || null);
      setDurationMinutes(data.exam?.durationMinutes || 0);

      // compute end time
      const endsAt = new Date(Date.now() + (data.exam?.durationMinutes || 0) * 60 * 1000).toISOString();
      const remainingSec = Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000));
      setTimeLeftSec(remainingSec);

      const toSave = { attemptId: data.attemptId, questions: data.questions, examTitle: data.exam?.title, durationMinutes: data.exam?.durationMinutes, endsAt, answers: {} };
      saveState(toSave);
      startTimer(remainingSec);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  function startTimer(sec: number) {
    setTimeLeftSec(sec);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeLeftSec(t => {
        if (t <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          autoSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000) as unknown as number;
  }

  function formatTime(s: number) {
    const mm = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }

  function selectAnswer(qId: string, val: string) {
    setAnswers(prev => {
      const next = { ...prev, [qId]: val };
      // persist
      const saved = loadSaved() || {};
      saved.answers = next;
      saveState(saved);
      return next;
    });
  }

  async function autoSubmit() {
    if (!attemptId) return;
    // Build answers payload
    const payload = {
      attemptId,
      answers: questions.map(q => ({ questionId: q._id, answer: answers[q._id] || '' }))
    };
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`http://localhost:4000/api/exams/${examId}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      setSubmitted(true);
      setResult(data);
      // clear saved attempt
      try { localStorage.removeItem(storageKey); } catch (e) { }
    } catch (err) {
      // If submit fails due to network, keep attempt saved so user can retry
      console.error('Auto-submit failed', err);
    }
  }

  async function handleSubmit() {
    if (!attemptId) return setError('No attempt in progress');
    setLoading(true);
    setError(null);
    try {
      const payload = { attemptId, answers: questions.map(q => ({ questionId: q._id, answer: answers[q._id] || '' })) };
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`http://localhost:4000/api/exams/${examId}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));
      setSubmitted(true);
      setResult(data);
      try { localStorage.removeItem(storageKey); } catch (e) { }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (submitted && result) {
    return (
      <div className="min-h-screen p-6 bg-gray-50 flex items-start justify-center">
        <div className="max-w-3xl w-full bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-bold">Results</h2>
          <div className="mt-4">Score: {result.score}%</div>
          <div className="mt-2">Correct: {result.correct} / {result.total}</div>
          <div className="mt-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => router.push('/select-exam')}>Back to exams</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50 flex items-start justify-center">
      <div className="max-w-3xl w-full bg-white p-6 rounded shadow">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{examTitle || 'Exam'}</h2>
          <div className="text-sm text-gray-700">Time left: <span className="font-mono">{formatTime(timeLeftSec)}</span></div>
        </div>

        <ol className="mt-4 space-y-4">
          {questions.map((q, idx) => (
            <li key={q._id} className="border rounded p-3">
              <div className="font-medium">{idx + 1}. {q.text}</div>
              <div className="mt-2 grid gap-2">
                {q.options && q.options.map((opt, i) => (
                  <label key={i} className={`flex items-center gap-2 p-2 rounded hover:bg-gray-50 ${answers[q._id] === opt ? 'bg-blue-50 border border-blue-200' : ''}`}>
                    <input type="radio" name={q._id} checked={answers[q._id] === opt} onChange={() => selectAnswer(q._id, opt)} />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-4 flex gap-3">
          <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleSubmit}>Submit Exam</button>
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => { if (confirm('Leave exam? your progress will be saved.')) router.push('/select-exam'); }}>Exit</button>
        </div>
      </div>
    </div>
  );
}
