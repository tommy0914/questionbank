"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ClearLocalStoragePage() {
  const router = useRouter();

  useEffect(() => {
    try {
      // Remove common keys used by the app
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      // Fallback: clear all storage for this origin
      // localStorage.clear();
    } catch (err) {
      // ignore
    }

    // Give a tiny delay then redirect to login
    setTimeout(() => router.push('/login'), 200);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Clearing session data...</h2>
        <p className="text-sm text-gray-600 mt-2">You will be redirected to login shortly.</p>
      </div>
    </div>
  );
}
