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

TUGAS: Berikan analisis trend KOMPREHENSIF yang mencakup:
1. Inovasi dari produk yang SUDAH dimiliki perusahaan (varian baru, ukuran baru, bundling)
2. Produk BARU yang sedang viral di TikTok, Instagram, dan media sosial lainnya
3. Trend PACKAGING UNIK yang sedang ramai (standing pouch kreatif, jar premium, eco-friendly, dll)
4. Trend dari PASAR GLOBAL (Amerika, Eropa, Korea, Jepang) yang bisa diadaptasi ke Indonesia
5. Trend PASAR NASIONAL Indonesia terkini (makanan sehat, superfood, functional food)

=== DATA INTERNAL PERUSAHAAN ===
${skuContext || 'Belum ada data produk live.'}
${salesContext || 'Belum ada data penjualan.'}
${trendingContext ? `Produk trending tercatat: ${trendingContext}` : ''}
${marketWatchContext ? `Market watch terbaru: ${marketWatchContext}` : ''}
${infoContext ? `Riset terbaru:\n${infoContext}` : ''}
=== AKHIR DATA ===

INSTRUKSI PENTING:
- JANGAN hanya rekomendasikan inovasi dari produk yang sudah ada. WAJIB campurkan dengan produk/konsep BARU.
- Komposisi WAJIB: 2 inovasi produk existing + 2 produk baru viral medsos/global + 1 packaging trend + 2 trend pasar nasional/global.
- Untuk produk baru, sebutkan NAMA SPESIFIK dan contoh brand/produk yang sudah ada di pasaran.
- Untuk packaging trend, sebutkan material, bentuk, dan kenapa menarik konsumen.
- Berikan insight yang ACTIONABLE — bukan hanya observasi.

Format JSON (tanpa markdown code blocks):
{
  "products": [
    {
      "nama_produk": "Nama spesifik produk/konsep trending",
      "kategori": "Inovasi Produk Existing / Produk Baru Viral / Packaging Trend / Trend Global / Trend Nasional",
      "marketplace": "TikTok Shop/Shopee/Tokopedia/Instagram/Global Market",
      "alasan_trending": "2-3 kalimat kenapa trending — sertakan data spesifik (views, sales volume, growth) jika memungkinkan",
      "estimasi_durasi": "3-6 Bulan / 1-2 Tahun / Evergreen",
      "rekomendasi": "Worth it / Risky / Saturated",
      "skor_trend": 85
    }
  ],
  "insight_utama": "Insight kunci: gabungan analisis data internal + trend medsos + trend global",
  "rekomendasi_bisnis": "2-3 rekomendasi aksi konkret: produk baru yang harus di-develop, packaging yang harus diadopsi, dan peluang yang harus segera diambil"
}

Berikan 7 produk dengan komposisi seimbang. Skor 1-100. RETURN ONLY JSON.`;

    const resultString = await generateGroqCompletion(
      'Analisis komprehensif: (1) inovasi produk existing, (2) produk baru viral di medsos/TikTok, (3) packaging trend terbaru, (4) trend pasar global dan nasional untuk natural & healthy food. Output HANYA JSON.',
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
