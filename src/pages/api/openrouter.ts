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
  console.log("Estimated token input length:", message.length + (resumeData?.length || 0));

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

  const preferredModel = model || 'meta-llama/llama-3-70b-instruct';
  const fallbackModel = 'mistralai/mistral-7b-instruct';

  let response, raw, data;
  try {
    const limitedResume = resumeData && resumeData.length > 1500 
      ? resumeData.slice(0, 1500) + '...[truncated]' 
      : resumeData;

    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: preferredModel,
          max_tokens: 1000,
          temperature: 0.7,
          messages: [
            { role: 'system', content: limitedResume || 'Default prompt' },
            { role: 'user', content: message }
          ],
        }),
        signal: controller.signal,
      });

      raw = await response.text();
      if (!response.ok) throw new Error(raw);
      data = JSON.parse(raw);
    } catch (err) {
      console.warn('Primary model failed, retrying with fallback...');
      const fallbackRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: fallbackModel,
          max_tokens: 1000,
          temperature: 0.7,
          messages: [
            { role: 'system', content: limitedResume || 'Default prompt' },
            { role: 'user', content: message }
          ],
        }),
        signal: controller.signal,
      });

      raw = await fallbackRes.text();
      if (!fallbackRes.ok) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(fallbackRes.status).json({
          success: true,
          text: "⚠️ LLM access is currently limited. Would you like to download Rajat’s resume instead?",
          usage: null
        });
      }

      data = JSON.parse(raw);
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