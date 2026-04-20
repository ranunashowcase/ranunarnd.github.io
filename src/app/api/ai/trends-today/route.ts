export const dynamic = 'force-dynamic';
export const maxDuration = 10; // Vercel Hobby plan limit

import { NextResponse } from 'next/server';
import { generateGroqCompletion } from '@/lib/groq-service';
import { getSheetData } from '@/lib/sheets-service';
import { InputInformation } from '@/types';

export async function GET() {
  try {
    // Fetch context data in PARALLEL for speed
    const [infoResult, trendResult] = await Promise.allSettled([
      getSheetData<InputInformation>('INPUT INFORMASI'),
      getSheetData<Record<string, string>>('Trending Master'),
    ]);

    // Build compact context strings
    let infoContext = '';
    if (infoResult.status === 'fulfilled' && infoResult.value.length > 0) {
      const recentInfo = infoResult.value.slice(-3); // Reduced from 5 to 3 for speed
      infoContext = recentInfo.map((i) =>
        `[${i.kategori_info}] ${i.judul}: ${i.konten.substring(0, 300)}`
      ).join('\n');
    }

    let trendingContext = '';
    if (trendResult.status === 'fulfilled' && trendResult.value.length > 0) {
      trendingContext = trendResult.value.slice(-3).map((t) =>
        `${t.product_name || t.nama_produk}: skor ${t.trend_score || 'N/A'}`
      ).join(', ');
    }

    // SINGLE AI call (no more dual-pairing to avoid timeout)
    const systemPrompt = `Anda AI Market Intelligence Analyst khusus Natural & Healthy Food Indonesia.
Berikan analisis SPESIFIK produk natural & healthy yang TRENDING di marketplace Indonesia (Shopee, Tokopedia, TikTok Shop).
JANGAN tren umum. Berikan NAMA PRODUK SPESIFIK.
${infoContext ? `\nKonteks riset: ${infoContext}` : ''}
${trendingContext ? `\nTrending: ${trendingContext}` : ''}

Format JSON (tanpa markdown code blocks):
{
  "products": [
    {
      "nama_produk": "Nama spesifik",
      "marketplace": "Shopee/Tokopedia/TikTok Shop",
      "alasan_trending": "1-2 kalimat",
      "estimasi_durasi": "3-6 Bulan / Evergreen",
      "rekomendasi": "Worth it / Risky / Saturated",
      "skor_trend": 85
    }
  ],
  "insight_utama": "Insight kunci 1-2 kalimat",
  "rekomendasi_bisnis": "Rekomendasi aksi konkret 1-2 kalimat"
}

Berikan 5 produk. Skor 1-100. RETURN ONLY JSON.`;

    const resultString = await generateGroqCompletion(
      'Analisis produk natural & healthy food trending di marketplace Indonesia. Output HANYA JSON.',
      systemPrompt
    );

    try {
      const startIdx = resultString.indexOf('{');
      const endIdx = resultString.lastIndexOf('}');
      const jsonStr = resultString.substring(startIdx, endIdx + 1);
      const parsed = JSON.parse(jsonStr);
      parsed.updated_at = new Date().toISOString();

      return NextResponse.json({ success: true, data: parsed });
    } catch (parseError) {
      console.error('Failed to parse AI response:', resultString);
      return NextResponse.json(
        { success: false, error: 'Format AI tidak valid' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data AI trend' },
      { status: 500 }
    );
  }
}
