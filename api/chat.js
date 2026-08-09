import OpenAI from 'openai';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { model, messages, temperature } = req.body;

    // Get API key from environment variable
    const apiKey = process.env.VITE_OPENAI_KEY || process.env.OPENAI_KEY;
    
    if (!apiKey) {
      console.error('OpenAI API key not configured');
      return res.status(500).json({ 
        error: 'OpenAI API key not configured. Please set VITE_OPENAI_KEY in Vercel environment variables.' 
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ 
        error: 'Messages array is required and must not be empty' 
      });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey
    });

    console.log('Making OpenAI API call with model:', model || 'gpt-4o');
    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4o',
      messages: messages,
      temperature: temperature || 1.0
    });

    return res.status(200).json(completion);
  } catch (error) {
    console.error('OpenAI API error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type
    });
    return res.status(error.status || 500).json({ 
      error: error.message || 'An error occurred with the OpenAI API',
      details: error.code || 'unknown_error'
    });
  }
}

