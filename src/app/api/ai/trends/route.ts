export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { generateGroqCompletion } from '@/lib/groq-service';

export async function GET() {
  try {
    const systemPrompt = `You are an expert F&B Market Intelligence and R&D Analyst.
Your goal is to provide a concise, sharp summary (in Indonesian) of the CURRENT top 3 trending food and beverage product concepts globally, and the top 3 in Indonesia. 
Format your response exactly as a JSON object, without any markdown code blocks or additional text.
Example format:
{
  "global_trends": ["Plant-based alternatives with clean labels", "Nootropic energy drinks", "Mushroom infused snacks"],
  "national_trends": ["Minuman sehat rendah gula", "Camilan tradisional gluten-free", "Kopi susu dengan rempah lokal"],
  "key_insight": "Satu kalimat kesimpulan tajam untuk R&D."
}`;

    const userPrompt = "What are the latest F&B market trends today? Please output ONLY the JSON.";

    const resultString = await generateGroqCompletion(userPrompt, systemPrompt);
    
    // Safely parse JSON
    try {
      const startIdx = resultString.indexOf('{');
      const endIdx = resultString.lastIndexOf('}');
      const jsonStr = resultString.substring(startIdx, endIdx + 1);
      const parsed = JSON.parse(jsonStr);

      return NextResponse.json({ success: true, data: parsed });
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', resultString);
      return NextResponse.json({ success: false, error: 'Format AI tidak valid' }, { status: 500 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data AI' }, { status: 500 });
  }
}

