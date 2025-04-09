'use client'

import Image from "next/image";

export default function Home() {
  const promptButtons = [
    "Show me Rajat's resume summary",
    "What are his top skills?",
    "Tell me about one of his projects",
    "Does he have AI/ML experience?"
  ];

  return (
    <main className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-6 mt-10 border border-gray-300">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Image
            src="/rajat.jpg"
            alt="Rajat Nirwan"
            width={40}
            height={40}
            className="rounded-full object-cover shadow"
          />
          <h1 className="text-xl font-semibold text-gray-800">Rajat Nirwan's Portfolio</h1>
        </div>

        {/* Prompt buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {promptButtons.map((prompt, i) => (
            <button
              key={i}
              className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm px-4 py-2 rounded-full transition"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Placeholder */}
        <div className="text-sm text-gray-500">Chat interface coming next...</div>
      </div>
    </main>
  );
}
