"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

export default function CBTTestPage() {
  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null); // in seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const params = useParams();
  const subjectId = params?.subjectId as string;
  const [questions, setQuestions] = useState<any[]>([]);
  const [subject, setSubject] = useState<any>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // Timer effect
  useEffect(() => {
    if (submitted || loading || timeLeft === null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [submitted, loading, timeLeft]);

  // Fetch data effect
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/login");
      return;
    }
    // Fetch subject info (with class timeLimit)
    fetch(`http://localhost:4000/api/subjects/${subjectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setSubject(data);
        // Get duration from class timeLimit (in minutes)
        const min = data?.classId?.timeLimit;
        if (typeof min === 'number' && min > 0) {
          setDuration(min * 60);
          setTimeLeft(min * 60);
        } else {
          // fallback: 20 min default
          setDuration(20 * 60);
          setTimeLeft(20 * 60);
        }
      });
    // Fetch questions for this subject
    fetch(`http://localhost:4000/api/bank/questions?subjectId=${subjectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data.questions || []);
        setAnswers(Array((data.questions || []).length).fill(""));
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch questions");
        setLoading(false);
      });
  }, [router, subjectId]);

  const handleSelect = (option: string) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[current] = option;
      return copy;
    });
  };

  const handleNext = () => {
    if (current < questions.length - 1) setCurrent(current + 1);
  };
  const handlePrev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const handleSubmit = () => {
    if (submitted) return;
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] && answers[i] === q.answer) correct++;
    });
    setScore(correct);
    setSubmitted(true);
  };

  // Timer formatting helper
  function formatTime(secs: number | null) {
    if (secs === null) return '--:--';
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  if (loading || timeLeft === null) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  if (!subject) return <div className="min-h-screen flex items-center justify-center text-red-500">Subject not found</div>;
  if (!questions.length) return <div className="min-h-screen flex items-center justify-center text-blue-600">No questions available for this subject.</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 px-2 py-10">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-blue-100 p-8">
        <h1 className="text-2xl font-extrabold text-blue-700 mb-2 text-center">{subject.name} CBT</h1>
        {/* Timer */}
        {!submitted && (
          <div className="flex justify-center mb-4">
            <span className={`px-4 py-2 rounded-lg font-bold text-lg ${timeLeft !== null && timeLeft <= 60 ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-700"}`}>
              Time Left: {formatTime(timeLeft)}
              {duration && duration !== 20 * 60 && (
                <span className="ml-2 text-xs text-gray-500">(Set by admin: {Math.floor(duration/60)} min)</span>
              )}
            </span>
          </div>
        )}
        {submitted ? (
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-4">Test Completed!</div>
            <div className="text-xl text-blue-700 mb-2">Score: {score} / {questions.length}</div>
            <button className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg font-bold shadow hover:bg-blue-600 transition" onClick={() => router.push("/dashboard")}>Go to Dashboard</button>
            {timeLeft === 0 && <div className="mt-2 text-red-500 font-semibold">Time is up! Your answers have been submitted automatically.</div>}
          </div>
        ) : (
          <>
            <div className="mb-4 text-lg font-semibold text-gray-700">Question {current + 1} of {questions.length}</div>
            <div className="mb-6 text-xl font-bold text-gray-800">{questions[current].text}</div>
            <div className="grid grid-cols-1 gap-3 mb-6">
              {questions[current].options.map((opt: string, idx: number) => (
                <button
                  key={idx}
                  className={`w-full px-4 py-3 rounded-lg border font-semibold text-left transition ${answers[current] === opt ? "bg-blue-500 text-white border-blue-500" : "bg-gray-100 border-gray-300 hover:bg-blue-100"}`}
                  onClick={() => handleSelect(opt)}
                  disabled={submitted}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold shadow hover:bg-gray-300 transition"
                onClick={handlePrev}
                disabled={current === 0}
              >
                Previous
              </button>
              {current < questions.length - 1 ? (
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold shadow hover:bg-blue-600 transition"
                  onClick={handleNext}
                  disabled={!answers[current]}
                >
                  Next
                </button>
              ) : (
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold shadow hover:bg-green-600 transition"
                  onClick={handleSubmit}
                  disabled={answers.some((a) => !a)}
                >
                  Submit
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
