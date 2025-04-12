import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message, resumeData } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'API key not found in env.' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3-70b-instruct',
        messages: [
          { role: 'system', content: resumeData || 'Default prompt' },
          { role: 'user', content: message }
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const raw = await response.text();

    if (!response.ok) {
      console.error('OpenRouter API error:', raw);
      res.setHeader('Content-Type', 'application/json');
      return res.status(response.status).json({ error: raw });
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.error('Failed to parse JSON:', raw);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ error: `Invalid JSON: ${raw}` });
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ result: data.choices?.[0]?.message?.content || 'No response' });
  } catch (error: any) {
    console.error('🔴 OpenRouter Error:', error);
    res.setHeader('Content-Type', 'application/json');
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request to OpenRouter timed out.' });
    }
    return res.status(500).json({ error: 'Failed to fetch from OpenRouter' });
  }
}