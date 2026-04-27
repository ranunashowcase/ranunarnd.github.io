export const dynamic = 'force-dynamic';
export const maxDuration = 10;

import { NextResponse } from 'next/server';
import { generateGroqCompletion } from '@/lib/groq-service';
import { getSheetData } from '@/lib/sheets-service';

export async function POST(request: Request) {
  try {
    const { products } = await request.json();

    if (!products || products.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada data produk' }, { status: 400 });
    }

    // ====================================================
    // Fetch additional context in parallel
    // ====================================================
    const [marketWatchResult, rndResult] = await Promise.allSettled([
      getSheetData<Record<string, string>>('MARKET WATCH'),
      getSheetData<Record<string, string>>('RND ON PROGRESS'),
    ]);

    // Build market watch context
    let marketContext = '';
    if (marketWatchResult.status === 'fulfilled' && marketWatchResult.value.length > 0) {
      const recentWatch = marketWatchResult.value.slice(-5);
      marketContext = recentWatch.map((row) => {
        const nama = row['Nama Ide/Produk'] || row['Nama Produk'] || '';
        const skor = row['AI Layak Skor (1-100)'] || '';
        const tipe = row['Tipe Trend'] || '';
        return `${nama} (${tipe}, skor: ${skor})`;
      }).filter(n => n.length > 10).join(', ');
    }

    // Build R&D context
    let rndContext = '';
    if (rndResult.status === 'fulfilled' && rndResult.value.length > 0) {
      rndContext = rndResult.value.slice(0, 5).map((row) => {
        return `${row.nama_produk} [${row.kategori}] — ${row.fase_development}`;
      }).filter(Boolean).join(', ');
    }

    // Limit to top 20 products to avoid huge payloads
    const topProducts = products.slice(0, 20).map((p: any) => ({
      nama: p.nama_barang,
      terjual: p.total_qty,
      tren_harian: p.daily_data && p.daily_data.length >= 2 
        ? (p.daily_data[p.daily_data.length-1].qty >= p.daily_data[0].qty ? 'Naik' : 'Turun') 
        : 'Stabil'
    }));

    const systemPrompt = `Anda adalah AI Sales Analyst EKSKLUSIF PT. Shalee Berkah Jaya (Fokus: Natural & Healthy Food — kurma, kacang, trail mix, madu, ekstrak, cokelat).

TUGAS: Merangkum laporan penjualan berdasarkan DATA AKTUAL perusahaan dalam 2-3 paragraf ringkas namun STRATEGIS.

=== KONTEKS TAMBAHAN ===
${marketContext ? `Trend kompetitor terbaru: ${marketContext}` : 'Belum ada data market watch.'}
${rndContext ? `Produk sedang dikembangkan: ${rndContext}` : 'Belum ada produk R&D.'}
=== AKHIR KONTEKS ===

PANDUAN:
1. Identifikasi produk PALING BERSINAR dari data penjualan — sebutkan NAMA PRODUK spesifik dan angka penjualannya.
2. Identifikasi produk yang MENURUN atau STAGNAN — berikan alasan kemungkinan.
3. Bandingkan performa penjualan dengan trend market watch — apakah ada peluang yang belum digarap.
4. Jika ada produk R&D yang relevan dengan produk laris, sebutkan sebagai peluang cross-selling.
5. Berikan 1-2 rekomendasi marketing yang ACTIONABLE dan SPESIFIK (misal: "Bundling produk X + Y untuk meningkatkan average order value").

Gunakan bahasa Indonesia bernada proaktif dan profesional. JANGAN pakai markdown code block JSON — langsung teks paragraf report saja.`;

    const userPrompt = `Data top 20 penjualan perusahaan saat ini:\n${JSON.stringify(topProducts, null, 2)}`;

    const analisis = await generateGroqCompletion(userPrompt, systemPrompt);

    return NextResponse.json({ success: true, analisis });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menganalisis penjualan' },
      { status: 500 }
    );
  }
}
