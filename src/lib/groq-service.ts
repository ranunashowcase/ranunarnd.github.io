import Groq from 'groq-sdk';

// Initialize Groq client
// It will automatically use the GROQ_API_KEY environment variable.
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy_key',
});

/**
 * Helper function to generate an ai response using mixtral or llama
 */
export async function generateGroqCompletion(prompt: string, systemMessage?: string) {
  try {
    const messages: any[] = [];
    
    if (systemMessage) {
      messages.push({ role: 'system', content: systemMessage });
    }
    
    messages.push({ role: 'user', content: prompt });

    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile', // Upgraded for high reasoning accuracy
      temperature: 0.3, // Lower temp for more precision, less hallucination
      max_tokens: 1024,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq Service Error:', error);
    throw new Error('Gagal menghubungi AI Server');
  }
}

/**
 * Helper function for high-reasoning tasks.
 * Uses a tiered fallback strategy optimized for Vercel serverless:
 * 1. Try llama-3.3-70b-versatile (fast, reliable, good reasoning)
 * 2. Fallback to llama-3.1-8b-instant (ultra-fast) if 70b fails
 * 
 * Note: openai/gpt-oss-120b was removed because it's too slow for
 * Vercel serverless timeouts and frequently hits Groq TPM rate limits.
 */
export async function generateDeepThinkingCompletion(prompt: string, systemMessage?: string) {
  const messages: any[] = [];
  
  if (systemMessage) {
    messages.push({ role: 'system', content: systemMessage });
  }
  
  messages.push({ role: 'user', content: prompt });

  try {
    // Primary: Llama 3.3 70B — excellent reasoning, fast enough for serverless
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.2, // Very low temperature for highly accurate analytical output
      max_tokens: 1500,
      top_p: 0.9,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq Deep Thinking Error (Trying fallback to Llama 8b):', error);
    
    // Fallback: Llama 3.1 8B Instant — ultra fast, still capable
    try {
      const fallback = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: 0.2,
        max_tokens: 1500,
      });

      return fallback.choices[0]?.message?.content || '';
    } catch (fallbackError) {
      console.error('All Groq models failed:', fallbackError);
      throw new Error('Gagal menghubungi AI Server - semua model tidak tersedia');
    }
  }
}
