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

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const role = getRoleFromToken(token);
    if (role !== "admin") {
      router.push("/select-exam");
      return;
    }
    if (!token) {
      router.push("/login");
      return;
    }
    fetch("http://localhost:4000/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
        else setError(data.error || "Failed to fetch users");
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch users");
        setLoading(false);
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex flex-col items-center py-10 px-2">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-blue-100 p-8">
        <h1 className="text-4xl font-extrabold text-blue-700 mb-4 text-center flex items-center justify-center gap-2">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Admin Dashboard
        </h1>
        <p className="text-lg text-gray-700 text-center mb-8">Manage users and view system data.</p>
        {loading ? (
          <div className="text-center text-blue-600 font-semibold">Loading users...</div>
        ) : error ? (
          <div className="text-center text-red-500 font-semibold">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b">Username</th>
                  <th className="px-4 py-2 border-b">Role</th>
                  <th className="px-4 py-2 border-b">Class</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-blue-50">
                    <td className="px-4 py-2 border-b">{user.username}</td>
                    <td className="px-4 py-2 border-b">{user.role}</td>
                    <td className="px-4 py-2 border-b">{user.classId || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-10 text-center">
          <Link href="/dashboard" className="text-blue-600 font-semibold hover:underline">&larr; Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
