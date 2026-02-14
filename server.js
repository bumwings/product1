const express = require('express');
const path = require('path');
const OpenAI = require('openai').default;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

const SYSTEM_PROMPT = `あなたは入力された日本語の短文の「ポジティブ度」を0〜100の整数で判定するAIです。
返答は必ず次のJSON形式のみとし、他の説明や改行は一切含めないでください。
{"score": N}
N は 0（非常にネガティブ）〜 100（非常にポジティブ）の整数のみ。`;

function parseScoreFromContent(content) {
  if (!content || typeof content !== 'string') return null;
  const trimmed = content.trim();
  const match = trimmed.match(/\{\s*"score"\s*:\s*(\d+)\s*\}/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  if (Number.isNaN(n) || n < 0 || n > 100) return null;
  return n;
}

async function getScoreFromAI(text) {
  if (!client) throw new Error('OPENAI_API_KEY is not set');
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: text || '（未入力）' }
    ],
    max_tokens: 20,
    temperature: 0.3
  });
  const content = completion.choices?.[0]?.message?.content;
  const score = parseScoreFromContent(content);
  if (score !== null) return score;
  return 50;
}

app.post('/score', async (req, res) => {
  let score = 50;
  try {
    const text = typeof req.body?.text === 'string' ? req.body.text : '';
    score = await getScoreFromAI(text);
  } catch (err) {
    console.error('/score error:', err.message);
  }
  res.json({ score });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running at http://localhost:' + PORT);
  if (!OPENAI_API_KEY) console.warn('Warning: OPENAI_API_KEY is not set. /score will always return 50.');
});
