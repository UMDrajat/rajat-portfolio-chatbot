'use client'

import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown';
import SocialLinks from './components/SocialLinks';
const SpeechRecognition = typeof window !== 'undefined'
  ? (window as typeof window & {
      webkitSpeechRecognition?: typeof window.SpeechRecognition;
      SpeechRecognition?: typeof window.SpeechRecognition;
    }).SpeechRecognition || (window as typeof window & { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition
  : undefined;

export default function Home() {
  const [pageLoading, setPageLoading] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);
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
  const isHallucinated = (response: string) =>
    /Rajat.*?(GPT|LLM|Transformer|company that isn't in resume|co-founded.*?(OpenAI|Google))/i.test(response);
  
  const filteredReply = isHallucinated(botReply)
    ? "⚠️ This part of the response seems unrelated to Rajat’s resume. Let’s stick to verified content. Want to ask something else?"
    : botReply;
  
  setMessages((prev) => [...prev, { from: 'bot', text: filteredReply }])
    setLoading(false)
  }

  const fetchFromOpenRouter = async (userMessage: string): Promise<string> => {
  const systemPrompt = resumeData
    ? `You are Rajat Nirwan’s AI assistant. Your ONLY knowledge source is the resume provided below.
 
 ⚠️ Strict Instructions:
 - NEVER guess, fabricate, or assume facts.
 - If information is not in the resume, reply with: "This information isn’t available in the current resume."
 - Do NOT mention technologies, achievements, or roles unless they are in the resume.
 - Avoid repeating phrases like “Rajat has experience with...” unless it's backed by resume content.
 
 📌 Tone: Professional, insightful, concise, and confident. Do NOT be casual, funny, or speculative.
 
 ✅ Output Structure:
 1. One-line summary (contextual or reflective)
 2. 2–3 bullet points with specific skills, metrics, or experience backed by the resume
 3. End with: “Want to explore another part of his background?”
 
 🔒 Resume Data:
 ${resumeData}`
    : `Resume not yet loaded. Please try again shortly.`;

    try {
      const res = await fetch('/api/openrouter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
      body: JSON.stringify({
          message: userMessage,
          resumeData,
          model: "meta-llama/llama-3-70b-instruct",
          max_tokens: 300,
          temperature: 0.2
        })
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
      .dot-flash::after {
        content: '...';
        animation: dots 1s steps(3, end) infinite;
      }
      @keyframes dots {
        0% { content: ''; }
        33% { content: '.'; }
        66% { content: '..'; }
        100% { content: '...'; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  if (pageLoading) {
    return (
      <main className="min-h-screen w-full flex flex-col bg-white">
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-700 animate-pulse">
              👋 Welcome to Rajat Nirwan’s Portfolio...
            </p>
          </div>
        </div>
        <div className="sticky bottom-0 w-full px-8 py-4 bg-white border-t border-gray-200 z-10">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Ask me something..."
              onKeyDown={handleInputKeyDown}
              className="flex-1 border border-gray-300 rounded-full px-5 py-3 text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded-full text-sm font-medium shadow transition"
              onClick={handleVoiceInput}
              title="Use voice input"
            >
              🎙️
            </button>
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
      </main>
    );
  }

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
            <div className="flex justify-start animate-fadeIn">
              <div className="rounded-xl p-3">
                <div className="px-5 py-3 rounded-xl text-sm shadow-lg max-w-[80%] bg-gray-200 text-black">
                  <span className="dot-flash text-gray-600">Typing</span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef}></div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <input
            type="text"
            placeholder="Ask me something..."
            onKeyDown={handleInputKeyDown}
            className="flex-1 border border-gray-300 rounded-full px-5 py-3 text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded-full text-sm font-medium shadow transition"
            onClick={handleVoiceInput}
            title="Use voice input"
          >
            🎙️
          </button>
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
    </main>
  )
}