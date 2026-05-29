import { Router } from 'express';
import { authGuard } from '../middlewares/auth.middleware';
import { env } from '../config/env';

export const urentAiRouter = Router();

urentAiRouter.post('/urent-ai/analyze', authGuard, async (req, res) => {
  try {
    const apiKey = env.geminiApiKey;
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        error: { message: 'GEMINI_API_KEY is not configured on the server' } 
      });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Gemini Proxy] Failed to call Gemini API:', errText);
      return res.status(response.status).send(errText);
    }

    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error('[Gemini Proxy] Server error:', error);
    return res.status(500).json({ 
      success: false, 
      error: { message: error.message || 'Internal Server Error' } 
      });
  }
});
