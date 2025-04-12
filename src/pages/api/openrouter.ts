import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, resumeData } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;
  
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not found in env.' });
    }
  
    try {
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
      });

      const text = await response.text();

      if (!response.ok) {
        console.error('OpenRouter API error:', text);
        return res.status(response.status).json({ error: text });
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonError) {
        console.error('Failed to parse JSON:', text);
        return res.status(500).json({ error: `Invalid JSON: ${text}` });
      }

      return res.status(200).json({ result: data.choices?.[0]?.message?.content || 'No response' });
    } catch (error) {
      console.error('🔴 OpenRouter Error:', error);
      return res.status(500).json({ error: 'Failed to fetch from OpenRouter' });
    }
}