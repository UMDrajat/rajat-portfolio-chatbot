import type { NextApiRequest, NextApiResponse } from 'next';

interface ChatRequest {
  message: string;
  resumeData?: string;
  model?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { message, resumeData, model } = req.body as ChatRequest;

  if (!message) {
    return res.status(400).json({ success: false, error: 'Missing user message.' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ success: false, error: 'API key not found in env.' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

  if (process.env.NODE_ENV === 'development') {
    console.log("Calling OpenRouter with:", { model, message });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'meta-llama/llama-3-70b-instruct',
        messages: [
          { role: 'system', content: resumeData || 'Default prompt' },
          { role: 'user', content: message }
        ],
      }),
      signal: controller.signal,
    });

    const raw = await response.text();

    if (!response.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.error('OpenRouter API error:', raw);
      }
      res.setHeader('Content-Type', 'application/json');
      return res.status(response.status).json({ success: false, error: raw });
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error('Failed to parse JSON:', raw);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ success: false, error: `Invalid JSON: ${raw}` });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ OpenRouter result:', data.choices?.[0]?.message?.content);
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      success: true,
      text: data.choices?.[0]?.message?.content || 'No response',
      usage: data.usage || null
    });
  } catch (error: unknown) {
    res.setHeader('Content-Type', 'application/json');

    if (error instanceof Error) {
      console.error('🔴 OpenRouter Error:', error.message);
      if (error.name === 'AbortError') {
        return res.status(504).json({ success: false, error: 'Request to OpenRouter timed out.' });
      }
      return res.status(500).json({ success: false, error: error.message });
    }

    console.error('🔴 Unknown OpenRouter Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch from OpenRouter' });
  } finally {
    clearTimeout(timeout);
  }
}