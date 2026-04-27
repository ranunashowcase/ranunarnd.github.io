import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Model configuration
const PRIMARY_MODEL = 'gemini-2.0-flash';

/**
 * Generate a comprehensive report using Gemini AI.
 * Gemini has much higher token limits (1M+) compared to Groq,
 * making it ideal for long-form content generation like full reports.
 * 
 * Includes automatic retry with backoff for rate limiting (429).
 */
export async function generateGeminiCompletion(
  prompt: string,
  systemInstruction?: string,
  maxRetries: number = 2
): Promise<string> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({
        model: PRIMARY_MODEL,
        systemInstruction: systemInstruction || undefined,
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 8192,
          topP: 0.9,
        },
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error: any) {
      lastError = error;
      const status = error?.status || error?.code;
      
      // Only retry on rate limit (429) or server errors (5xx)
      if (status === 429 || (status >= 500 && status < 600)) {
        if (attempt < maxRetries) {
          // Wait before retry: 5s, then 15s
          const waitMs = attempt === 0 ? 5000 : 15000;
          console.warn(`Gemini API rate limited (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${waitMs / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, waitMs));
          continue;
        }
      }
      
      // Non-retryable error or max retries exceeded
      break;
    }
  }

  console.error('Gemini API Error (all attempts failed):', lastError);
  throw new Error('Gagal menghubungi Gemini AI Server');
}

/**
 * Safely parse Gemini JSON response.
 * Handles markdown code blocks, comments, trailing commas.
 */
export function safeParseGeminiJson<T = any>(raw: string): T | null {
  try {
    let cleaned = raw;

    // Strip markdown code blocks
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1];
    }

    // Extract JSON object
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
      return null;
    }

    let jsonStr = cleaned.substring(startIdx, endIdx + 1);

    // Remove single-line comments
    jsonStr = jsonStr.replace(/\/\/[^\n]*/g, '');

    // Remove trailing commas
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

    return JSON.parse(jsonStr) as T;
  } catch (err) {
    console.error('safeParseGeminiJson failed:', err);
    return null;
  }
}
