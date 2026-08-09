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
    const { input, voice, model } = req.body;

    // Get API key from environment variable
    const apiKey = process.env.VITE_OPENAI_KEY || process.env.OPENAI_KEY;
    
    if (!apiKey) {
      console.error('OpenAI API key not configured');
      return res.status(500).json({ 
        error: 'OpenAI API key not configured' 
      });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey
    });

    const mp3 = await openai.audio.speech.create({
      model: model || 'tts-1-hd',
      voice: voice || 'alloy',
      input: input || ''
    });

    // Convert response to buffer and send
    const buffer = Buffer.from(await mp3.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('OpenAI TTS error:', error);
    return res.status(error.status || 500).json({ 
      error: error.message || 'An error occurred with the OpenAI TTS API' 
    });
  }
}

