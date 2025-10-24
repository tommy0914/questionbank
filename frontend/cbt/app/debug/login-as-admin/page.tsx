"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginAsAdmin() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Auto-login with seeded admin credentials for local development
    const doLogin = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/bank/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "admin", password: "admin123" }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Login failed");
          setLoading(false);
          return;
        }
        if (data.token) {
          localStorage.setItem('token', data.token);
          // small delay to ensure storage events propagate
          setTimeout(() => router.push('/dashboard'), 200);
        } else {
          setError('No token received');
        }
      } catch (err: any) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    doLogin();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {loading ? (
          <div className="text-lg font-semibold">Logging in as admin...</div>
        ) : error ? (
          <div className="text-red-500">Error: {error}</div>
        ) : (
          <div className="text-green-600">Logged in — redirecting...</div>
        )}
      </div>
    </div>
  );
}
