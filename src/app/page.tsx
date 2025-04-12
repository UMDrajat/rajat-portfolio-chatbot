'use client'

import { useState } from 'react';

export default function Home() {
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([]);

  const handleUserMessage = async (text: string) => {
    setMessages((prev) => [...prev, { from: 'user', text }]);
    const botReply = await fetchFromOpenRouter(text);
    setMessages((prev) => [...prev, { from: 'bot', text: botReply }]);
  };

  const fetchFromOpenRouter = async (userMessage: string): Promise<string> => {
    try {
      const res = await fetch('/api/openrouter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userMessage, model: "mistralai/mistral-7b-instruct" })
      });

      const raw = await res.text();
      try {
        const data = JSON.parse(raw);
        return data.text || '❌ Sorry, no response.';
      } catch {
        return '❌ Could not parse response.';
      }
    } catch (error) {
      console.error('OpenRouter API error:', error);
      return '⚠️ Failed to get response.';
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Rajat's Portfolio Chatbot</h1>
      <input
        type="text"
        placeholder="Ask something..."
        className="border p-2 rounded mb-4 w-full max-w-md"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
            handleUserMessage(e.currentTarget.value.trim());
            e.currentTarget.value = '';
          }
        }}
      />
      <div className="w-full max-w-md space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`p-2 rounded ${msg.from === 'user' ? 'bg-blue-200' : 'bg-gray-200'}`}>
            <strong>{msg.from}:</strong> {msg.text}
          </div>
        ))}
      </div>
    </main>
  );
}
