import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
  
      const data = await response.json();
      return res.status(200).json({ result: data.choices?.[0]?.message?.content || 'No response' });
    } catch (error) {
      console.error('🔴 OpenRouter Error:', error);
      return res.status(500).json({ error: 'Failed to fetch from OpenRouter' });
    }
  }