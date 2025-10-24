  "use client";
  // Handler for input changes
import React, { useState, useEffect } from "react";

import Link from "next/link";


import { useRouter } from "next/navigation";

function getRoleFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

export default function UploadQuestionsPage() {
  // Handler for input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, idx?: number) => {
    if (typeof idx === "number") {
      const newOptions = [...form.options];
      newOptions[idx] = e.target.value;
      setForm({ ...form, options: newOptions });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };
  const [classes, setClasses] = useState<{ _id: string; name: string; subjects?: { _id: string; name: string }[] }[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [form, setForm] = useState({
    classId: "",
    subjectId: "",
    text: "",
    options: ["", "", "", ""],
    answer: "",
    topic: "",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState("");
  const [csvSuccess, setCsvSuccess] = useState("");
  const [checkingRole, setCheckingRole] = useState(true);

  const fetchQuestions = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  fetch("http://localhost:4000/api/bank/questions", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setQuestions(data.questions || []));
  };

  const router = useRouter();
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;
    let waited = 0;
    const maxWait = 2000; // 2 seconds
    const pollToken = () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const role = getRoleFromToken(token);
        if (role !== "admin") {
          router.push("/select-exam");
          return;
        }
        // Only fetch data if admin
        fetch("http://localhost:4000/api/classes")
          .then((res) => res.json())
          .then((data) => setClasses(data));
        fetchQuestions();
        setCheckingRole(false);
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      } else {
        waited += 100;
        if (waited >= maxWait) {
          setCheckingRole(false);
          clearInterval(intervalId);
        }
      }
    };
    intervalId = setInterval(pollToken, 100);
    timeoutId = setTimeout(() => {
      setCheckingRole(false);
      clearInterval(intervalId);
    }, maxWait);
    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [router]);

  // Remove useEffect for subjects; subjects are now part of classes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
      const url = editId
        ? `http://localhost:4000/api/bank/questions/${editId}`
        : "http://localhost:4000/api/bank/questions";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          options: form.options,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || (editId ? "Failed to update question" : "Failed to upload question"));
      } else {
        setSuccess(editId ? "Question updated!" : "Question uploaded successfully!");
        setForm({ classId: "", subjectId: "", text: "", options: ["", "", "", ""], answer: "", topic: "" });
        setEditId(null);
        fetchQuestions();
      }
    } catch {
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handler for editing a question
  const handleEdit = (q: any) => {
    setForm({
      classId: q.classId,
      subjectId: q.subjectId,
      text: q.text,
      options: q.options,
      answer: q.answer,
      topic: q.topic,
    });
    setEditId(q._id);
    setSuccess("");
    setError("");
  };

  // Handler for deleting a question
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/bank/questions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to delete question");
      else {
        setSuccess("Question deleted!");
        fetchQuestions();
      }
    } catch {
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handler for CSV upload
  const handleCsvUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCsvError("");
    setCsvSuccess("");
    setCsvLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("http://localhost:4000/api/bank/questions/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) setCsvError(data.error || "Failed to upload CSV");
      else {
        setCsvSuccess("CSV uploaded and questions added!");
        fetchQuestions();
      }
    } catch {
      setCsvError("Server error. Please try again later.");
    } finally {
      setCsvLoading(false);
      (e.target as HTMLFormElement).reset();
    }
  };

  if (checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
        <div className="text-blue-700 text-xl font-bold animate-pulse">Checking permissions...</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex flex-col items-center py-10 px-2">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-blue-100 p-8">
        <h1 className="text-3xl font-extrabold text-blue-700 mb-4 text-center flex items-center justify-center gap-2">
          <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Upload Exam Question
        </h1>
        {/* ...existing code for form fields... */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Class</label>
            <select name="classId" value={form.classId} onChange={handleChange} className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg" required>
              <option value="">Select class</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
            <select name="subjectId" value={form.subjectId} onChange={handleChange} className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg" required>
              <option value="">Select subject</option>
              {classes.find(cls => cls._id === form.classId)?.subjects?.map((subj) => (
                <option key={subj._id} value={subj._id}>{subj.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Question Text</label>
            <input type="text" name="text" value={form.text} onChange={handleChange} className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Options</label>
            <div className="grid grid-cols-2 gap-2">
              {form.options.map((opt, idx) => (
                <input
                  key={idx}
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => handleChange(e, idx)}
                  className="px-4 py-3 bg-white text-black border border-gray-300 rounded-lg"
                  required
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Correct Answer</label>
            <input type="text" name="answer" value={form.answer} onChange={handleChange} className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Topic</label>
            <input type="text" name="topic" value={form.topic} onChange={handleChange} className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg" required />
          </div>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          {success && <div className="text-green-600 text-sm text-center">{success}</div>}
          <button type="submit" className="w-full px-4 py-3 text-white bg-gradient-to-r from-blue-500 to-green-500 rounded-lg font-bold shadow hover:from-blue-600 hover:to-green-600 transition" disabled={loading}>
            {loading ? (editId ? "Updating..." : "Uploading...") : (editId ? "Update Question" : "Upload Question")}
          </button>
          {editId && (
            <button type="button" className="w-full px-4 py-3 mt-2 text-gray-700 bg-gray-200 rounded-lg font-bold shadow hover:bg-gray-300 transition" onClick={() => { setEditId(null); setForm({ classId: "", subjectId: "", text: "", options: ["", "", "", ""], answer: "", topic: "" }); setError(""); setSuccess(""); }}>
              Cancel Edit
            </button>
          )}
        </form>

        <form onSubmit={handleCsvUpload} className="mt-8 mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Bulk Upload (CSV/XLSX/DOCX)</label>
          <input type="file" name="file" accept=".csv,.xlsx,.docx" className="block mb-2" required />
          {csvError && <div className="text-red-500 text-sm text-center">{csvError}</div>}
          {csvSuccess && <div className="text-green-600 text-sm text-center">{csvSuccess}</div>}
          <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-lg font-bold shadow hover:bg-blue-600 transition" disabled={csvLoading}>{csvLoading ? "Uploading..." : "Upload File"}</button>
        </form>

        <h2 className="text-xl font-bold text-blue-600 mb-2">All Questions</h2>
        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg text-sm">
            <thead>
              <tr>
                <th className="px-2 py-1 border-b">Text</th>
                <th className="px-2 py-1 border-b">Options</th>
                <th className="px-2 py-1 border-b">Answer</th>
                <th className="px-2 py-1 border-b">Topic</th>
                <th className="px-2 py-1 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q._id} className="hover:bg-blue-50">
                  <td className="px-2 py-1 border-b max-w-xs truncate">{q.text}</td>
                  <td className="px-2 py-1 border-b">{q.options?.join(", ")}</td>
                  <td className="px-2 py-1 border-b">{q.answer}</td>
                  <td className="px-2 py-1 border-b">{q.topic}</td>
                  <td className="px-2 py-1 border-b">
                    <button className="text-blue-600 font-semibold hover:underline mr-2" onClick={() => handleEdit(q)}>Edit</button>
                    <button className="text-red-500 font-semibold hover:underline" onClick={() => handleDelete(q._id)}>Delete</button>
                  </td>
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
