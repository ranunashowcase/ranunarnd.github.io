export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { generateGroqCompletion, safeParseAiJson } from '@/lib/groq-service';
import { getSheetData } from '@/lib/sheets-service';

export async function GET() {
  try {
    // ====================================================
    // Fetch ALL context data in PARALLEL for speed
    // ====================================================
    const [infoResult, trendResult, masterSkuResult, salesResult, marketWatchResult, rndResult] = await Promise.allSettled([
      getSheetData<Record<string, string>>('INPUT INFORMASI'),
      getSheetData<Record<string, string>>('Trending Master'),
      getSheetData<Record<string, string>>('MASTER SKU'),
      getSheetData<Record<string, string | number>>('PEMESANAN PRODUK'),
      getSheetData<Record<string, string>>('MARKET WATCH'),
      getSheetData<Record<string, string>>('RND ON PROGRESS'),
    ]);

    // ====================================================
    // 1. INPUT INFORMASI context
    // ====================================================
    let infoContext = '';
    if (infoResult.status === 'fulfilled' && infoResult.value.length > 0) {
      const recentInfo = infoResult.value.slice(-5);
      infoContext = recentInfo.map((i) =>
        `[${i.kategori_info || 'Umum'}] ${i.judul}: ${(i.konten || '').substring(0, 400)}`
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
    // 6. RND ON PROGRESS context
    // ====================================================
    let rndContext = '';
    if (rndResult.status === 'fulfilled' && rndResult.value.length > 0) {
      const recentRnd = rndResult.value.slice(0, 5);
      rndContext = recentRnd.map((row) => {
        const nama = row.nama_produk || '';
        const kategori = row.kategori || '';
        const fase = row.fase_development || '';
        return `${nama} (${kategori} - ${fase})`;
      }).filter(n => n.length > 5).join(', ');
    }

    // ====================================================
    // Build comprehensive prompt with REAL company data
    // ====================================================
    const systemPrompt = `Anda AI Market Intelligence Analyst EKSKLUSIF untuk PT. Shalee Berkah Jaya (Natural & Healthy Food: kurma, kacang, trail mix, madu, dll).

TUGAS: Berikan analisis trend KOMPREHENSIF yang SANGAT FOKUS pada PRODUK BARU yang belum dimiliki perusahaan. Jangan hanya memberikan inovasi produk yang sudah ada. 

Fokus Analisis:
1. Produk BARU yang sedang viral di TikTok, Instagram, dan media sosial lainnya
2. Trend dari PASAR GLOBAL (Amerika, Eropa, Korea, Jepang) yang sangat potensial dibawa ke Indonesia
3. Trend PASAR NASIONAL Indonesia terkini (makanan sehat, superfood, functional food)
4. Trend PACKAGING UNIK yang sedang ramai (standing pouch kreatif, jar premium, eco-friendly)
5. (Hanya 1) Inovasi dari produk yang sudah ada

=== DATA INTERNAL PERUSAHAAN (HINDARI REKOMENDASI YANG SAMA PERSIS DENGAN INI) ===
${skuContext || 'Belum ada data produk live.'}
${rndContext ? `Produk on development (R&D): ${rndContext}` : 'Belum ada produk dalam R&D.'}
${salesContext || 'Belum ada data penjualan.'}
${trendingContext ? `Produk trending tercatat: ${trendingContext}` : ''}
${marketWatchContext ? `Market watch terbaru (manual): ${marketWatchContext}` : ''}
${infoContext ? `Riset terbaru:\n${infoContext}` : ''}
=== AKHIR DATA ===

INSTRUKSI PENTING:
- FOKUS UTAMA: Rekomendasikan ide-ide produk BARU yang fresh, unik, dan sedang trending, TAPI masih relevan dengan natural & healthy food.
- Komposisi WAJIB (7 Produk): 4 Produk Baru Viral (Medsos/Global/Nasional) + 2 Packaging Trend Unik + HANYA 1 Inovasi Produk Existing.
- Untuk produk baru, jelaskan secara spesifik NAMA PRODUK-nya dan mengapa itu bisa laku keras.
- Bandingkan dengan data perusahaan: berikan alasan mengapa perusahaan HARUS membuat produk baru ini untuk melengkapi portofolio.

Format JSON (tanpa markdown code blocks):
{
  "products": [
    {
      "nama_produk": "Nama spesifik produk/konsep trending (FOKUS PRODUK BARU)",
      "kategori": "Produk Baru Viral / Trend Global / Trend Nasional / Packaging Trend / Inovasi Existing",
      "marketplace": "TikTok Shop/Shopee/Tokopedia/Instagram/Global Market",
      "alasan_trending": "2-3 kalimat kenapa produk baru ini viral/trending — berikan alasan logis kenapa perusahaan harus membuatnya",
      "estimasi_durasi": "3-6 Bulan / 1-2 Tahun / Evergreen",
      "rekomendasi": "Sangat Direkomendasikan / Worth it / Risky",
      "skor_trend": 85
    }
  ],
  "insight_utama": "Insight kunci: peluang produk baru apa yang paling besar berdasarkan trend market saat ini yang belum digarap perusahaan",
  "rekomendasi_bisnis": "2-3 rekomendasi aksi konkret: produk baru yang harus SEGERA di-develop dan alasan strategisnya"
}

Berikan 7 produk dengan komposisi seperti di atas. Skor 1-100. RETURN ONLY JSON.`;

    const resultString = await generateGroqCompletion(
      'Analisis komprehensif fokus produk baru: (1) ide produk baru viral di medsos, (2) trend pasar global/nasional untuk natural & healthy food, (3) packaging trend terbaru. Output HANYA JSON.',
      systemPrompt
    );

    const parsed = safeParseAiJson(resultString, ['data', 'analysis', 'result']);

    if (parsed && parsed.products) {
      // Ensure products is always an array
      if (!Array.isArray(parsed.products)) parsed.products = [];
      parsed.updated_at = new Date().toISOString();
      return NextResponse.json({ success: true, data: parsed });
    } else {
      console.error('Failed to parse AI response:', resultString);
      return NextResponse.json(
        { success: false, error: 'Format AI tidak valid' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data AI trend' },
      { status: 500 }
    );
  }
}
