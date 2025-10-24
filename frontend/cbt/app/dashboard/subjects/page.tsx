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

export default function ManageSubjectsPage() {
  const [classes, setClasses] = useState<{ _id: string; name: string; subjects?: { _id: string; name: string }[] }[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]); // For compatibility, but will use classes
  const [form, setForm] = useState({ name: "", classId: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const router = useRouter();
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const role = getRoleFromToken(token);
    if (role !== "admin") {
      router.push("/select-exam");
      return;
    }
    fetch("http://localhost:4000/api/classes")
      .then((res) => res.json())
      .then((data) => {
        setClasses(data);
        // Flatten all subjects for legacy display (optional)
        setSubjects(data.flatMap((cls: any) => (cls.subjects || []).map((subj: any) => ({ ...subj, classId: cls._id }))));
      });
  }, [router]);

  // Remove fetchSubjects and useEffect for subjects, as subjects are now loaded with classes

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
      const url = editId
  ? `http://localhost:4000/api/subjects/${editId}`
  : "http://localhost:4000/api/subjects";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || (editId ? "Failed to update subject" : "Failed to add subject"));
      else {
        setSuccess(editId ? "Subject updated!" : "Subject added!");
        setForm({ name: "", classId: "" });
        setEditId(null);
        // Update subjects after add/edit
        fetch("http://localhost:4000/api/classes")
          .then((res) => res.json())
          .then((data) => {
            setClasses(data);
            setSubjects(data.flatMap((cls: any) => (cls.subjects || []).map((subj: any) => ({ ...subj, classId: cls._id }))));
          });
      }
    } catch {
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subj: any) => {
    setForm({ name: subj.name, classId: subj.classId });
    setEditId(subj._id);
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this subject? This will also delete its questions.")) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setLoading(true);
    try {
  const res = await fetch(`http://localhost:4000/api/subjects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to delete subject");
      else {
        setSuccess("Subject deleted!");
        // Update subjects after delete
        fetch("http://localhost:4000/api/classes")
          .then((res) => res.json())
          .then((data) => {
            setClasses(data);
            setSubjects(data.flatMap((cls: any) => (cls.subjects || []).map((subj: any) => ({ ...subj, classId: cls._id }))));
          });
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
          Manage Subjects
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Subject Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Class</label>
            <select name="classId" value={form.classId} onChange={handleChange} className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg" required>
              <option value="">Select class</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>{cls.name}</option>
              ))}
            </select>
          </div>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          {success && <div className="text-green-600 text-sm text-center">{success}</div>}
          <button type="submit" className="w-full px-4 py-3 text-white bg-gradient-to-r from-blue-500 to-green-500 rounded-lg font-bold shadow hover:from-blue-600 hover:to-green-600 transition" disabled={loading}>
            {loading ? (editId ? "Updating..." : "Adding...") : (editId ? "Update Subject" : "Add Subject")}
          </button>
          {editId && (
            <button type="button" className="w-full px-4 py-3 mt-2 text-gray-700 bg-gray-200 rounded-lg font-bold shadow hover:bg-gray-300 transition" onClick={() => { setEditId(null); setForm({ name: "", classId: "" }); setError(""); setSuccess(""); }}>
              Cancel Edit
            </button>
          )}
        </form>
        <h2 className="text-xl font-bold text-blue-600 mb-2">Existing Subjects</h2>
        <ul className="divide-y divide-blue-100">
          {classes.map(cls => (
            <React.Fragment key={cls._id}>
              {cls.subjects && cls.subjects.length > 0 && (
                <li className="py-2">
                  <span className="font-semibold text-blue-700">{cls.name}</span>
                  <ul className="ml-6 mt-1 text-sm text-gray-700 list-disc">
                    {cls.subjects.map(subj => (
                      <li key={subj._id} className="flex justify-between items-center">
                        <span>{subj.name}</span>
                        <span>
                          <button className="text-blue-600 font-semibold hover:underline mr-2" onClick={() => handleEdit({ ...subj, classId: cls._id })}>Edit</button>
                          <button className="text-red-500 font-semibold hover:underline" onClick={() => handleDelete(subj._id)}>Delete</button>
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              )}
            </React.Fragment>
          ))}
        </ul>
        <div className="mt-10 text-center">
          <Link href="/dashboard" className="text-blue-600 font-semibold hover:underline">&larr; Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
