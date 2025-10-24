"use client";
import React, { useEffect, useState } from "react";
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

export default function ManageClassesPage() {
  const [classes, setClasses] = useState<{ _id: string; name: string; timeLimit?: number; subjects?: { _id: string; name: string }[] }[]>([]);
  const [name, setName] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchClasses = () => {
    fetch("http://localhost:4000/api/classes")
      .then((res) => res.json())
      .then((data) => setClasses(data));
  };

  const router = useRouter();
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const role = getRoleFromToken(token);
    if (role !== "admin") {
      router.push("/select-exam");
      return;
    }
    fetchClasses();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
      const url = editId
  ? `http://localhost:4000/api/classes/${editId}`
  : "http://localhost:4000/api/classes";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, timeLimit: Number(timeLimit) }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || (editId ? "Failed to update class" : "Failed to add class"));
      else {
        setSuccess(editId ? "Class updated!" : "Class added!");
        setName("");
        setTimeLimit("");
        setEditId(null);
        fetchClasses();
      }
    } catch {
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cls: any) => {
    setName(cls.name);
    setTimeLimit(cls.timeLimit ? String(cls.timeLimit) : "");
    setEditId(cls._id);
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this class? This will also delete its subjects and questions.")) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setLoading(true);
    try {
  const res = await fetch(`http://localhost:4000/api/classes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to delete class");
      else {
        setSuccess("Class deleted!");
        fetchClasses();
      }
    } catch {
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex flex-col items-center py-10 px-2">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-blue-100 p-8">
        <h1 className="text-3xl font-extrabold text-blue-700 mb-4 text-center flex items-center justify-center gap-2">
          <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Manage Classes
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Class Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Time Limit (minutes)</label>
            <input type="number" value={timeLimit} onChange={e => setTimeLimit(e.target.value)} className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg" min="0" />
          </div>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          {success && <div className="text-green-600 text-sm text-center">{success}</div>}
          <button type="submit" className="w-full px-4 py-3 text-white bg-gradient-to-r from-blue-500 to-green-500 rounded-lg font-bold shadow hover:from-blue-600 hover:to-green-600 transition" disabled={loading}>
            {loading ? (editId ? "Updating..." : "Adding...") : (editId ? "Update Class" : "Add Class")}
          </button>
          {editId && (
            <button type="button" className="w-full px-4 py-3 mt-2 text-gray-700 bg-gray-200 rounded-lg font-bold shadow hover:bg-gray-300 transition" onClick={() => { setEditId(null); setName(""); setTimeLimit(""); setError(""); setSuccess(""); }}>
              Cancel Edit
            </button>
          )}
        </form>
        <h2 className="text-xl font-bold text-blue-600 mb-2">Existing Classes</h2>
        <ul className="divide-y divide-blue-100">
          {classes.map(cls => (
            <li key={cls._id} className="py-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-black">{cls.name}</span>
                <span className="text-gray-500 text-sm">{cls.timeLimit ? `${cls.timeLimit} min` : "No limit"}</span>
                <span>
                  <button className="text-blue-600 font-semibold hover:underline mr-2" onClick={() => handleEdit(cls)}>Edit</button>
                  <button className="text-red-500 font-semibold hover:underline" onClick={() => handleDelete(cls._id)}>Delete</button>
                </span>
              </div>
              {cls.subjects && cls.subjects.length > 0 && (
                <ul className="ml-6 mt-1 text-sm list-disc">
                  {cls.subjects.map(subj => (
                    <li key={subj._id} className="text-black">{subj.name}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-10 text-center">
          <Link href="/dashboard" className="text-blue-600 font-semibold hover:underline">&larr; Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
