"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [formData, setFormData] = useState({ username: "", password: "", confirmPassword: "", role: "user", classId: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState<{ _id: string; name: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Fetch available classes for user registration
  fetch("http://localhost:4000/api/classes")
      .then((res) => res.json())
      .then((data) => setClasses(data))
      .catch(() => setClasses([]));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.role === "user" && !formData.classId) {
      setError("Please select a class");
      return;
    }
    setLoading(true);
    try {
  const res = await fetch("http://localhost:4000/api/bank/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          role: formData.role,
          classId: formData.role === "user" ? formData.classId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }
      // Optionally, auto-login or redirect
      router.push("/login");
    } catch (err) {
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-green-100 px-2">
      <div className="w-full max-w-md p-10 space-y-8 bg-white rounded-2xl shadow-2xl border border-blue-100">
        <h2 className="text-3xl font-extrabold text-center text-blue-700 mb-2 flex items-center justify-center gap-2">
          <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Register
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
            <input
              type="text"
              name="username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 mt-1 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 mt-1 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 mt-1 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 mt-1 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {formData.role === "user" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Class</label>
              <select
                name="classId"
                value={formData.classId}
                onChange={handleChange}
                className="w-full px-4 py-3 mt-1 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="">Select a class</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>{cls.name}</option>
                ))}
              </select>
            </div>
          )}
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="w-full px-4 py-3 text-white bg-gradient-to-r from-blue-500 to-green-500 rounded-lg font-bold shadow hover:from-blue-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <div className="text-center text-sm text-gray-600">
          Already have an account? <Link href="/login" className="text-blue-600 font-semibold hover:underline">Login</Link>
        </div>
      </div>
    </div>
  );
}
