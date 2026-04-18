export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { generateGroqCompletion, generateDeepThinkingCompletion } from '@/lib/groq-service';
import { getSheetData } from '@/lib/sheets-service';
import { InputInformation } from '@/types';

export async function GET() {
  try {
    // Fetch INPUT INFORMASI for enriched context
    let infoContext = '';
    try {
      const infoData = await getSheetData<InputInformation>('INPUT INFORMASI');
      if (infoData.length > 0) {
        // Take last 5 entries for context
        const recentInfo = infoData.slice(-5);
        infoContext = `\n\nData riset terbaru yang sudah diinput tim R&D:\n${recentInfo.map((i) =>
          `- [${i.kategori_info}] ${i.judul}: ${i.konten.substring(0, 500)}`
        ).join('\n')}`;
      }
    } catch {
      // No info data yet
    }

    // Fetch Trending Master data for context
    let trendingContext = '';
    try {
      const trendData = await getSheetData<Record<string, string>>('Trending Master');
      if (trendData.length > 0) {
        trendingContext = `\n\nData trending master yang sudah dicatat:\n${trendData.slice(-5).map((t) =>
          `- ${t.product_name || t.nama_produk}: skor ${t.trend_score || 'N/A'}, durasi ${t.estimated_duration || 'N/A'}`
        ).join('\n')}`;
      }
    } catch {
      // No trending data yet
    }

    // PAIRING STAGE 1: Llama-3.1-8b untuk mem-filter dan merangkum raw data
    let distilledContext = '';
    if (infoContext || trendingContext) {
      const summaryPrompt = `Ekstrak dan rangkum data tren pasar mentah berikut menjadi poin-poin wawasan yang tajam untuk industri Natural & Healthy Food:\n${infoContext}\n${trendingContext}`;
      try {
        distilledContext = await generateGroqCompletion(summaryPrompt, "Anda adalah AI Market Summarizer.");
      } catch (err) {
        distilledContext = `${infoContext}\n${trendingContext}`;
      }
    }

    const systemPrompt = `Anda adalah AI Market Intelligence Analyst khusus untuk produk Natural & Healthy Food di Indonesia.
Tugas Anda memberikan analisis SPESIFIK tentang produk natural & healthy yang BENAR-BENAR sedang trending dan bisa ditemukan di marketplace Indonesia (Shopee, Tokopedia, TikTok Shop).

JANGAN berikan tren umum. Berikan NAMA PRODUK SPESIFIK yang bisa dicari di marketplace.
Konteks Riset Terverifikasi:
${distilledContext}

Format response sebagai JSON (tanpa markdown code blocks):
{
  "products": [
    {
      "nama_produk": "Nama produk spesifik yang bisa dicari di marketplace",
      "marketplace": "Shopee/Tokopedia/TikTok Shop",
      "alasan_trending": "Kenapa produk ini trending - 1-2 kalimat",
      "estimasi_durasi": "3-6 Bulan / Evergreen / dll",
      "rekomendasi": "Worth it / Risky / Saturated",
      "skor_trend": 85
    }
  ],
  "insight_utama": "Insight kunci untuk tim R&D dalam 2-3 kalimat",
  "rekomendasi_bisnis": "Rekomendasi aksi bisnis konkret untuk tim R&D"
}

Berikan 5 produk trending. Skor trend dari 1-100. IMPORTANT: RETURN ONLY JSON, DO NOT RETURN ANY THINKING TEXT OR MARKDOWN BLOCKS.`;

    const userPrompt = 'Berikan analisis produk natural & healthy food yang sedang trending di marketplace Indonesia hari ini. Output HANYA JSON.';

    // PAIRING STAGE 2: Deep Thinking untuk analisis tajam dan JSON formatting
    const resultString = await generateDeepThinkingCompletion(userPrompt, systemPrompt);

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

