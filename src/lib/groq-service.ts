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
 * Helper function for high-reasoning tasks using "openai/gpt-oss-120b"
 */
export async function generateDeepThinkingCompletion(prompt: string, systemMessage?: string) {
  const messages: any[] = [];
  
  if (systemMessage) {
    messages.push({ role: 'system', content: systemMessage });
  }
  
  messages.push({ role: 'user', content: prompt });

  try {

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages,
      temperature: 0.2, // Very low temperature for highly accurate analytical output
      max_completion_tokens: 1500, // Reduced further to prevent frequent Groq TPM rate limits on massive models
      top_p: 0.9,
      // @ts-ignore
      reasoning_effort: 'high',
      stream: false,
    } as any);

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq Deep Thinking Error (Trying fallback to Llama 70b):', error);
    
    // Fallback if GPT-OSS-120B hits rate limit or isn't available
    const fallback = await groq.chat.completions.create({
       model: 'llama-3.3-70b-versatile',
       messages,
       temperature: 0.2,
       max_completion_tokens: 1500,
    } as any);

    return fallback.choices[0]?.message?.content || '';
  }
}
