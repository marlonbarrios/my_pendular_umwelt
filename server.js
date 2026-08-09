import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

const app = express();
const port = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Initialize OpenAI client
// dotenv loads VITE_ prefixed vars, but we can also check without prefix
const apiKey = process.env.VITE_OPENAI_KEY || process.env.OPENAI_KEY;
if (!apiKey) {
  console.error('ERROR: VITE_OPENAI_KEY not found in .env file');
  console.error('Please create a .env file with: VITE_OPENAI_KEY=your_api_key_here');
}

const openai = new OpenAI({
  apiKey: apiKey
});

// Proxy endpoint for chat completions
app.post('/api/chat', async (req, res) => {
  try {
    const { model, messages, temperature } = req.body;

    // Check if API key is configured
    if (!apiKey || !openai.apiKey) {
      console.error('API key check failed. apiKey exists:', !!apiKey, 'openai.apiKey exists:', !!openai.apiKey);
      return res.status(500).json({ 
        error: 'OpenAI API key not configured. Please set VITE_OPENAI_KEY in your .env file.' 
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ 
        error: 'Messages array is required and must not be empty' 
      });
    }

    console.log('Making OpenAI API call with model:', model || 'gpt-4o');
    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4o',
      messages: messages,
      temperature: temperature || 1.0
    });

    res.json(completion);
  } catch (error) {
    console.error('OpenAI API error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type
    });
    res.status(error.status || 500).json({ 
      error: error.message || 'An error occurred with the OpenAI API',
      details: error.code || 'unknown_error'
    });
  }
});

// Proxy endpoint for TTS
app.post('/api/tts', async (req, res) => {
  try {
    const { input, voice, model } = req.body;

    if (!openai.apiKey) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured' 
      });
    }

    const mp3 = await openai.audio.speech.create({
      model: model || 'tts-1-hd',
      voice: voice || 'alloy',
      input: input || ''
    });

    // Convert response to buffer and send
    const buffer = Buffer.from(await mp3.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(buffer);
  } catch (error) {
    console.error('OpenAI TTS error:', error);
    res.status(error.status || 500).json({ 
      error: error.message || 'An error occurred with the OpenAI TTS API' 
    });
  }
});

app.listen(port, () => {
  console.log(`Proxy server running on http://localhost:${port}`);
  if (apiKey) {
    console.log(`✓ API key loaded successfully (${apiKey.substring(0, 7)}...)`);
  } else {
    console.error(`✗ ERROR: API key not found! Please set VITE_OPENAI_KEY in your .env file`);
  }
});

