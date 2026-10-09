import fs from 'fs';
import path from 'path';

/**
 * FAST AI CONFIGURATION
 * Primary model is the lightest, fastest tier.
 */
export const FAST_MODEL = 'gemini-3.5-flash-lite';
export const FALLBACK_MODELS = ['gemini-flash-lite-latest', 'gemini-3.8-flash'];

/**
 * Load environment variables from .env if present
 */
function loadEnvFile() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  } catch (err) {
    console.warn('[StudyPilot Server] Could not read .env file:', err.message);
  }
}

loadEnvFile();

/**
 * Helper to parse raw request body
 */
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const MAX_SIZE = 12 * 1024 * 1024; // 12 MB limit

    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_SIZE) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      } catch (e) {
        reject(e);
      }
    });

    req.on('error', reject);
  });
}

/**
 * Call Server LLM using configured fast model tier
 */
async function callServerLLM(systemPrompt, userPrompt, jsonMode = true, maxTokens = 1200) {
  loadEnvFile();
  const apiKey = (process.env.AI_API_KEY || process.env.GEMINI_API_KEY)?.trim();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey && !openAiKey && !anthropicKey) {
    throw new Error('NO_API_KEY');
  }

  // 1. FAST PRIMARY PROVIDER
  if (apiKey) {
    const modelsToTry = [FAST_MODEL, ...FALLBACK_MODELS];
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const bodyPayload = {
          contents: [
            {
              parts: [{ text: `${systemPrompt}\n\nUser Request:\n${userPrompt}` }]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: maxTokens,
            responseMimeType: jsonMode ? 'application/json' : 'text/plain'
          }
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload)
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`AI API error (${res.status}): ${errBody.slice(0, 150)}`);
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) return text;
      } catch (err) {
        lastError = err;
        console.warn(`[StudyPilot Server] Model ${model} retry note:`, err.message);
      }
    }
    throw lastError || new Error('AI API call failed');
  }

  // 2. OPENAI FALLBACK
  if (openAiKey) {
    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.3
    };
    if (jsonMode) payload.response_format = { type: 'json_object' };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`AI Provider error (${res.status}): ${errBody.slice(0, 150)}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || '';
  }

  throw new Error('NO_API_KEY');
}

/**
 * Stream reply token-by-token using Server-Sent Events (SSE)
 */
async function streamServerLLM(systemPrompt, userPrompt, res) {
  loadEnvFile();
  const apiKey = (process.env.AI_API_KEY || process.env.GEMINI_API_KEY)?.trim();

  if (!apiKey) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'NO_API_KEY', message: 'AI API key is not configured.' }));
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const modelsToTry = [FAST_MODEL, ...FALLBACK_MODELS];
  let streamedSuccessfully = false;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;
      const bodyPayload = {
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\nUser Request:\n${userPrompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1200
        }
      };

      const upstreamRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      if (!upstreamRes.ok || !upstreamRes.body) {
        continue;
      }

      const reader = upstreamRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              const chunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (chunk) {
                res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
                streamedSuccessfully = true;
              }
            } catch {}
          }
        }
      }

      if (streamedSuccessfully) {
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
    } catch (err) {
      console.warn(`[StudyPilot Stream] Model ${model} stream error:`, err.message);
    }
  }

  // Fallback to single fast non-streaming call if SSE upstream failed
  try {
    const fullText = await callServerLLM(systemPrompt, userPrompt, false, 800);
    res.write(`data: ${JSON.stringify({ text: fullText })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (fallbackErr) {
    res.write(`data: ${JSON.stringify({ error: fallbackErr.message })}\n\n`);
    res.end();
  }
}

/**
 * Safe JSON parser with single automatic retry
 */
async function parseJsonWithRetry(rawText, systemPrompt, userPrompt) {
  try {
    const cleaned = rawText.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    const fixPrompt = `You returned invalid JSON. Please fix it and return ONLY valid, raw JSON.\n\nInvalid Output was:\n${rawText.slice(0, 500)}`;
    const retryText = await callServerLLM(systemPrompt, fixPrompt, true, 1200);
    const cleanedRetry = retryText.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleanedRetry);
  }
}

/**
 * Core Request Handler for both Serverless & Node middleware
 */
export async function handleAiRequest(req, res) {
  // Status Check
  if (req.method === 'GET' && (req.url === '/api/status' || req.url?.endsWith('/status'))) {
    loadEnvFile();
    const hasKey = !!(process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', hasKey, model: FAST_MODEL }));
    return true;
  }

  // =====================================================================
  // UNIFIED ROUTE: /api/ai (also supports legacy /api/generate & /api/tutor)
  // =====================================================================
  const url = req.url || '';
  const isAiRoute = url === '/api/ai' || url.startsWith('/api/ai?') ||
                    url === '/api/generate' || url.startsWith('/api/generate?') ||
                    url === '/api/tutor' || url.startsWith('/api/tutor?') ||
                    url.includes('/functions/ai') || url.includes('/api/');

  if (req.method === 'POST' && isAiRoute) {
    try {
      let body = {};
      if (req.body && typeof req.body === 'object') {
        body = req.body;
      } else if (req.body && typeof req.body === 'string') {
        try { body = JSON.parse(req.body); } catch {}
      } else {
        const rawBuffer = await getRequestBody(req);
        try { body = JSON.parse(rawBuffer.toString('utf8') || '{}'); } catch {}
      }

      const action = body.action || body.type || (url.includes('/tutor') ? 'tutor' : 'quiz');
      const subject = body.subject || 'Engineering';

      // 1. STREAMING TUTOR (SSE)
      if (action === 'tutor' && (body.stream === true || url.includes('stream=true'))) {
        const query = body.query || body.message || 'Help me study.';
        const readinessScore = body.readinessScore ?? 50;
        const weakTopics = Array.isArray(body.weakTopics) ? body.weakTopics : [];
        const notesContext = body.notesContext || body.pdfContext || '';
        const history = Array.isArray(body.history) ? body.history : [];
        const activeNoteName = body.activeNoteName || '';

        const historyFormatted = history.slice(-5).map(h => `${h.role === 'user' ? 'Student' : 'Tutor'}: ${h.text}`).join('\n');

        const systemPrompt = `You are StudyPilot AI Exam Coach for "${subject}".
Student Exam Readiness: ${readinessScore}%.
Identified Weak Topics: ${weakTopics.length > 0 ? weakTopics.slice(0, 3).join(', ') : 'None yet'}.
${activeNoteName ? `ACTIVE NOTE FILE: "${activeNoteName}"` : ''}
${notesContext ? `RELEVANT EXCERPTS FROM STUDENT'S NOTES:\n"""\n${notesContext.slice(0, 2500)}\n"""\n` : ''}

Rules:
1. If the student asks about concepts in the notes, explain using the excerpts and cite the note name.
2. If the question is general or not in the notes, answer clearly using fundamental principles of "${subject}".
3. Keep answers concise, high-yield, formatted in readable Markdown, under 200 words.`;

        const userPrompt = `${historyFormatted ? `Recent Chat:\n${historyFormatted}\n\n` : ''}Student Query: ${query}`;
        await streamServerLLM(systemPrompt, userPrompt, res);
        return true;
      }

      // 2. NON-STREAMING TUTOR
      if (action === 'tutor') {
        const query = body.query || body.message || 'Help me study.';
        const readinessScore = body.readinessScore ?? 50;
        const weakTopics = Array.isArray(body.weakTopics) ? body.weakTopics : [];
        const notesContext = body.notesContext || body.pdfContext || '';
        const history = Array.isArray(body.history) ? body.history : [];

        const systemPrompt = `You are StudyPilot AI Exam Coach for "${subject}".
Student Readiness: ${readinessScore}%. Weak Topics: ${weakTopics.slice(0, 3).join(', ') || 'None yet'}.
${notesContext ? `RELEVANT EXCERPTS FROM STUDENT NOTES:\n"""\n${notesContext.slice(0, 2500)}\n"""\n` : ''}
Explain clearly and concisely in under 200 words.`;

        const userPrompt = `Student Query: ${query}`;
        const reply = await callServerLLM(systemPrompt, userPrompt, false, 800);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, mode: 'AI', reply: reply.trim() }));
        return true;
      }

      // 3. FAST QUIZ GENERATION (Default 5 Questions, Compact JSON)
      if (action === 'quiz') {
        const count = Math.max(3, Math.min(10, Number(body.count) || 5));
        const topicName = typeof body.topic === 'object' ? body.topic.name : (body.topic || 'Core Concepts');
        const difficulty = body.difficulty || 'Medium';

        const systemPrompt = `Create exactly ${count} multiple choice questions for ${subject} - topic "${topicName}". Difficulty: ${difficulty}.
Respond strictly with compact JSON:
{
  "questions": [
    {
      "stem": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Concise 1-sentence explanation.",
      "topic": "${topicName}",
      "difficulty": "${difficulty}"
    }
  ]
}`;

        const userPrompt = `Generate ${count} ${difficulty} MCQs on "${topicName}".`;
        const rawText = await callServerLLM(systemPrompt, userPrompt, true, 1200);
        const parsed = await parseJsonWithRetry(rawText, systemPrompt, userPrompt);
        const qList = parsed.questions || parsed;

        const sanitized = (Array.isArray(qList) ? qList : []).slice(0, count).map((q, idx) => ({
          id: `q-${Date.now()}-${idx}`,
          topicId: typeof body.topic === 'object' ? body.topic.id : 'top-1',
          topicName: q.topic || topicName,
          concept: q.concept || topicName,
          difficulty: q.difficulty || difficulty,
          stem: q.stem || 'Question',
          options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer < 4 ? q.correctAnswer : 0,
          explanation: q.explanation || 'Review the core concept rule.'
        }));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, mode: 'AI', questions: sanitized }));
        return true;
      }

      // 4. SUMMARY GENERATION
      if (action === 'summary' || action === 'notes') {
        const topicName = body.topicName || body.topic || 'High-Yield Notes';
        const textContent = (body.text || body.content || '').slice(0, 10000);

        const systemPrompt = `You are an elite technical author in ${subject}.
Generate a concise, high-yield revision summary in clean Markdown for "${topicName}".
Include:
## 1. Core Principles & Intuition
## 2. Key Architecture & Trade-offs
## 3. High-Yield Exam Takeaways
Keep it structured, under 400 words.`;

        const userPrompt = textContent 
          ? `Summarize these study notes:\n\n${textContent}`
          : `Generate concise high-yield notes for "${topicName}".`;

        const rawText = await callServerLLM(systemPrompt, userPrompt, false, 900);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, mode: 'AI', text: rawText.trim() }));
        return true;
      }

      // 5. FLASHCARDS GENERATION
      if (action === 'flashcards' || action === 'cards') {
        const count = Math.max(5, Math.min(25, Number(body.count) || 15));
        const topicName = body.topic || 'Core Notes';
        const textContent = (body.text || '').slice(0, 12000);

        const systemPrompt = `Create exactly ${count} active-recall study flashcards for ${subject}.
Respond strictly with valid JSON:
{
  "cards": [
    {
      "front": "Term or Question?",
      "back": "Clear, concise answer and explanation.",
      "topic": "${topicName}"
    }
  ]
}`;

        const userPrompt = `Generate ${count} flashcards from this text:\n\n${textContent}`;
        const rawText = await callServerLLM(systemPrompt, userPrompt, true, 1400);
        const parsed = await parseJsonWithRetry(rawText, systemPrompt, userPrompt);
        const cards = (parsed.cards || parsed).map((c, i) => ({
          id: `card-${Date.now()}-${i}`,
          front: c.front,
          back: c.back,
          topic: c.topic || topicName,
          concept: c.concept || topicName,
          mastered: false,
          createdAt: new Date().toISOString()
        }));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, cards }));
        return true;
      }

      // 6. EXPLANATION GENERATION
      if (action === 'explanation') {
        const { questionStem, options, selectedAnswer, correctAnswer, style = 'simple' } = body;
        const correctText = options?.[correctAnswer] || 'Correct Option';
        const selectedText = selectedAnswer !== null && selectedAnswer !== undefined ? options?.[selectedAnswer] : 'Selected Option';

        const systemPrompt = `Explain simply why "${correctText}" is correct and why "${selectedText}" is incorrect for: "${questionStem}". Style: ${style}. Under 100 words.`;
        const reply = await callServerLLM(systemPrompt, 'Provide the explanation.', false, 400);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, mode: 'AI', text: reply.trim() }));
        return true;
      }

      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'UNKNOWN_ACTION', message: `Unknown action: ${action}` }));
      return true;
    } catch (err) {
      console.error('[StudyPilot Server] /api/ai error:', err.message);
      const status = err.message === 'NO_API_KEY' ? 401 : 500;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: err.message,
        message: err.message === 'NO_API_KEY'
          ? 'AI API key is not configured in .env. Please set AI_API_KEY or GEMINI_API_KEY.'
          : err.message
      }));
      return true;
    }
  }

  return false;
}

/**
 * Vite Server Plugin
 */
export function studyPilotApiPlugin() {
  return {
    name: 'studypilot-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handleAiRequest(req, res);
        if (!handled) next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handleAiRequest(req, res);
        if (!handled) next();
      });
    }
  };
}
