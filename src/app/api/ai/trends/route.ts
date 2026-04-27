export const dynamic = 'force-dynamic';
export const maxDuration = 20;

import { NextResponse } from 'next/server';
import { generateGroqCompletion, safeParseAiJson } from '@/lib/groq-service';
import { getSheetData } from '@/lib/sheets-service';

export async function GET() {
  try {
    // ====================================================
    // Fetch company data in PARALLEL for context
    // ====================================================
    const [skuResult, infoResult, marketResult, salesResult] = await Promise.allSettled([
      getSheetData<Record<string, string>>('MASTER SKU'),
      getSheetData<Record<string, string>>('INPUT INFORMASI'),
      getSheetData<Record<string, string>>('MARKET WATCH'),
      getSheetData<Record<string, string | number>>('PEMESANAN PRODUK'),
    ]);

    // Build SKU context
    let skuContext = '';
    if (skuResult.status === 'fulfilled' && skuResult.value.length > 0) {
      const names = skuResult.value.slice(0, 20).map(r => r.nama_barang || r['Nama Barang'] || '').filter(Boolean);
      if (names.length > 0) {
        skuContext = `Produk live perusahaan saat ini: ${names.join(', ')}`;
      }
    }

    // Build Input Informasi context (knowledge base)
    let infoContext = '';
    if (infoResult.status === 'fulfilled' && infoResult.value.length > 0) {
      const recentInfo = infoResult.value.slice(-5);
      infoContext = recentInfo.map(i =>
        `[${i.kategori_info || 'Umum'}] ${i.judul}: ${(i.konten || '').substring(0, 300)}`
      ).join('\n');
    }

    // Build Market Watch context
    let marketContext = '';
    if (marketResult.status === 'fulfilled' && marketResult.value.length > 0) {
      const recent = marketResult.value.slice(-5);
      marketContext = recent.map(r => {
        const nama = r['Nama Ide/Produk'] || r['Nama Produk'] || '';
        const skor = r['AI Layak Skor (1-100)'] || '';
        const tipe = r['Tipe Trend'] || '';
        return `${nama} (${tipe}, skor: ${skor})`;
      }).filter(n => n.length > 10).join(', ');
    }

    // Build Sales context (top products)
    let salesContext = '';
    if (salesResult.status === 'fulfilled' && salesResult.value.length > 0) {
      const salesMap = new Map<string, number>();
      salesResult.value.forEach(row => {
        const nama = String(row.nama_barang || row['Nama Barang'] || row['Nama Produk'] || '').trim();
        const qtyRaw = String(row.qty || row['Qty'] || row['QTY'] || '0');
        const qty = parseInt(qtyRaw.replace(/\D/g, ''), 10) || 0;
        if (nama && qty > 0) salesMap.set(nama, (salesMap.get(nama) || 0) + qty);
      });
      const topSales = Array.from(salesMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
      if (topSales.length > 0) {
        salesContext = `Top penjualan: ${topSales.map(([n, q]) => `${n} (${q} pcs)`).join(', ')}`;
      }
    }

    const systemPrompt = `You are an expert F&B Market Intelligence and R&D Analyst for PT. Shalee Berkah Jaya (Natural & Healthy Food FMCG — kurma, kacang, trail mix, madu, dll).

=== DATA INTERNAL PERUSAHAAN ===
${skuContext || 'Belum ada data produk live.'}
${salesContext || 'Belum ada data penjualan.'}
${marketContext ? `Market watch terbaru: ${marketContext}` : ''}
${infoContext ? `Riset & knowledge base terbaru:\n${infoContext}` : ''}
=== AKHIR DATA ===

TUGAS: Berdasarkan pengetahuan Anda tentang tren F&B terkini di dunia dan Indonesia, serta data internal perusahaan di atas, berikan ringkasan trend terkini.
WAJIB: Jadikan data "Riset & knowledge base terbaru" sebagai REFERENSI UTAMA. Data ini adalah hasil riset (PDF/Artikel) yang diunggah khusus oleh admin. Ekstrak insight dan tren dari sana.
PENTING: Fokus HANYA pada lingkup Natural & Healthy Product (kurma, kacang-kacangan, superfood, makanan sehat organik). Jangan bahas makanan/minuman tidak sehat.

INSTRUKSI:
- "global_trends": 3 tren F&B global terkini (Amerika/Eropa/Timur Tengah/Asia) yang RELEVAN dengan natural & healthy food
- "national_trends": 3 tren F&B nasional Indonesia terkini (dari TikTok, Shopee, Tokopedia, perilaku konsumen lokal) yang RELEVAN dengan natural & healthy food
- "key_insight": Satu kalimat strategis yang menghubungkan tren pasar dengan peluang bisnis perusahaan
- Jawab dalam Bahasa Indonesia
- HINDARI merekomendasikan produk yang sudah dimiliki perusahaan

Format JSON (tanpa markdown code blocks):
{
  "global_trends": ["Trend 1 dengan penjelasan singkat", "Trend 2", "Trend 3"],
  "national_trends": ["Trend 1 dengan penjelasan singkat", "Trend 2", "Trend 3"],
  "key_insight": "Satu kalimat tajam untuk R&D."
}`;

    const userPrompt = 'Analisis tren F&B terkini secara global dan nasional. Output HANYA JSON tanpa markdown.';

    const resultString = await generateGroqCompletion(userPrompt, systemPrompt);

    // Safe parse with unwrap
    const parsed = safeParseAiJson(resultString);

    if (parsed && (parsed.global_trends || parsed.national_trends)) {
      return NextResponse.json({ success: true, data: parsed });
    } else {
      console.error('Failed to parse AI response as JSON:', resultString);
      return NextResponse.json({ success: false, error: 'Format AI tidak valid' }, { status: 500 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data AI' }, { status: 500 });
  }
}
