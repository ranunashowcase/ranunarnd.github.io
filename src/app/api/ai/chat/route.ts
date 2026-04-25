export const dynamic = 'force-dynamic';
export const maxDuration = 10; // Vercel Hobby plan limit

import { NextRequest, NextResponse } from 'next/server';
import { generateGroqCompletion } from '@/lib/groq-service';
import { getSheetData } from '@/lib/sheets-service';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ success: false, error: 'Pesan kosong' }, { status: 400 });
    }

    // ====================================================
    // Fetch ALL relevant sheets in PARALLEL for speed
    // ====================================================
    const [
      masterSkuResult,
      salesResult,
      rndResult,
      infoResult,
      marketWatchResult,
    ] = await Promise.allSettled([
      getSheetData<Record<string, string>>('MASTER SKU'),
      getSheetData<Record<string, string | number>>('PEMESANAN PRODUK'),
      getSheetData<Record<string, string>>('RND ON PROGRESS'),
      getSheetData<Record<string, string>>('INPUT INFORMASI'),
      getSheetData<Record<string, string>>('MARKET WATCH'),
    ]);

    // ====================================================
    // 1. Build MASTER SKU context (Produk Live)
    // ====================================================
    let skuContext = '';
    if (masterSkuResult.status === 'fulfilled' && masterSkuResult.value.length > 0) {
      const skuList = masterSkuResult.value.slice(0, 30).map((row) => {
        const nama = row.nama_barang || row['Nama Barang'] || '';
        const sku = row.sku_produk || row['SKU Produk'] || '';
        const barcode = row.barcode_produk || row['Barcode Produk'] || '';
        return `${nama} (SKU: ${sku}, Barcode: ${barcode})`;
      }).filter(s => s.trim() !== ' (SKU: , Barcode: )');
      if (skuList.length > 0) {
        skuContext = `Daftar Produk Live (${skuList.length} produk):\n${skuList.join('\n')}`;
      }
    }

    // ====================================================
    // 2. Build SALES context (Top produk penjualan)
    // ====================================================
    let salesContext = '';
    if (salesResult.status === 'fulfilled' && salesResult.value.length > 0) {
      // Aggregate sales per product
      const salesMap = new Map<string, { nama: string; total: number }>();
      salesResult.value.forEach((row) => {
        const nama = String(row.nama_barang || row['Nama Barang'] || row['Nama Produk'] || '').trim();
        const qtyRaw = String(row.qty || row['Qty'] || row['QTY'] || row['Jumlah'] || '0');
        const qty = parseInt(qtyRaw.replace(/\D/g, ''), 10) || 0;
        if (!nama) return;
        const existing = salesMap.get(nama);
        if (existing) {
          existing.total += qty;
        } else {
          salesMap.set(nama, { nama, total: qty });
        }
      });

      const sorted = Array.from(salesMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 15);

      if (sorted.length > 0) {
        const totalAllSales = sorted.reduce((sum, p) => sum + p.total, 0);
        salesContext = `Data Penjualan (total ${salesResult.value.length} transaksi, ${totalAllSales} pcs terjual):\nTop 15 produk:\n${sorted.map((p, i) => `${i + 1}. ${p.nama}: ${p.total} pcs`).join('\n')}`;
      }
    }

    // ====================================================
    // 3. Build R&D ON PROGRESS context
    // ====================================================
    let rndContext = '';
    if (rndResult.status === 'fulfilled' && rndResult.value.length > 0) {
      const rndList = rndResult.value.slice(0, 10).map((row) => {
        const nama = row.nama_produk || '';
        const fase = row.fase_development || '';
        const kategori = row.kategori || '';
        const target = row.target_rilis || '';
        const lifespan = row.ai_lifespan || '';
        return `- ${nama} [${kategori}] — Fase: ${fase}, Target: ${target}${lifespan ? `, Lifespan: ${lifespan}` : ''}`;
      });
      if (rndList.length > 0) {
        rndContext = `Produk Sedang Dikembangkan (R&D):\n${rndList.join('\n')}`;
      }
    }

    // ====================================================
    // 4. Build INPUT INFORMASI context (Riset terbaru)
    // ====================================================
    let researchContext = '';
    if (infoResult.status === 'fulfilled' && infoResult.value.length > 0) {
      const recentInfo = infoResult.value.slice(-5);
      researchContext = 'Riset & Informasi Terbaru:\n' + recentInfo.map((i) =>
        `[${i.kategori_info || 'Umum'}] ${i.judul}: ${(i.konten || '').substring(0, 300)}`
      ).join('\n');
    }

    // ====================================================
    // 5. Build MARKET WATCH context (Trend kompetitor)
    // ====================================================
    let marketContext = '';
    if (marketWatchResult.status === 'fulfilled' && marketWatchResult.value.length > 0) {
      const recentWatch = marketWatchResult.value.slice(-5);
      const watchList = recentWatch.map((row) => {
        const nama = row['Nama Ide/Produk'] || row['Nama Produk'] || '';
        const tipe = row['Tipe Trend'] || '';
        const skor = row['AI Layak Skor (1-100)'] || '';
        const durasi = row['AI Estimasi Durasi Trend'] || '';
        return `- ${nama} (${tipe}) — Skor AI: ${skor}, Durasi: ${durasi}`;
      });
      if (watchList.length > 0) {
        marketContext = `Market Watch (Trend Kompetitor Terbaru):\n${watchList.join('\n')}`;
      }
    }

    // ====================================================
    // Compose FULL system message with real data
    // ====================================================
    const systemMessage = `Anda adalah "R&D Master AI", asisten AI cerdas eksklusif untuk PT. Shalee Berkah Jaya, perusahaan FMCG yang fokus pada produk Natural & Healthy Food (kurma, kacang, trail mix, madu, dll).

PERAN ANDA:
- Menjawab SELALU berdasarkan DATA INTERNAL perusahaan di bawah ini.
- Jika user bertanya tentang produk, penjualan, atau tren — RUJUK data di bawah, jangan mengarang.
- Jika data tidak tersedia untuk menjawab pertanyaan, katakan secara jujur bahwa datanya belum ada di sistem.
- Berikan jawaban yang cerdas, terstruktur, dan strategis. Bahasa Indonesia, nada proaktif dan profesional.
- Jika ada peluang atau rekomendasi, berikan dengan spesifik dan actionable.

===================== DATA INTERNAL PERUSAHAAN =====================

${skuContext || 'Belum ada data produk live di MASTER SKU.'}

${salesContext || 'Belum ada data penjualan di PEMESANAN PRODUK.'}

${rndContext || 'Belum ada produk sedang dikembangkan di R&D.'}

${researchContext || 'Belum ada data riset/informasi yang diinput.'}

${marketContext || 'Belum ada data market watch/trend kompetitor.'}

===================== AKHIR DATA =====================

PANDUAN MENJAWAB:
1. Jika ditanya "produk paling laris" → jawab berdasarkan data penjualan di atas.
2. Jika ditanya rekomendasi produk baru → analisis gap antara produk live vs trend pasar.
3. Jika ditanya progress R&D → rujuk data produk on progress.
4. Jika ditanya hal di luar data → jawab berdasarkan pengetahuan umum industri F&B, tapi SEBUTKAN bahwa ini bukan dari data internal.
5. JANGAN pernah menyebutkan bahwa Anda membaca "sheet" atau "spreadsheet" — sebut saja "data sistem" atau "data internal".`;

    const reply = await generateGroqCompletion(message, systemMessage);

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghubungi AI' }, { status: 500 });
  }
}
