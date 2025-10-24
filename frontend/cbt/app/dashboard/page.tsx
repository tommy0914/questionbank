"use client";
import React from "react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex flex-col items-center py-10 px-2">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-blue-100 p-8">
        <h1 className="text-4xl font-extrabold text-blue-700 mb-4 text-center flex items-center justify-center gap-2">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Dashboard
        </h1>
        <p className="text-lg text-gray-700 text-center mb-8">Welcome to your dashboard! Use the options below to manage your classes, subjects, and questions.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard/classes" className="block bg-gradient-to-r from-blue-400 to-green-400 text-white rounded-xl p-6 text-center font-bold shadow hover:from-blue-500 hover:to-green-500 transition">
            Manage Classes
          </Link>
          <Link href="/dashboard/subjects" className="block bg-gradient-to-r from-green-400 to-blue-400 text-white rounded-xl p-6 text-center font-bold shadow hover:from-green-500 hover:to-blue-500 transition">
            Manage Subjects
          </Link>
          <Link href="/dashboard/questions" className="block bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl p-6 text-center font-bold shadow hover:from-blue-600 hover:to-green-600 transition">
            Manage Questions
          </Link>
        </div>
        <div className="mt-10 text-center">
          <Link href="/" className="text-blue-600 font-semibold hover:underline">&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
