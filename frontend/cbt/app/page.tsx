import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-green-100 px-2">
      <div className="mb-8">
        <Image
          src="/school-logo.png"
          alt="School Logo"
          width={128}
          height={128}
          className="w-32 h-32 rounded-full shadow-xl border-4 border-white bg-white object-contain"
        />
      </div>
      <h1 className="text-5xl font-extrabold text-blue-700 mb-6 text-center drop-shadow flex items-center gap-2">
        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        Welcome to <span className="text-green-600 ml-2">SHELPARD DELIGHT SECONDARY SCHOOL</span>
      </h1>
      <p className="text-2xl text-gray-700 mb-10 text-center max-w-2xl font-medium">
        Empowering students and educators with a modern Computer-Based Testing (CBT) platform.<br />
        <span className="text-green-600">Login to take your test or register to get started!</span>
      </p>
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-md justify-center">
        <Link
          href="/login"
          className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl font-bold shadow-lg hover:from-blue-600 hover:to-green-600 transition text-center"
        >
          Student/Admin Login
        </Link>
        <Link
          href="/register"
          className="flex-1 px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-bold shadow-lg hover:from-green-600 hover:to-blue-600 transition text-center"
        >
          Register
        </Link>
      </div>
      <footer className="mt-16 text-gray-500 text-sm text-center">
        &copy; {new Date().getFullYear()} Shelpard Delight Secondary School. All rights reserved.
      </footer>
    </div>
  );
}
