import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// middleware
app.use(cors());
app.use(express.json());

// ollama API endpoint
const OLLAMA_API = 'http://localhost:11434/api/chat';

// convo history
const conversationHistories = new Map();

// prompt to ollmama
const SYSTEM_PROMPT = `
You are BabyCheck AI. When a user messages you about their baby's health, milestones, or symptoms,
always generate a timeline event if applicable. The timeline event must be in the following JSON format:

TIMELINE_EVENT: {
  "id": "<unique-id>",
  "title": "<short title of event>",
  "description": "<detailed description>",
  "date": "<YYYY-MM-DD HH:mm>",
  "tags": ["tag1","tag2"],
  "severity": "low|medium|high"
}

Only include TIMELINE_EVENT if the message relates to the baby's health or milestones.
Otherwise, just respond normally.
`;


// chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId = 'default', model = 'llama3.2' } = req.body;

    if (!message) return res.status(400).json({ error: 'Message is required' });

    if (!conversationHistories.has(conversationId)) {
      conversationHistories.set(conversationId, [{ role: 'system', content: SYSTEM_PROMPT }]);
    }
    const history = conversationHistories.get(conversationId);

    history.push({ role: 'user', content: message });

    const ollamaResponse = await fetch(OLLAMA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: history, stream: false }),
    });

    if (!ollamaResponse.ok) throw new Error(`Ollama API error: ${ollamaResponse.statusText}`);

    const data = await ollamaResponse.json();
    const aiMessage = data.message.content;

    // extract timeline event
    let timelineEvent = null;
    let cleanedResponse = aiMessage;
    const timelineMatch = aiMessage.match(/TIMELINE_EVENT:\s*(\{[\s\S]*?\})/);
    if (timelineMatch) {
      try {
        timelineEvent = JSON.parse(timelineMatch[1]);
        timelineEvent.id = timelineEvent.id || uuidv4();
        cleanedResponse = aiMessage.replace(/TIMELINE_EVENT:\s*\{[\s\S]*?\}/, '').trim();
      } catch (e) {
        console.error('Failed to parse timeline event:', e);
      }
    }

    history.push({ role: 'assistant', content: cleanedResponse });

    // keep last 20 messages
    if (history.length > 21) history.splice(1, 2);

    res.json({ response: cleanedResponse, conversationId, timelineEvent });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to get response from AI', details: error.message });
  }
});

// clear conversation
app.delete('/api/chat/:conversationId', (req, res) => {
  conversationHistories.delete(req.params.conversationId);
  res.json({ message: 'Conversation history cleared' });
});

// health check
app.get('/api/health', async (req, res) => {
  try {
    const ollamaCheck = await fetch('http://localhost:11434/api/tags');
    res.json({ status: 'ok', ollama: ollamaCheck.ok ? 'connected' : 'disconnected' });
  } catch {
    res.json({ status: 'ok', ollama: 'disconnected' });
  }
});

// models
app.get('/api/models', async (req, res) => {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch models', details: error.message });
  }
});

const buildPath = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(buildPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// start server 
  app.listen(PORT, () => {
  console.log(`🚀 BabyCheck AI Server running on http://localhost:${PORT}`);
  console.log(`📡 Make sure Ollama is running on http://localhost:11434`);
});
