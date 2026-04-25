import Groq from 'groq-sdk';

// Initialize Groq client
// It will automatically use the GROQ_API_KEY environment variable.
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy_key',
});

// Model configuration — centralized for easy updates
const PRIMARY_MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';

/**
 * Helper function to generate an AI response.
 * Primary: llama-3.3-70b-versatile (best quality)
 * Fallback: llama-3.1-8b-instant (ultra fast)
 */
export async function generateGroqCompletion(prompt: string, systemMessage?: string) {
  const messages: any[] = [];

  if (systemMessage) {
    messages.push({ role: 'system', content: systemMessage });
  }

  messages.push({ role: 'user', content: prompt });

  try {
    const completion = await groq.chat.completions.create({
      messages,
      model: PRIMARY_MODEL,
      temperature: 0.3,
      max_tokens: 2000,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error(`Groq Primary (${PRIMARY_MODEL}) Error, trying fallback:`, error);

    // Fallback to smaller model
    try {
      const fallback = await groq.chat.completions.create({
        messages,
        model: FALLBACK_MODEL,
        temperature: 0.3,
        max_tokens: 1500,
      });

      return fallback.choices[0]?.message?.content || '';
    } catch (fallbackError) {
      console.error(`Groq Fallback (${FALLBACK_MODEL}) also failed:`, fallbackError);
      throw new Error('Gagal menghubungi AI Server');
    }
  }
}

/**
 * Helper function for high-reasoning tasks (executive summaries, deep analysis).
 * Uses higher token limit and lower temperature for precision.
 */
export async function generateDeepThinkingCompletion(prompt: string, systemMessage?: string) {
  const messages: any[] = [];

  if (systemMessage) {
    messages.push({ role: 'system', content: systemMessage });
  }

  messages.push({ role: 'user', content: prompt });

  try {
    const completion = await groq.chat.completions.create({
      model: PRIMARY_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 3000,
      top_p: 0.9,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error(`Deep Thinking Primary (${PRIMARY_MODEL}) Error, trying fallback:`, error);

    try {
      const fallback = await groq.chat.completions.create({
        model: FALLBACK_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 2000,
      });

      return fallback.choices[0]?.message?.content || '';
    } catch (fallbackError) {
      console.error('All Groq models failed:', fallbackError);
      throw new Error('Gagal menghubungi AI Server - semua model tidak tersedia');
    }
  }
}

/**
 * Safely parse AI JSON response.
 * Handles:
 * - Markdown code blocks (```json ... ```)
 * - Nested responses (e.g. { "executive_summary": { ... } })
 * - JavaScript-style comments in JSON
 * - Trailing commas
 */
export function safeParseAiJson<T = any>(raw: string, unwrapKeys?: string[]): T | null {
  try {
    // 1. Strip markdown code blocks if present
    let cleaned = raw;
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1];
    }

    // 2. Extract JSON object
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
      return null;
    }

    let jsonStr = cleaned.substring(startIdx, endIdx + 1);

    // 3. Remove single-line comments (// ...)
    jsonStr = jsonStr.replace(/\/\/[^\n]*/g, '');

    // 4. Remove trailing commas before } or ]
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

    // 5. Parse
    let parsed = JSON.parse(jsonStr);

    // 6. Unwrap nested keys if specified
    if (unwrapKeys) {
      for (const key of unwrapKeys) {
        if (parsed[key] && typeof parsed[key] === 'object') {
          parsed = parsed[key];
          break;
        }
      }
    }

    return parsed as T;
  } catch (err) {
    console.error('safeParseAiJson failed:', err);
    return null;
  }
}
