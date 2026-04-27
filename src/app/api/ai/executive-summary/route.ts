export const dynamic = 'force-dynamic';
export const maxDuration = 20;

import { NextResponse } from 'next/server';
import { generateGroqCompletion, safeParseAiJson } from '@/lib/groq-service';
import { getSheetData } from '@/lib/sheets-service';

export async function GET() {
  try {
    // 1. Fetch all important data
    const [sales, sku, rnd, market, info, trends] = await Promise.allSettled([
      getSheetData<any>('PEMESANAN PRODUK'),
      getSheetData<any>('MASTER SKU'),
      getSheetData<any>('RND ON PROGRESS'),
      getSheetData<any>('MARKET WATCH'),
      getSheetData<any>('INPUT INFORMASI'),
      getSheetData<any>('Trending Master'),
    ]);

    const salesData = sales.status === 'fulfilled' ? sales.value : [];
    const skuData = sku.status === 'fulfilled' ? sku.value : [];
    const rndData = rnd.status === 'fulfilled' ? rnd.value : [];
    const marketData = market.status === 'fulfilled' ? market.value : [];
    const infoData = info.status === 'fulfilled' ? info.value : [];

    // Calculate quick stats
    const totalSalesVol = salesData.reduce((acc, curr) => acc + (Number(curr.Qty) || Number(curr.qty) || 0), 0);
    const topSales = [...salesData].sort((a, b) => (Number(b.Qty) || 0) - (Number(a.Qty) || 0)).slice(0, 3);
    const activeRnd = rndData.filter(r => !r.fase_development?.toLowerCase().includes('selesai') && !r.fase_development?.toLowerCase().includes('rilis')).length;
    
    // Prepare concise context for AI
    const dataContext = `
[Statistik Utama]
- Total Produk Live (SKU): ${skuData.length}
- Volume Penjualan Tercatat: ${totalSalesVol} pcs
- Produk R&D On Progress: ${activeRnd} project aktif
- Informasi & Riset Pasar yang dikumpulkan: ${infoData.length} artikel/ide

[Top 3 Produk Penjualan]
${topSales.map(s => `- ${s['Nama Produk'] || s.nama_barang}: ${s.Qty || s.qty} pcs`).join('\n')}

[R&D Terkini (Maks 5)]
${rndData.slice(-5).map(r => `- ${r.nama_produk} (Fase: ${r.fase_development}, Rilis: ${r.target_rilis})`).join('\n')}

[Market Watch Terkini (Maks 3)]
${marketData.slice(-3).map(m => `- ${m['Nama Produk'] || m['Nama Ide/Produk']}`).join('\n')}

[Knowledge Base / Riset Terbaru (Maks 3)]
${infoData.slice(-3).map(i => `- [${i.kategori_info || 'Umum'}] ${i.judul}: ${(i.konten || '').substring(0, 200)}`).join('\n')}
    `;

    const systemPrompt = `Anda adalah seorang Chief Intelligence Officer (CIO) di PT. Shalee Berkah Jaya (FMCG Natural & Healthy Food).
Tugas Anda adalah menulis Laporan Eksekutif (Executive Summary) yang akan dibaca oleh Jajaran Direksi/Atasan.
Laporan ini harus merangkum pencapaian R&D, performa bisnis, dan rekomendasi langkah strategis berdasarkan data yang diberikan.

DATA SAAT INI:
${dataContext}

INSTRUKSI PENULISAN:
- WAJIB berikan rekomendasi strategis berdasarkan tren pasar global & nasional khusus pada industri Natural & Healthy Food.
- Gunakan bahasa bisnis profesional yang elegan, optimis, dan berwibawa.
- Fokus pada "Pencapaian", "Aktivitas Saat Ini", dan "Rekomendasi Strategis".
- Panjang narasi sekitar 3-4 paragraf yang sangat padat informasi (impact-oriented).
- JANGAN menggunakan format markdown seperti tebal (**) atau header (#), cukup plain text dengan paragraf yang jelas.

Format JSON Response HANYA:
{
  "judul": "Judul Laporan Eksekutif (contoh: Laporan Kinerja R&D & Intelligence Market Q3)",
  "narasi_pembuka": "Paragraf pembuka yang menyoroti pencapaian utama dan status bisnis saat ini.",
  "highlight_rnd": "Paragraf kedua yang membahas fokus dan progress tim R&D saat ini.",
  "rekomendasi_strategis": "Paragraf penutup berisi rekomendasi tajam berdasarkan data market dan R&D.",
  "key_metrics": [
    { "label": "Produk Aktif", "value": "15" }, // Ambil dari data
    { "label": "Volume Terjual", "value": "1200" }, // Ambil dari data
    { "label": "Proyek R&D", "value": "4" } // Ambil dari data
  ]
}`;

    let parsedSummary;

    try {
      const resultString = await generateGroqCompletion(
        'Buat Executive Summary berdasarkan data R&D dan penjualan PT Shalee Berkah Jaya. Format HANYA JSON. (KEMBALIKAN RAW JSON TANPA MARKDOWN)',
        systemPrompt
      );

      const parsed = safeParseAiJson(resultString, ['executive_summary', 'summary', 'report']);

      if (parsed) {
        // Ensure safety of properties to prevent frontend crashes
        parsedSummary = {
          judul: parsed.judul || "Laporan Kinerja R&D & Intelligence Market",
          narasi_pembuka: parsed.narasi_pembuka || "Sistem berhasil mengumpulkan data operasional terkini.",
          highlight_rnd: parsed.highlight_rnd || `Saat ini terdapat ${activeRnd} proyek R&D aktif.`,
          rekomendasi_strategis: parsed.rekomendasi_strategis || "Tingkatkan sinergi antara tren pasar dan pipeline R&D.",
          key_metrics: Array.isArray(parsed.key_metrics) ? parsed.key_metrics : [
            { label: "Produk Aktif", value: skuData.length.toString() },
            { label: "Volume Terjual", value: totalSalesVol.toString() },
            { label: "Proyek R&D", value: activeRnd.toString() }
          ]
        };
      } else {
        throw new Error('AI response could not be parsed as JSON');
      }
    } catch (aiError) {
      console.error('Failed to get/parse AI response, using fallback:', aiError);
      parsedSummary = {
        judul: "Laporan Kinerja R&D & Intelligence Market",
        narasi_pembuka: "Sistem berhasil mengumpulkan data operasional terkini. (Catatan: Narasi AI sedang tidak tersedia saat ini, menampilkan data mentah).",
        highlight_rnd: `Saat ini terdapat ${activeRnd} proyek R&D aktif yang sedang dikembangkan oleh tim.`,
        rekomendasi_strategis: "Fokuskan pada percepatan rilis proyek R&D yang mendekati target rilis dan perbanyak pengumpulan tren pasar.",
        key_metrics: [
          { label: "Produk Aktif", value: skuData.length.toString() },
          { label: "Volume Terjual", value: totalSalesVol.toString() },
          { label: "Proyek R&D", value: activeRnd.toString() }
        ]
      };
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        summary: parsedSummary,
        raw_data: {
          salesCount: salesData.length,
          skuCount: skuData.length,
          rndCount: activeRnd,
          totalSalesVol,
          rndList: rndData,
          salesList: salesData
        }
      } 
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil Executive Summary' }, { status: 500 });
  }
}
