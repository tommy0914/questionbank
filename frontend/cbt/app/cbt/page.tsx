"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CBTPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/login");
      return;
    }
    // Fetch all subjects
  fetch("http://localhost:4000/api/subjects", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setSubjects(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch subjects");
        setLoading(false);
      });
  }, [router]);

  const handleStart = () => {
    if (!selectedSubject) return;
    router.push(`/cbt/${selectedSubject}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 px-2">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-blue-100 p-8">
        <h1 className="text-3xl font-extrabold text-blue-700 mb-6 text-center">Start CBT</h1>
        {loading ? (
          <div className="text-center text-blue-600 font-semibold">Loading subjects...</div>
        ) : error ? (
          <div className="text-center text-red-500 font-semibold">{error}</div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); handleStart(); }} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Select Subject</label>
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Choose a subject</option>
                {subjects.map((subj: any) => (
                  <option key={subj._id} value={subj._id}>{subj.name}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full px-4 py-3 text-white bg-gradient-to-r from-blue-500 to-green-500 rounded-lg font-bold shadow hover:from-blue-600 hover:to-green-600 transition"
              disabled={!selectedSubject}
            >
              Start Test
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
