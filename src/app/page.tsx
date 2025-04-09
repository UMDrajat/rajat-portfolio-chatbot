'use client'

import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [resumeData, setResumeData] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const promptButtons = [
    "Show me Rajat's resume summary",
    "What are his top skills?",
    "Tell me about one of his projects",
    "Does he have AI/ML experience?"
  ]

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
    setLoading(true)
    const botReply = await fetchFromOpenRouter(text)
    setMessages((prev) => [...prev, { from: 'user', text }, { from: 'bot', text: botReply }])
    setLoading(false)
  }

  const fetchFromOpenRouter = async (userMessage: string): Promise<string> => {
    const apiKey = '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'
    const systemPrompt = resumeData
      ? `You are Rajat Nirwan’s portfolio chatbot. Only answer based on the resume data provided below. If something is not present in the resume, reply with: "This information is not available in the resume."\n\nResume:\n${resumeData}`
      : `You are Rajat Nirwan’s portfolio chatbot. Resume data is still loading. Please wait.`

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
    <main className="min-h-screen w-full bg-gray-100 px-8 py-10 flex flex-col items-center">
      <div className="w-full h-full min-h-[85vh] bg-white rounded-2xl shadow-xl p-10 border border-gray-200">
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
              setMessages([])
              localStorage.removeItem('chat_history')
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            + New Chat
          </button>
        </div>

        {/* Suggestion Prompts */}
        {messages.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {promptButtons.filter(prompt => !messages.some(msg => msg.text === prompt)).map((prompt, i) => (
              <button
                key={i}
                onClick={() => handlePromptClick(prompt)}
                className="border border-blue-200 hover:bg-blue-50 text-sm text-blue-800 px-4 py-3 rounded-xl shadow-sm text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Chat messages */}
        <div className="space-y-3 mb-4 max-h-[50vh] overflow-y-auto pr-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-4 py-2 rounded-xl text-sm shadow-sm max-w-[80%] ${
                msg.from === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-2 rounded-xl max-w-xs bg-gray-200 text-black animate-pulse">
                Typing...
              </div>
            </div>
          )}
          <div ref={bottomRef}></div>
        </div>

        {/* Input box */}
        <input
          type="text"
          placeholder="Ask me something..."
          onKeyDown={handleInputKeyDown}
          className="w-full border border-gray-300 rounded-full px-5 py-3 text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
    </main>
  )
}
