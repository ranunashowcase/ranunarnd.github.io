export const dynamic = 'force-dynamic';
export const maxDuration = 10; // Vercel Hobby plan limit

import { NextResponse } from 'next/server';
import { generateGroqCompletion } from '@/lib/groq-service';
import { getSheetData } from '@/lib/sheets-service';

export async function GET() {
  try {
    // ====================================================
    // Fetch ALL context data in PARALLEL for speed
    // ====================================================
    const [infoResult, trendResult, masterSkuResult, salesResult, marketWatchResult] = await Promise.allSettled([
      getSheetData<Record<string, string>>('INPUT INFORMASI'),
      getSheetData<Record<string, string>>('Trending Master'),
      getSheetData<Record<string, string>>('MASTER SKU'),
      getSheetData<Record<string, string | number>>('PEMESANAN PRODUK'),
      getSheetData<Record<string, string>>('MARKET WATCH'),
    ]);

    // ====================================================
    // 1. INPUT INFORMASI context
    // ====================================================
    let infoContext = '';
    if (infoResult.status === 'fulfilled' && infoResult.value.length > 0) {
      const recentInfo = infoResult.value.slice(-3);
      infoContext = recentInfo.map((i) =>
        `[${i.kategori_info || 'Umum'}] ${i.judul}: ${(i.konten || '').substring(0, 250)}`
      ).join('\n');
    }

    // ====================================================
    // 2. Trending Master context
    // ====================================================
    let trendingContext = '';
    if (trendResult.status === 'fulfilled' && trendResult.value.length > 0) {
      trendingContext = trendResult.value.slice(-5).map((t) =>
        `${t.product_name || t.nama_produk}: skor ${t.trend_score || 'N/A'}`
      ).join(', ');
    }

    // ====================================================
    // 3. MASTER SKU — daftar produk perusahaan
    // ====================================================
    let skuContext = '';
    if (masterSkuResult.status === 'fulfilled' && masterSkuResult.value.length > 0) {
      const produkList = masterSkuResult.value.slice(0, 20).map((row) => {
        return row.nama_barang || row['Nama Barang'] || '';
      }).filter(Boolean);
      if (produkList.length > 0) {
        skuContext = `Produk live perusahaan: ${produkList.join(', ')}`;
      }
    }

    // ====================================================
    // 4. PEMESANAN PRODUK — aggregate penjualan top produk
    // ====================================================
    let salesContext = '';
    if (salesResult.status === 'fulfilled' && salesResult.value.length > 0) {
      const salesMap = new Map<string, number>();
      salesResult.value.forEach((row) => {
        const nama = String(row.nama_barang || row['Nama Barang'] || row['Nama Produk'] || '').trim();
        const qtyRaw = String(row.qty || row['Qty'] || row['QTY'] || row['Jumlah'] || '0');
        const qty = parseInt(qtyRaw.replace(/\D/g, ''), 10) || 0;
        if (nama && qty > 0) {
          salesMap.set(nama, (salesMap.get(nama) || 0) + qty);
        }
      });
      const topSales = Array.from(salesMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      if (topSales.length > 0) {
        salesContext = `Top penjualan aktual perusahaan: ${topSales.map(([n, q]) => `${n} (${q} pcs)`).join(', ')}`;
      }
    }

    // ====================================================
    // 5. MARKET WATCH context
    // ====================================================
    let marketWatchContext = '';
    if (marketWatchResult.status === 'fulfilled' && marketWatchResult.value.length > 0) {
      const recentWatch = marketWatchResult.value.slice(-3);
      marketWatchContext = recentWatch.map((row) => {
        const nama = row['Nama Ide/Produk'] || row['Nama Produk'] || '';
        const skor = row['AI Layak Skor (1-100)'] || '';
        return `${nama} (skor: ${skor})`;
      }).filter(n => n !== ' (skor: )').join(', ');
    }

    // ====================================================
    // Build comprehensive prompt with REAL company data
    // ====================================================
    const systemPrompt = `Anda AI Market Intelligence Analyst EKSKLUSIF untuk PT. Shalee Berkah Jaya (Natural & Healthy Food: kurma, kacang, trail mix, madu, dll).

TUGAS: Analisis produk natural & healthy yang TRENDING di marketplace Indonesia (Shopee, Tokopedia, TikTok Shop).
JANGAN tren umum. Berikan NAMA PRODUK SPESIFIK yang bisa dikembangkan perusahaan.

=== DATA INTERNAL PERUSAHAAN ===
${skuContext || 'Belum ada data produk live.'}
${salesContext || 'Belum ada data penjualan.'}
${trendingContext ? `Produk trending tercatat: ${trendingContext}` : ''}
${marketWatchContext ? `Market watch terbaru: ${marketWatchContext}` : ''}
${infoContext ? `Riset terbaru:\n${infoContext}` : ''}
=== AKHIR DATA ===

INSTRUKSI PENTING:
- Rekomendasikan produk yang RELEVAN dengan bisnis perusahaan (natural & healthy food).
- Bandingkan dengan produk yang sudah dijual perusahaan — apakah ada peluang yang belum digarap.
- Jika ada produk yang sudah laris di data penjualan, rekomendasikan varian/ukuran baru.

Format JSON (tanpa markdown code blocks):
{
  "products": [
    {
      "nama_produk": "Nama spesifik produk trending",
      "marketplace": "Shopee/Tokopedia/TikTok Shop",
      "alasan_trending": "1-2 kalimat kenapa trending, hubungkan dengan data perusahaan jika relevan",
      "estimasi_durasi": "3-6 Bulan / Evergreen",
      "rekomendasi": "Worth it / Risky / Saturated",
      "skor_trend": 85
    }
  ],
  "insight_utama": "Insight kunci berdasarkan perbandingan data internal vs trend pasar",
  "rekomendasi_bisnis": "Rekomendasi aksi konkret berdasarkan gap antara portofolio perusahaan dan peluang pasar"
}

Berikan 5 produk. Skor 1-100. RETURN ONLY JSON.`;

    const resultString = await generateGroqCompletion(
      'Analisis produk natural & healthy food trending di marketplace Indonesia berdasarkan data perusahaan dan trend pasar terkini. Output HANYA JSON.',
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
