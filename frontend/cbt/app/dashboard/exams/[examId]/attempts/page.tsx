"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ExamAttemptsPage({ params }: { params: { examId: string } }) {
  const { examId } = params;
  const router = useRouter();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { fetchAttempts(); }, []);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  async function fetchAttempts() {
    setLoading(true); setError(null);
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:4000/api/exams/${examId}/attempts`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) {
        const txt = await res.text();
        
        throw new Error(txt || `Failed to fetch attempts (${res.status})`);
      }
      const data = await res.json();
      const attemptsList = Array.isArray(data) ? data : [];
      setAttempts(attemptsList);

      // Collect all questionIds from attempts and fetch question texts
      const qIdsSet = new Set<string>();
      attemptsList.forEach(a => {
        if (Array.isArray(a.answers)) {
          a.answers.forEach((ans: any) => { if (ans && ans.questionId) qIdsSet.add(String(ans.questionId)); });
        }
      });
      const qIds = Array.from(qIdsSet);
      if (qIds.length > 0) {
        try {
          const batchRes = await fetch(`http://localhost:4000/api/bank/questions/batch?ids=${qIds.join(',')}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
          if (batchRes.ok) {
            const questions = await batchRes.json();
            // Build map id -> text
            const qMap: Record<string,string> = {};
            questions.forEach((q: any) => { qMap[String(q._id)] = q.text || ''; });
            // Attach readable question text into attempts for display
            setAttempts(prev => prev.map(at => ({ ...at, _resolvedQuestions: qMap })));
          }
        } catch (e) { console.error('Failed to fetch question texts', e); }
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally { setLoading(false); }
  }

  function toggleExpand(id: string) {
    setExpanded(prev => prev === id ? null : id);
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white rounded shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Exam Attempts</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => router.push('/dashboard/exams')}>Back</button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={fetchAttempts}>Refresh</button>
          </div>
        </div>

        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}

        {!loading && attempts.length === 0 && <div className="text-gray-500">No attempts found for this exam.</div>}

        <div className="space-y-3">
          {attempts.map(a => (
            <div key={a._id} className="border rounded p-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{a.userId?.username || a.userId || 'Unknown'}</div>
                  <div className="text-sm text-gray-600">Submitted: {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : 'Not submitted'}</div>
                  <div className="text-sm text-gray-600">Score: {a.score}% • Time: {a.timeTakenSeconds}s</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button className="px-3 py-1 bg-green-600 text-white rounded text-sm" onClick={() => toggleExpand(a._id)}>View</button>
                </div>
              </div>

              {expanded === a._id && (
                <div className="mt-3 bg-gray-50 p-3 rounded">
                  <h4 className="font-semibold mb-2">Answers</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    {Array.isArray(a.answers) && a.answers.length > 0 ? a.answers.map((ans: any, idx: number) => (
                      <li key={idx} className="text-sm">
                        <div><span className="font-medium">Q:</span> { (a._resolvedQuestions && a._resolvedQuestions[ans.questionId]) || ans.questionId }</div>
                        <div><span className="font-medium">Answer:</span> {ans.answer}</div>
                        <div><span className="font-medium">Correct:</span> {ans.isCorrect ? 'Yes' : 'No'}</div>
                      </li>
                    )) : <div className="text-sm text-gray-500">No answers recorded.</div>}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
