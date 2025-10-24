"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SelectExamPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    fetch("http://localhost:4000/api/classes", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        // API should return an array; be defensive in case it returns an object or error
        if (Array.isArray(data)) {
          setClasses(data);
        } else if (data && Array.isArray((data as any).classes)) {
          setClasses((data as any).classes);
        } else {
          setClasses([]);
          if (data && (data as any).error) setError((data as any).error);
        }
      })
      .catch(() => setError("Failed to fetch classes"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    fetch(`http://localhost:4000/api/subjects/class/${selectedClass}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        // The server should return an array of subjects. Be defensive and normalize.
        if (Array.isArray(data)) {
          setSubjects(data);
        } else if (data && Array.isArray((data as any).subjects)) {
          setSubjects((data as any).subjects);
        } else {
          // If an error object was returned, show it and clear subjects
          setSubjects([]);
          if (data && (data as any).error) setError((data as any).error);
        }
      })
      .catch(() => setError("Failed to fetch subjects"));
  }, [selectedClass]);

  const handleStart = () => {
    if (selectedSubject) {
      router.push(`/cbt/${selectedSubject}`);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 px-2 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-blue-100 p-8">
        <h1 className="text-2xl font-extrabold text-blue-700 mb-6 text-center">Select Class & Subject</h1>
        <div className="mb-4">
          <label className="block mb-1 font-semibold text-gray-700">Class</label>
          <select
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={selectedClass}
            onChange={e => { setSelectedClass(e.target.value); setSelectedSubject(""); }}
          >
            <option value="">Select a class</option>
            {classes.map((cls: any) => (
              <option key={cls._id} value={cls._id}>{cls.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-6">
          <label className="block mb-1 font-semibold text-gray-700">Subject</label>
          <select
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            disabled={!selectedClass}
          >
            <option value="">Select a subject</option>
            {subjects.map((subj: any) => (
              <option key={subj._id} value={subj._id}>{subj.name}</option>
            ))}
          </select>
        </div>
        <button
          className="w-full px-4 py-3 text-white bg-gradient-to-r from-blue-500 to-green-500 rounded-lg font-bold shadow hover:from-blue-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          onClick={handleStart}
          disabled={!selectedSubject}
        >
          Start Exam
        </button>
      </div>
    </div>
  );
}
