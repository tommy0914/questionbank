"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function parseToken(token: string | null) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { username: payload.username || payload.user || null, role: payload.role || null };
  } catch {
    return null;
  }
}

export default function LogoutButton() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const info = parseToken(t);
    if (info) {
      setUsername(info.username);
      setRole(info.role);
    }

    const handler = () => {
      const tt = localStorage.getItem('token');
      const inf = parseToken(tt);
      setUsername(inf?.username || null);
      setRole(inf?.role || null);
    };

    // Listen for storage changes from other tabs
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
    } catch (e) {
      // ignore
    }
    // Redirect to login
    router.push("/login");
  };

  return (
    <div className="flex items-center gap-3">
      {username ? (
        <div className="text-sm text-gray-700">
          <span className="font-semibold mr-2">{username}</span>
          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">{role}</span>
        </div>
      ) : null}
      <button
        onClick={handleLogout}
        className="px-3 py-1 rounded-md bg-red-500 text-white hover:bg-red-600 transition"
        title="Logout"
      >
        Logout
      </button>
    </div>
  );
}
