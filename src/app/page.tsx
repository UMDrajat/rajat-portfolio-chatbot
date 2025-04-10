'use client'

import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([])
  const [usedPrompts, setUsedPrompts] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [resumeData, setResumeData] = useState<string | null>(null)
  const [smartPrompts, setSmartPrompts] = useState<string[]>([]);
  const [lastTopic, setLastTopic] = useState<string | null>(null);
  const [promptHistory, setPromptHistory] = useState<Set<string>>(new Set());
  const [isRegenerating, setIsRegenerating] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const allPromptSuggestions = [
    "Show me Rajat's resume summary",
    "What are his top skills?",
    "Tell me about one of his projects",
    "Does he have AI/ML experience?"
  ];
  const [promptButtons, setPromptButtons] = useState<string[]>([]);

  const resumeFiles = {
    skills: 'https://drive.google.com/uc?export=download&id=1SAPr8ABcL6P6j5F0_98vBMn873X1HaUr',
    summary: 'https://drive.google.com/uc?export=download&id=1GJGFoy3G4au58lgQSwpMyD-jV-L7YJ_T',
    projects: 'https://drive.google.com/uc?export=download&id=11NzBkRHn4JuKVmaGd4P2nJ7uXq8MYl8x',
    experience: 'https://drive.google.com/uc?export=download&id=1GDM40xtkWR_LRq31zr3DhX6aL3SHdzSi',
    education: 'https://drive.google.com/uc?export=download&id=1zXaaq3CS5a-r8O1qSSiPS_nLSd8cy5l7'
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
      ? `You're Rajat Nirwan’s friendly portfolio assistant. Respond in a clear, conversational, and professional tone—like you're guiding a hiring manager or colleague.

Use this formatting style for all responses:
- Start with a one-line summary (if applicable)
- For **projects**:
  - Highlight Rajat's role, tools used, challenges solved, and outcomes
  - Use bullet points for responsibilities and results
  - Include timelines if available
- For **skills**:
  - Group skills into categories like **Technical**, **Analytical**, **Leadership**
  - Mention where or how the skills were applied (e.g., in which roles or projects)
- Use bullet points with bold categories where appropriate
- Italicize company names, project names, and institutions
- Format for readability: break content into sections, use line breaks
- End with a summary line or insight if possible
- Avoid redundancy; ensure every point adds unique value

Only use the resume data below, and if something isn’t available, kindly say so.\n\nResume:\n${resumeData}`
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

  return (
    <main className="min-h-screen w-full px-8 py-4 flex flex-col items-start justify-between">
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
          <button
            onClick={() => {
              setMessages([{ from: 'bot', text: "👋 Welcome to Rajat Nirwan's Portfolio. How can I help you?" }])
              setUsedPrompts([])
              setLastTopic(null)
              setPromptHistory(new Set())
              localStorage.removeItem('chat_history')
              localStorage.removeItem('smart_prompts')
              const initialPrompts = [...allPromptSuggestions].sort(() => 0.5 - Math.random()).slice(0, 3);
              setSmartPrompts(initialPrompts)
              setPromptButtons(initialPrompts)
              localStorage.setItem('smart_prompts', JSON.stringify(initialPrompts))
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            + New Chat
          </button>
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
            <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="bg-white/70 rounded-xl p-3 shadow-sm">
                <div className={`px-4 py-2 rounded-xl text-sm shadow-sm max-w-[80%] ${
                  msg.from === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black'
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/70 rounded-xl p-3 shadow-sm">
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
            <button
              className="text-xl px-3 py-2 rounded-full hover:bg-gray-100 transition"
              title="Voice input (coming soon)"
            >
              🎤
            </button>

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
