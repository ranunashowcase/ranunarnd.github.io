import { NextResponse } from 'next/server';
import { appendSheetData, initializeSheetHeaders, getCurrentTimestamp } from '@/lib/sheets-service';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nama_produk, kategori, fase_development, target_rilis, catatan_formulasi } = body;

    if (!nama_produk) {
      return NextResponse.json({ success: false, error: 'Nama produk wajib diisi' }, { status: 400 });
    }

    // 1. Prompt Groq for R&D Forecasting
    let aiForecast = 'Analisis Gagal';
    let aiTrendLifespan = 'Tidak diketahui';

    if (process.env.GROQ_API_KEY) {
      const prompt = `Saya dari tim R&D FMCG (Fast Moving Consumer Goods). Saat ini sedang men-develop ide produk berikut:
- Nama Proyek: ${nama_produk}
- Kategori Pasar: ${kategori}
- Fase Saat Ini: ${fase_development}
- Target Rilis: ${target_rilis}
- Catatan Formulasi Akhir: ${catatan_formulasi}

Tolong bantu berikan:
1. Prediksi seberapa kuat tren produk berkategori ${kategori} ini akan bertahan di pasaran FMCG Indonesia hari ini (Hype sementara, Semi-permanen, atau Evergreen).
2. Saran apakah fase ${fase_development} saat ini menuju target ${target_rilis} memiliki resiko terlambat (kehilangan momentum) atau sudah pas.

Jelaskan jawaban secara ringkas maksimal 2 paragraf. Di baris paling bawah, berikan output dengan format persis "LIFESPAN: XX Bulan" atau "LIFESPAN: Evergreen".`;

      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.3,
        });
        
        const content = chatCompletion.choices[0]?.message?.content || '';
        const match = content.match(/LIFESPAN:\s*(.+)/i);
        if (match) {
           aiTrendLifespan = match[1].trim();
        }
        aiForecast = content.replace(/LIFESPAN:\s*.+/i, '').trim();
      } catch (err) {
        console.error('Groq Error:', err);
        aiForecast = 'Gagal mengakses Groq AI. Mohon coba lagi.';
      }
    } else {
        aiForecast = 'Groq API Key tidak ditemukan.';
    }

    // 2. Setup Headers for RND DEVELOPMENT if missing
    await initializeSheetHeaders('RND DEVELOPMENT', [
      'Timestamp',
      'Nama Proyek (R&D)',
      'Kategori',
      'Fase Saat Ini',
      'Target Rilis',
      'Catatan Formulasi',
      'AI Forecast Analyst',
      'AI Predicted Lifespan'
    ]);

    // 3. Append logic
    await appendSheetData('RND DEVELOPMENT', [
      getCurrentTimestamp(),
      nama_produk,
      kategori,
      fase_development,
      target_rilis,
      catatan_formulasi,
      aiForecast,
      aiTrendLifespan
    ]);

    return NextResponse.json({ success: true, message: 'Data R&D saved successfully' });
  } catch (error) {
    console.error('Error adding Development Rnd:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
