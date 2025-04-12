'use client'

import { useState, useEffect, useRef } from 'react';
const SpeechRecognition = typeof window !== 'undefined'
  ? (window as typeof window & {
      webkitSpeechRecognition?: typeof window.SpeechRecognition;
      SpeechRecognition?: typeof window.SpeechRecognition;
    }).SpeechRecognition || (window as typeof window & { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition
  : undefined;

// @ts-expect-error
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

export default function Home() {
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([])
  const [resumeData, setResumeData] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

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
  }, [resumeFiles])

  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages))
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleUserMessage = async (text: string) => {
    setMessages((prev) => [...prev, { from: 'user', text }])
    const botReply = await fetchFromOpenRouter(text)
    setMessages((prev) => [...prev, { from: 'bot', text: botReply }])
  }

  const fetchFromOpenRouter = async (userMessage: string): Promise<string> => {
    try {
      const res = await fetch('/api/openrouter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          resumeData,
          model: "mistralai/mistral-7b-instruct"
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

  return <div>Portfolio Chatbot UI</div>
}
