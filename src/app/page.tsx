'use client'

import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown';
import SocialLinks from './components/SocialLinks';
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
const SpeechRecognition =
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export default function Home() {
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([])
  const [usedPrompts, setUsedPrompts] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [resumeData, setResumeData] = useState<string | null>(null)
  const [smartPrompts, setSmartPrompts] = useState<string[]>([]);
  const [lastTopic, setLastTopic] = useState<string | null>(null);
  const [promptHistory, setPromptHistory] = useState<Set<string>>(new Set());
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [listening, setListening] = useState(false);
  const [language, setLanguage] = useState('en-US');
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const handleVoiceInput = () => {
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language;

    recognition.onstart = () => {
      setListening(true);
      document.querySelector('input[type="text"]')?.classList.add('ring-2', 'ring-green-400');
    };
    recognition.onend = () => {
      setListening(false);
      document.querySelector('input[type="text"]')?.classList.remove('ring-2', 'ring-green-400');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleUserMessage(transcript);
      recognition.stop();
    };

    recognition.start();
  };

  const allPromptSuggestions = [
    "What makes Rajat stand out?",
    "Give me a sneak peek into his skills ✨",
    "What’s one cool project he's worked on?",
    "How does he handle challenges?",
    "What’s his leadership style like? 👨‍💼",
    "Is he experienced with AI or data?",
    "Can you summarize his experience quickly?",
    "What's something unique about his background?",
    "Any fun facts or achievements worth sharing?",
    "Why would Rajat be a great fit for a product/data role?"
  ];
  const [promptButtons, setPromptButtons] = useState<string[]>([]);

  const resumeFiles = {
    skills: 'https://drive.google.com/uc?export=download&id=1B-aoiWTGUB4B1B5tVHKgWNZoT-vGvmVV',
    summary: 'https://drive.google.com/uc?export=download&id=1JKaj5lX4w06aeapr6J-C8vNzKl2aMS7e',
    projects: 'https://drive.google.com/uc?export=download&id=105hCJwqikTfZISp7MuAQEOT0qqpRGMsY',
    experience: 'https://drive.google.com/uc?export=download&id=1wRIMhyGZ5NIL1TGW6cDNG7sSN4Z-PrcC',
    education: 'https://drive.google.com/uc?export=download&id=13XohxVcZOvGz0Ahxqr4uKfBzgJHjAQWq'
  }

  useEffect(() => {
    const storedMessages = localStorage.getItem('chat_history')
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages))
    }

    const storedPrompts = localStorage.getItem('smart_prompts');
    if (storedPrompts) {
      setSmartPrompts(JSON.parse(storedPrompts));
    } else {
      setPromptButtons([...allPromptSuggestions].sort(() => 0.5 - Math.random()));
    }

    const fetchResumeFiles = async () => {
      try {
        const values = await Promise.all(
          Object.values(resumeFiles).map(async (url) => {
            const res = await fetch('/api/fetch-resume', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url })
            })

            const data = await res.json()
            return data.text || '[Failed to load]'
          })
        )

        const combined = `Resume Summary:\n${values[1]}\n\nSkills:\n${values[0]}\n\nProjects:\n${values[2]}\n\nExperience:\n${values[3]}\n\nEducation:\n${values[4]}`
        setResumeData(combined)
      } catch (error) {
        console.error('❌ Error fetching resume data:', error)
        setResumeData('[Resume data not available]')
      }
    }

    fetchResumeFiles()
  }, [])

  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages))
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (messages.length === 0 || !lastTopic) {
      setSmartPrompts([...allPromptSuggestions].sort(() => 0.5 - Math.random()));
      return;
    }

    const lastBotMsg = messages[messages.length - 1];
    if (lastBotMsg.from === 'bot') {
      const suggestions: Set<string> = new Set();

      if (lastTopic.includes('project')) {
        suggestions.add("What challenges did Rajat face in this project?");
        suggestions.add("What tools did he use?");
        suggestions.add("Was this a solo or team effort?");
      }
      if (lastTopic.includes('skills')) {
        suggestions.add("Which skill is he most confident in?");
        suggestions.add("How did he gain these skills?");
        suggestions.add("Does he have leadership experience?");
      }
      if (lastTopic.includes('experience')) {
        suggestions.add("Tell me more about his work at Econote.");
        suggestions.add("How long did he work in product management?");
        suggestions.add("Did he manage a team?");
      }

      // fallback suggestions
      if (suggestions.size === 0) {
        suggestions.add("Tell me more.");
        suggestions.add("What else is interesting?");
        suggestions.add("How does this relate to AI?");
      }

      const filtered = Array.from(suggestions).filter(s => !promptHistory.has(s)).slice(0, 3);
      filtered.forEach(p => promptHistory.add(p));
      setPromptHistory(new Set(promptHistory));
      setSmartPrompts(filtered);
      localStorage.setItem('smart_prompts', JSON.stringify(filtered));
    }
  }, [messages, lastTopic]);

  const handlePromptClick = (prompt: string) => {
    handleUserMessage(prompt)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
      const userInput = e.currentTarget.value
      e.currentTarget.value = ''
      handleUserMessage(userInput)
    }
  }

  const handleUserMessage = async (text: string) => {
    setMessages((prev) => [...prev, { from: 'user', text }])
    setUsedPrompts((prev) => [...prev, text])
    setLastTopic(text.toLowerCase())
    setLoading(true)
    const botReply = await fetchFromOpenRouter(text)
    setMessages((prev) => [...prev, { from: 'bot', text: botReply }])
    setLoading(false)
  }

  const fetchFromOpenRouter = async (userMessage: string): Promise<string> => {
    const apiKey = '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'
    const systemPrompt = resumeData
      ? `You're Rajat Nirwan’s friendly portfolio assistant. You should always:
 - Think before answering
 - Frame answers positively, highlighting strengths and potential
 - Share **only partial** information by default (e.g., 1–2 projects or a few skills), and ask “Want to explore more?”
 - Keep tone warm, optimistic, and conversational
 - Sprinkle in subtle charm or light humor when appropriate (e.g., "Turns out, he’s got some pretty versatile skills!")

Use this formatting style:
- Start with a one-line summary (if applicable)
- For **projects**:
  - Highlight Rajat's role, tools used, challenges solved, and outcomes
  - Use bullet points for responsibilities and results
  - Include timelines if available
- For **skills**:
  - Group into **Technical**, **Analytical**, **Leadership**
  - Mention where/how skills were applied
- Use **bold** for key phrases and _italics_ for names or roles
- Always offer a follow-up like: “Want to dive deeper into this?” or “Shall I show another?”

Only use the resume data below. If something’s missing, just say so politely.

Resume:\n${resumeData}`
      : `Hi! I’m Rajat’s portfolio assistant. His resume is still loading. Could you give it a moment and ask again shortly?`

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3-70b-instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ]
        })
      })

      const data = await res.json()
      return data.choices?.[0]?.message?.content || '❌ Sorry, no response.'
    } catch (error) {
      console.error('OpenRouter API error:', error)
      return '⚠️ Failed to get response.'
    }
  }

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fadeIn {
        animation: fadeIn 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <main className="min-h-screen w-full px-8 py-4 flex flex-col items-start justify-between bg-[#f7f9fb]">
      <div className="w-full h-full min-h-[85vh] p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Image
              src="/rajat.jpg"
              alt="Rajat Nirwan"
              width={40}
              height={40}
              className="rounded-full object-cover shadow"
            />
            <h1 className="text-xl font-semibold text-gray-800">Rajat Nirwan's Portfolio</h1>
          </div>
          <SocialLinks
            onNewChat={() => {
              setMessages([{ from: 'bot', text: "👋 Welcome to Rajat Nirwan's Portfolio. How can I help you?" }]);
              setUsedPrompts([]);
              setLastTopic(null);
              setPromptHistory(new Set());
              localStorage.removeItem('chat_history');
              localStorage.removeItem('smart_prompts');
              const initialPrompts = [...allPromptSuggestions].sort(() => 0.5 - Math.random()).slice(0, 3);
              setSmartPrompts(initialPrompts);
              setPromptButtons(initialPrompts);
              localStorage.setItem('smart_prompts', JSON.stringify(initialPrompts));
            }}
          />
        </div>

        {/* Regenerate Suggestions Button */}
        {smartPrompts.length > 0 && (
          <div className="flex justify-end mb-2">
          <button
              onClick={() => {
                setIsRegenerating(true);
                const regenerated = [...allPromptSuggestions].sort(() => 0.5 - Math.random());
                setSmartPrompts(regenerated.slice(0, 3));
                localStorage.setItem('smart_prompts', JSON.stringify(regenerated.slice(0, 3)));
                setTimeout(() => setIsRegenerating(false), 600);
              }}
              className="text-xs text-blue-600 hover:underline"
            >
              {isRegenerating ? "🔄 Regenerating..." : "↻ Regenerate Suggestions"}
            </button>
          </div>
        )}

        {/* Suggestion Prompts */}
        {smartPrompts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {smartPrompts.map((prompt, i) => {
              const icon = prompt.toLowerCase().includes('project') ? '🛠️' :
                           prompt.toLowerCase().includes('skill') ? '💡' :
                           prompt.toLowerCase().includes('experience') ? '📁' :
                           prompt.toLowerCase().includes('ai') ? '🤖' :
                           '💬';

              const tagColor = prompt.toLowerCase().includes('project') ? 'bg-orange-100 text-orange-800' :
                               prompt.toLowerCase().includes('skill') ? 'bg-green-100 text-green-800' :
                               prompt.toLowerCase().includes('experience') ? 'bg-purple-100 text-purple-800' :
                               prompt.toLowerCase().includes('ai') ? 'bg-blue-100 text-blue-800' :
                               'bg-gray-100 text-gray-800';

              return (
                <button
                  key={i}
                  onClick={() => handlePromptClick(prompt)}
                  className="border border-blue-200 hover:bg-blue-50 text-sm text-blue-800 px-4 py-3 rounded-xl shadow-sm text-left transition duration-300 ease-in-out transform hover:-translate-y-1 flex justify-between items-center gap-2"
                >
                  <span className="flex-1">{prompt}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tagColor}`}>
                    {icon}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Chat messages */}
        <div className="space-y-4 mb-4 max-h-[65vh] overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
              <div className="rounded-xl p-3">
                <div className={`px-5 py-3 rounded-xl text-sm shadow-lg max-w-[80%] transition-all duration-300 ${
                  msg.from === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black'
                }`}>
                  <div className="prose prose-sm max-w-full">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="leading-relaxed mb-2">{children}</p>,
                      strong: ({ children }) => <strong className="text-blue-800">{children}</strong>,
                      em: ({ children }) => <em className="text-gray-600">{children}</em>
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-xl p-3">
                <div className="px-4 py-2 rounded-xl max-w-xs bg-gray-200 text-black animate-pulse">
                  Typing...
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef}></div>
        </div>

        {/* Sticky input with Send + Mic */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-4 px-6 shadow-lg z-50">
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            {/* Mic icon with voice-to-text (placeholder) */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleVoiceInput}
                className="text-xl px-3 py-2 rounded-full hover:bg-gray-100 transition"
                title="Voice input"
              >
                🎤
              </button>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1 bg-white shadow"
              >
                <option value="en-US">🇺🇸 English</option>
                <option value="hi-IN">🇮🇳 Hindi</option>
                <option value="es-ES">🇪🇸 Spanish</option>
                <option value="fr-FR">🇫🇷 French</option>
              </select>
            </div>

            {/* Text input */}
            <input
              type="text"
              placeholder="Ask me something..."
              onKeyDown={handleInputKeyDown}
              className="flex-1 border border-gray-300 rounded-full px-5 py-3 text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            {/* Send button */}
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow transition"
              onClick={() => {
                const input = document.querySelector<HTMLInputElement>('input[type="text"]');
                if (input?.value.trim()) {
                  handleUserMessage(input.value.trim());
                  input.value = '';
                }
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
