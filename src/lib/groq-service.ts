import Groq from 'groq-sdk';

// ============================================
// API KEY ROTATION POOL
// Automatically rotates to next key on rate limit (429)
// ============================================

const API_KEYS = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
].filter((key): key is string => !!key && key !== 'dummy_key');

// Track which key to use next (round-robin rotation)
let currentKeyIndex = 0;

// Track cooldown per key (timestamp when it becomes available again)
const keyCooldowns: Map<number, number> = new Map();

/**
 * Get the next available Groq client.
 * Skips keys that are still in cooldown.
 */
function getGroqClient(): { client: Groq; keyIndex: number } {
  const now = Date.now();
  const totalKeys = API_KEYS.length;

  if (totalKeys === 0) {
    // No valid keys — use dummy
    return {
      client: new Groq({ apiKey: 'dummy_key' }),
      keyIndex: -1,
    };
  }

  // Try each key starting from currentKeyIndex
  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const idx = (currentKeyIndex + attempt) % totalKeys;
    const cooldownUntil = keyCooldowns.get(idx) || 0;

    if (now >= cooldownUntil) {
      // This key is available
      return {
        client: new Groq({ apiKey: API_KEYS[idx] }),
        keyIndex: idx,
      };
    }
  }

  // All keys in cooldown — use the one with shortest cooldown
  let bestIdx = 0;
  let shortestWait = Infinity;
  for (let i = 0; i < totalKeys; i++) {
    const wait = (keyCooldowns.get(i) || 0) - now;
    if (wait < shortestWait) {
      shortestWait = wait;
      bestIdx = i;
    }
  }

  return {
    client: new Groq({ apiKey: API_KEYS[bestIdx] }),
    keyIndex: bestIdx,
  };
}

/**
 * Mark a key as rate-limited (60-second cooldown).
 * Advances the rotation to the next key.
 */
function markKeyAsLimited(keyIndex: number) {
  if (keyIndex < 0) return;
  const cooldownMs = 60_000; // 60 seconds
  keyCooldowns.set(keyIndex, Date.now() + cooldownMs);
  currentKeyIndex = (keyIndex + 1) % API_KEYS.length;
  console.log(`[Groq Rotation] Key #${keyIndex + 1} rate-limited. Rotating to Key #${currentKeyIndex + 1}. Pool: ${API_KEYS.length} keys.`);
}

/**
 * Check if an error is a rate limit error.
 */
function isRateLimitError(error: any): boolean {
  const status = error?.status || error?.statusCode || error?.error?.code;
  const message = error?.message || error?.error?.message || '';
  return status === 429 || message.includes('rate_limit') || message.includes('Rate limit');
}

// Legacy export for backward compat (uses first key)
export const groq = new Groq({
  apiKey: API_KEYS[0] || 'dummy_key',
});

// Model configuration — centralized for easy updates
const PRIMARY_MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';

/**
 * Helper function to generate an AI response WITH auto key rotation.
 * Primary: llama-3.3-70b-versatile (best quality)
 * Fallback: llama-3.1-8b-instant (ultra fast)
 * Rotates API keys automatically on rate limits.
 */
export async function generateGroqCompletion(prompt: string, systemMessage?: string) {
  const messages: any[] = [];

  if (systemMessage) {
    messages.push({ role: 'system', content: systemMessage });
  }

  messages.push({ role: 'user', content: prompt });

  // Try each available key
  const totalAttempts = API_KEYS.length > 0 ? API_KEYS.length : 1;

  for (let attempt = 0; attempt < totalAttempts; attempt++) {
    const { client, keyIndex } = getGroqClient();

    try {
      const completion = await client.chat.completions.create({
        messages,
        model: PRIMARY_MODEL,
        temperature: 0.3,
        max_tokens: 2000,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error: any) {
      if (isRateLimitError(error)) {
        markKeyAsLimited(keyIndex);
        continue; // Try next key
      }

      // Non-rate-limit error on primary model — try fallback model with same key
      console.error(`Groq Primary (${PRIMARY_MODEL}) Error on Key #${keyIndex + 1}, trying fallback model:`, error);

      try {
        const fallback = await client.chat.completions.create({
          messages,
          model: FALLBACK_MODEL,
          temperature: 0.3,
          max_tokens: 1500,
        });

        return fallback.choices[0]?.message?.content || '';
      } catch (fallbackError: any) {
        if (isRateLimitError(fallbackError)) {
          markKeyAsLimited(keyIndex);
          continue; // Try next key
        }
        console.error(`Groq Fallback (${FALLBACK_MODEL}) also failed on Key #${keyIndex + 1}:`, fallbackError);
        throw new Error('Gagal menghubungi AI Server');
      }
    }
  }

  throw new Error('Semua API key Groq sedang rate-limited. Coba lagi dalam 1 menit.');
}

/**
 * Helper function for high-reasoning tasks (executive summaries, deep analysis).
 * Uses higher token limit and lower temperature for precision.
 * Also supports auto key rotation.
 */
export async function generateDeepThinkingCompletion(prompt: string, systemMessage?: string) {
  const messages: any[] = [];

  if (systemMessage) {
    messages.push({ role: 'system', content: systemMessage });
  }

  messages.push({ role: 'user', content: prompt });

  const totalAttempts = API_KEYS.length > 0 ? API_KEYS.length : 1;

  for (let attempt = 0; attempt < totalAttempts; attempt++) {
    const { client, keyIndex } = getGroqClient();

    try {
      const completion = await client.chat.completions.create({
        model: PRIMARY_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 3000,
        top_p: 0.9,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error: any) {
      if (isRateLimitError(error)) {
        markKeyAsLimited(keyIndex);
        continue; // Try next key
      }

      console.error(`Deep Thinking Primary (${PRIMARY_MODEL}) Error on Key #${keyIndex + 1}, trying fallback:`, error);

      try {
        const fallback = await client.chat.completions.create({
          model: FALLBACK_MODEL,
          messages,
          temperature: 0.2,
          max_tokens: 2000,
        });

        return fallback.choices[0]?.message?.content || '';
      } catch (fallbackError: any) {
        if (isRateLimitError(fallbackError)) {
          markKeyAsLimited(keyIndex);
          continue; // Try next key
        }
        console.error('All Groq models failed on Key #' + (keyIndex + 1) + ':', fallbackError);
        throw new Error('Gagal menghubungi AI Server - semua model tidak tersedia');
      }
    }
  }

  throw new Error('Semua API key Groq sedang rate-limited. Coba lagi dalam 1 menit.');
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
