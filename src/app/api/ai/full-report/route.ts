export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { generateGeminiCompletion, safeParseGeminiJson } from '@/lib/gemini-service';
import { generateDeepThinkingCompletion, safeParseAiJson } from '@/lib/groq-service';
import { getSheetData } from '@/lib/sheets-service';

interface FullReportData {
  generated_at: string;
  executive_summary: {
    judul_laporan: string;
    periode: string;
    narasi: string;
    key_metrics: { label: string; value: string; trend: string }[];
  };
  sales_analysis: {
    ringkasan: string;
    total_volume: number;
    top_5: {
      rank: number;
      nama_produk: string;
      total_qty: number;
      persentase: string;
      alasan_naik: string;
      inovasi_kedepan: string;
    }[];
  };
  rnd_report: {
    ringkasan: string;
    produk_detail: {
      nama: string;
      kategori: string;
      fase: string;
      target_rilis: string;
      kecepatan_pengerjaan: string;
      potensi_produk: string;
      inovasi_kedepan: string;
    }[];
  };
  trending_recommendations: {
    ringkasan: string;
    produk_trending: {
      nama_produk: string;
      sumber_trend: string;
      alasan: string;
      potensi_untuk_perusahaan: string;
      estimasi_durasi: string;
    }[];
  };
  rnd_movement: {
    narasi_pergerakan: string;
    highlight_kemajuan: string;
    tantangan: string;
  };
  kesimpulan: {
    rangkuman: string;
    rekomendasi_utama: string[];
    catatan_penutup: string;
  };
  raw_data: {
    salesList: any[];
    rndList: any[];
    skuList: any[];
    marketList: any[];
    infoList: any[];
    skuCount: number;
    rndCount: number;
    totalSalesVol: number;
    rndPhaseDistribution: Record<string, number>;
    topSalesAggregated: { name: string; total: number }[];
  };
}

export async function GET() {
  try {
    // ============================================
    // 1. FETCH ALL DATA FROM GOOGLE SHEETS
    // ============================================
    const [salesResult, skuResult, rndResult, marketResult, infoResult, trendingResult] =
      await Promise.allSettled([
        getSheetData<any>('PEMESANAN PRODUK'),
        getSheetData<any>('MASTER SKU'),
        getSheetData<any>('RND ON PROGRESS'),
        getSheetData<any>('MARKET WATCH'),
        getSheetData<any>('INPUT INFORMASI'),
        getSheetData<any>('Trending Master'),
      ]);

    const salesData = salesResult.status === 'fulfilled' ? salesResult.value : [];
    const skuData = skuResult.status === 'fulfilled' ? skuResult.value : [];
    const rndData = rndResult.status === 'fulfilled' ? rndResult.value : [];
    const marketData = marketResult.status === 'fulfilled' ? marketResult.value : [];
    const infoData = infoResult.status === 'fulfilled' ? infoResult.value : [];
    const trendingData = trendingResult.status === 'fulfilled' ? trendingResult.value : [];

    // ============================================
    // 2. AGGREGATE & PROCESS DATA
    // ============================================

    // Sales aggregation
    const salesMap = new Map<string, number>();
    salesData.forEach((row: any) => {
      const nama = String(row.nama_barang || row['Nama Barang'] || row['Nama Produk'] || '').trim();
      const qtyRaw = String(row.qty || row['Qty'] || row['QTY'] || row['Jumlah'] || '0');
      const qty = parseInt(qtyRaw.replace(/\D/g, ''), 10) || 0;
      if (nama && qty > 0) {
        salesMap.set(nama, (salesMap.get(nama) || 0) + qty);
      }
    });

    const topSalesAggregated = Array.from(salesMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);

    const totalSalesVol = topSalesAggregated.reduce((sum, p) => sum + p.total, 0);

    // R&D phase distribution
    const rndPhaseDistribution: Record<string, number> = {};
    rndData.forEach((r: any) => {
      const phase = r.fase_development || 'Belum Ditentukan';
      rndPhaseDistribution[phase] = (rndPhaseDistribution[phase] || 0) + 1;
    });

    const activeRnd = rndData.filter(
      (r: any) =>
        !r.fase_development?.toLowerCase().includes('selesai') &&
        !r.fase_development?.toLowerCase().includes('rilis')
    );

    // ============================================
    // 3. BUILD COMPREHENSIVE AI PROMPT
    // ============================================
    const top5Sales = topSalesAggregated.slice(0, 5);
    const top15Sales = topSalesAggregated.slice(0, 15);

    const dataContext = `
=== STATISTIK UTAMA ===
- Total Produk Live (SKU): ${skuData.length}
- Total Volume Penjualan Tercatat: ${totalSalesVol} pcs
- Total Produk R&D On Progress: ${rndData.length} (${activeRnd.length} aktif)
- Total Riset & Informasi: ${infoData.length} artikel/ide
- Total Market Watch: ${marketData.length} insight
- Total Trending Master: ${trendingData.length} item

=== TOP 5 PRODUK PENJUALAN ===
${top5Sales.map((s, i) => `${i + 1}. ${s.name}: ${s.total} pcs (${totalSalesVol > 0 ? ((s.total / totalSalesVol) * 100).toFixed(1) : 0}% dari total)`).join('\n')}

=== TOP 15 PENJUALAN LENGKAP ===
${top15Sales.map((s, i) => `${i + 1}. ${s.name}: ${s.total} pcs`).join('\n')}

=== SEMUA PRODUK R&D ON PROGRESS ===
${rndData.map((r: any) => `- ${r.nama_produk || 'N/A'} | Kategori: ${r.kategori || 'N/A'} | Fase: ${r.fase_development || 'N/A'} | Target Rilis: ${r.target_rilis || 'N/A'} | Catatan Formulasi: ${r.catatan_formulasi || 'N/A'} | Rangkaian: ${r.rangkaian_produk || 'N/A'} | Ukuran: ${r.ukuran_produk || 'N/A'} | AI Forecast: ${r.ai_forecast || 'N/A'} | AI Lifespan: ${r.ai_lifespan || 'N/A'} | Timestamp: ${r.timestamp || 'N/A'}`).join('\n')}

=== DISTRIBUSI FASE R&D ===
${Object.entries(rndPhaseDistribution).map(([phase, count]) => `- ${phase}: ${count} produk`).join('\n')}

=== DAFTAR PRODUK LIVE (MASTER SKU, maks 30) ===
${skuData.slice(0, 30).map((s: any) => `- ${s.nama_barang || s['Nama Barang'] || 'N/A'} (SKU: ${s.sku_produk || s['SKU Produk'] || 'N/A'})`).join('\n')}

=== MARKET WATCH (Semua) ===
${marketData.map((m: any) => `- ${m['Nama Ide/Produk'] || m['Nama Produk'] || 'N/A'} | Tipe: ${m['Tipe Trend'] || 'N/A'} | Skor AI: ${m['AI Layak Skor (1-100)'] || 'N/A'} | Durasi: ${m['AI Estimasi Durasi Trend'] || 'N/A'} | Rekomendasi: ${m['AI Rekomendasi'] || 'N/A'}`).join('\n')}

=== INPUT INFORMASI / RISET (Semua) ===
${infoData.map((i: any) => `- [${i.kategori_info || 'Umum'}] ${i.judul || 'N/A'}: ${(i.konten || '').substring(0, 500)}`).join('\n')}

=== TRENDING MASTER ===
${trendingData.map((t: any) => `- ${t.product_name || t.nama_produk || 'N/A'} | Skor: ${t.trend_score || 'N/A'} | Durasi: ${t.estimated_duration || 'N/A'}`).join('\n')}
`;

    const today = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const systemInstruction = `Anda adalah seorang Chief Intelligence Officer (CIO) & Head of Research di PT. Shalee Berkah Jaya, perusahaan FMCG yang fokus pada produk Natural & Healthy Food (kurma, kacang, trail mix, madu, ekstrak, cokelat, dll).

TUGAS: Menulis LAPORAN LENGKAP DIVISI R&D yang sangat komprehensif, profesional, dan berbasis data. Laporan ini akan dibaca oleh Jajaran Direksi dan dijadikan referensi strategis pengambilan keputusan.

ATURAN PENULISAN:
- Bahasa Indonesia formal, profesional, dan berwibawa
- Setiap klaim HARUS didukung data dari konteks yang diberikan
- Gunakan angka dan persentase yang presisi
- JANGAN gunakan markdown formatting (**, ##, dll). Gunakan plain text saja.
- Narasi harus mengalir natural seperti laporan Word/PDF formal
- Setiap bagian harus padat informasi (3-5 paragraf) bukan hanya poin singkat
- Analisis harus mendalam, bukan sekedar deskripsi permukaan`;

    const userPrompt = `Tanggal hari ini: ${today}

DATA INTERNAL PERUSAHAAN:
${dataContext}

Berdasarkan SELURUH data di atas dan pengetahuan Anda tentang industri F&B, tren pasar global (Amerika, Eropa, Korea, Jepang) dan nasional Indonesia (TikTok, Shopee, Tokopedia, Instagram), buatlah laporan dalam format JSON berikut.

PENTING: Untuk setiap bagian, tulis narasi yang SANGAT LENGKAP dan MENDALAM (3-5 paragraf per bagian). Jangan hanya menulis ringkasan singkat.

{
  "executive_summary": {
    "judul_laporan": "Laporan Komprehensif Divisi R&D — PT. Shalee Berkah Jaya (periode/kuartal sekarang)",
    "periode": "Periode laporan berdasarkan data yang ada",
    "narasi": "Narasi lengkap 3-4 paragraf mengenai overview keseluruhan kinerja divisi R&D, status bisnis, dan outlook. Sebut angka-angka penting.",
    "key_metrics": [
      {"label": "Total Produk Live", "value": "(angka dari data)", "trend": "naik/turun/stabil"},
      {"label": "Volume Penjualan", "value": "(angka dari data)", "trend": "naik/turun/stabil"},
      {"label": "Proyek R&D Aktif", "value": "(angka dari data)", "trend": "naik/turun/stabil"},
      {"label": "Market Intelligence", "value": "(angka dari data)", "trend": "naik/turun/stabil"}
    ]
  },
  "sales_analysis": {
    "ringkasan": "2-3 paragraf analisis mendalam tentang performa penjualan keseluruhan, tren yang terlihat, dan implikasinya bagi R&D",
    "total_volume": ${totalSalesVol},
    "top_5": [
      {
        "rank": 1,
        "nama_produk": "(nama dari data)",
        "total_qty": (angka dari data),
        "persentase": "(% dari total)",
        "alasan_naik": "2-3 kalimat analisis MENDALAM mengapa produk ini bisa menjadi top seller. Hubungkan dengan tren pasar, kualitas produk, segmen konsumen, dll.",
        "inovasi_kedepan": "2-3 kalimat rekomendasi inovasi spesifik yang bisa dilakukan untuk produk ini. Misal: variant baru, packaging, bundling, dll."
      }
    ]
  },
  "rnd_report": {
    "ringkasan": "2-3 paragraf tentang status keseluruhan pipeline R&D, kecepatan development, dan evaluasi strategis",
    "produk_detail": [
      {
        "nama": "(nama produk R&D dari data)",
        "kategori": "(kategori dari data)",
        "fase": "(fase development dari data)",
        "target_rilis": "(target dari data)",
        "kecepatan_pengerjaan": "Evaluasi 2-3 kalimat tentang seberapa cepat/lambat pengerjaan produk ini relatif terhadap target, apakah on track atau ada delay.",
        "potensi_produk": "Analisis 2-3 kalimat tentang seberapa bagus produk ini untuk menjadi produk baru perusahaan. Lihat dari segi market demand, competitive advantage, dan feasibility.",
        "inovasi_kedepan": "2-3 kalimat rekomendasi inovasi yang bisa dilakukan pada produk ini ke depannya."
      }
    ]
  },
  "trending_recommendations": {
    "ringkasan": "2-3 paragraf tentang landscape tren pasar saat ini dan peluang yang bisa diambil perusahaan",
    "produk_trending": [
      {
        "nama_produk": "Nama produk trending yang BELUM dimiliki perusahaan",
        "sumber_trend": "TikTok/Shopee/Global Market/Instagram/dll",
        "alasan": "3-4 kalimat kenapa produk ini trending dan mengapa perusahaan HARUS mempertimbangkan untuk mengembangkannya",
        "potensi_untuk_perusahaan": "2-3 kalimat analisis spesifik bagaimana produk ini cocok dengan portofolio dan kapabilitas perusahaan",
        "estimasi_durasi": "3-6 Bulan / 1-2 Tahun / Evergreen"
      }
    ]
  },
  "rnd_movement": {
    "narasi_pergerakan": "3-4 paragraf narasi lengkap tentang pergerakan, perkembangan, dan kemajuan divisi R&D secara keseluruhan. Bahas produktivitas, milestone yang dicapai, dan arah strategis ke depan.",
    "highlight_kemajuan": "1-2 paragraf highlight pencapaian terbesar divisi R&D",
    "tantangan": "1-2 paragraf tentang tantangan yang dihadapi dan strategi mengatasinya"
  },
  "kesimpulan": {
    "rangkuman": "2-3 paragraf rangkuman keseluruhan laporan yang menyatukan semua temuan di atas",
    "rekomendasi_utama": ["5 poin rekomendasi strategis utama yang actionable dan spesifik"],
    "catatan_penutup": "1 paragraf closing statement yang memberi outlook positif dan call-to-action"
  }
}

INGAT: Output HANYA JSON tanpa markdown code blocks. Pastikan semua string di-escape dengan benar.`;

    // ============================================
    // 4. CALL AI — Try Gemini first, fallback to Groq
    // ============================================
    let resultString = '';
    let parsed: any = null;
    let aiEngine = 'Gemini';

    try {
      console.log('Attempting Gemini AI for full report...');
      resultString = await generateGeminiCompletion(userPrompt, systemInstruction);
      parsed = safeParseGeminiJson<any>(resultString);
    } catch (geminiError) {
      console.warn('Gemini failed, falling back to Groq:', geminiError);
      aiEngine = 'Groq';
    }

    // Fallback to Groq if Gemini failed or parse failed
    if (!parsed) {
      try {
        console.log('Using Groq AI fallback for full report...');
        aiEngine = 'Groq';
        resultString = await generateDeepThinkingCompletion(
          userPrompt + '\n\nPENTING: Output JSON harus VALID dan LENGKAP. Jangan potong di tengah.',
          systemInstruction
        );
        parsed = safeParseAiJson(resultString);
      } catch (groqError) {
        console.error('Both Gemini and Groq failed:', groqError);
      }
    }

    if (!parsed) {
      console.error('Failed to parse AI response from both engines:', resultString?.substring(0, 500));
      return NextResponse.json(
        { success: false, error: 'Gagal mem-parse respons AI. Coba refresh halaman.' },
        { status: 500 }
      );
    }

    console.log(`Full report generated successfully via ${aiEngine}`);

    // ============================================
    // 5. ASSEMBLE FINAL RESPONSE
    // ============================================
    const reportData: FullReportData = {
      generated_at: new Date().toISOString(),
      executive_summary: parsed.executive_summary || {
        judul_laporan: 'Laporan Divisi R&D',
        periode: today,
        narasi: 'Laporan sedang diproses.',
        key_metrics: [],
      },
      sales_analysis: {
        ...(parsed.sales_analysis || {}),
        total_volume: totalSalesVol,
        top_5: (parsed.sales_analysis?.top_5 || []).map((item: any, idx: number) => ({
          ...item,
          rank: idx + 1,
          total_qty: item.total_qty || top5Sales[idx]?.total || 0,
          nama_produk: item.nama_produk || top5Sales[idx]?.name || 'N/A',
          persentase: item.persentase || (totalSalesVol > 0
            ? ((top5Sales[idx]?.total || 0) / totalSalesVol * 100).toFixed(1) + '%'
            : '0%'),
        })),
      },
      rnd_report: parsed.rnd_report || { ringkasan: '', produk_detail: [] },
      trending_recommendations: parsed.trending_recommendations || { ringkasan: '', produk_trending: [] },
      rnd_movement: parsed.rnd_movement || {
        narasi_pergerakan: '',
        highlight_kemajuan: '',
        tantangan: '',
      },
      kesimpulan: parsed.kesimpulan || {
        rangkuman: '',
        rekomendasi_utama: [],
        catatan_penutup: '',
      },
      raw_data: {
        salesList: salesData,
        rndList: rndData,
        skuList: skuData,
        marketList: marketData,
        infoList: infoData,
        skuCount: skuData.length,
        rndCount: rndData.length,
        totalSalesVol,
        rndPhaseDistribution,
        topSalesAggregated: topSalesAggregated.slice(0, 20),
      },
    };

    return NextResponse.json({ success: true, data: reportData });
  } catch (error) {
    console.error('Full Report API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membuat laporan lengkap. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
