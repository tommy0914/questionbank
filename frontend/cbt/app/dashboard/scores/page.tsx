"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function getRoleFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

export default function AdminScoresPage() {
  const [scores, setScores] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subjectAnalytics, setSubjectAnalytics] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const role = getRoleFromToken(token);
    if (role !== "admin") {
      router.push("/select-exam");
      return;
    }
    fetch("http://localhost:4000/api/scores/analytics", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setScores(data.recentScores || []);
        setLoading(false);
      });
    fetch("http://localhost:4000/api/subjects", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setSubjects(data));
  }, [router]);

  // Fetch analytics for selected subject
  useEffect(() => {
    if (!selectedSubject) {
      setSubjectAnalytics(null);
      return;
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    fetch(`http://localhost:4000/api/scores/by-subject/${selectedSubject}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setSubjectAnalytics(data));
  }, [selectedSubject]);

  // Fetch all students from scores
  useEffect(() => {
    setStudents([...new Set(scores.map((s) => s.Username))]);
  }, [scores]);

  const handleDownloadAll = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    window.open(`http://localhost:4000/api/download-scores?token=${token}`);
  };

  const handleDownloadSubject = () => {
    if (!selectedSubject) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    window.open(`http://localhost:4000/api/scores/by-subject/${selectedSubject}/download?token=${token}`);
  };

  // Filtered scores
  const filteredScores = scores.filter(s =>
    (!selectedSubject || s["Subject ID"] === selectedSubject) &&
    (!selectedStudent || s.Username === selectedStudent)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex flex-col items-center py-10 px-2">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-blue-100 p-8">
        <h1 className="text-3xl font-extrabold text-blue-700 mb-4 text-center flex items-center justify-center gap-2">
          <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Manage Scores
        </h1>
        <div className="flex flex-wrap gap-4 mb-6">
          <button onClick={handleDownloadAll} className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold shadow hover:bg-blue-600 transition">Download All Scores</button>
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-100">
            <option value="">Filter by Subject</option>
            {subjects.map((s: any) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          <button onClick={handleDownloadSubject} disabled={!selectedSubject} className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold shadow hover:bg-green-600 transition disabled:opacity-50">Download Subject Scores</button>
          <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-100">
            <option value="">Filter by Student</option>
            {students.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        {/* Subject Analytics */}
        {subjectAnalytics && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="text-lg font-bold text-blue-700 mb-2">Subject Analytics</h2>
            <div className="flex flex-wrap gap-6">
              <div>Total Students: <span className="font-bold">{subjectAnalytics.totalStudents}</span></div>
              <div>Average Score: <span className="font-bold">{subjectAnalytics.averageScore}</span></div>
              <div>Pass Count: <span className="font-bold">{subjectAnalytics.passCount}</span></div>
              <div>Fail Count: <span className="font-bold">{subjectAnalytics.failCount}</span></div>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-blue-100">
                <th className="px-4 py-2 border">Username</th>
                <th className="px-4 py-2 border">Score</th>
                <th className="px-4 py-2 border">Total Questions</th>
                <th className="px-4 py-2 border">Percentage</th>
                <th className="px-4 py-2 border">Class</th>
                <th className="px-4 py-2 border">Subject</th>
                <th className="px-4 py-2 border">Time Taken</th>
              </tr>
            </thead>
            <tbody>
              {filteredScores.map((s, i) => (
                <tr key={i} className="hover:bg-blue-50">
                  <td className="px-4 py-2 border">{s.Username}</td>
                  <td className="px-4 py-2 border">{s.Score}</td>
                  <td className="px-4 py-2 border">{s["Total Questions"]}</td>
                  <td className="px-4 py-2 border">{s.Percentage}</td>
                  <td className="px-4 py-2 border">{s.Class}</td>
                  <td className="px-4 py-2 border">{s.Subject}</td>
                  <td className="px-4 py-2 border">{s["Time Taken"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-10 text-center">
          <Link href="/dashboard" className="text-blue-600 font-semibold hover:underline">&larr; Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
