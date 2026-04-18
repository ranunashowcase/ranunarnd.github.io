export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { appendSheetData, getSheetData, deleteSheetRow, initializeSheetHeaders, getCurrentTimestamp } from '@/lib/sheets-service';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy_key' });

const SHEET_NAME = 'MARKET WATCH';
const HEADERS = [
  'Timestamp',
  'Tipe Trend',
  'Nama Ide/Produk',
  'Ukuran/Gramasi',
  'Harga Referensi',
  'Link Sosial Media',
  'Foto URL',
  'AI Analisis Lengkap',
  'AI Referensi Serupa',
  'AI Estimasi Durasi Trend',
  'AI Resiko',
  'AI Keuntungan',
  'AI Layak Skor (1-100)',
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { foto_url, link_medsos, nama_produk, ukuran_gramasi, tipe_trend, harga_referensi } = body;

    if (!nama_produk) {
      return NextResponse.json({ success: false, error: 'Nama/Item wajib diisi' }, { status: 400 });
    }

    // AI Analysis
    let aiAnalisis = '';
    let aiReferensi = '';
    let aiDurasi = '';
    let aiResiko = '';
    let aiKeuntungan = '';
    let aiScore = 0;

    if (process.env.GROQ_API_KEY) {
      const isPackaging = tipe_trend === 'Trend Packaging Unik';

      const prompt = `Kamu adalah AI riset pasar untuk divisi R&D perusahaan FMCG (makanan & minuman kemasan). User memasukkan ${isPackaging ? 'trend packaging/kemasan unik' : 'trend produk viral'} dari sosial media kompetitor.

DATA INPUT:
- Tipe: ${tipe_trend || 'Trend Produk'}
- Nama: ${nama_produk}
- Ukuran/Gramasi: ${ukuran_gramasi || '-'}
- Harga Referensi Pasar: ${harga_referensi || '-'}
- Link Medsos: ${link_medsos || '-'}

Berikan output LENGKAP dalam format berikut (HARUS mengikuti format persis):

===ANALISIS===
(Berikan analisis mendalam 2-3 paragraf tentang ${isPackaging ? 'kemasan/packaging ini — apakah inovatif, menarik konsumen, meningkatkan perceived value, cocok untuk segmen healthy & natural?' : 'produk trending ini — apakah layak ditiru, bagaimana posisi kompetisi, apakah cocok untuk segmen healthy & natural food?'})

===REFERENSI===
(Berikan 3-5 contoh produk/brand serupa yang sudah ada di pasaran Indonesia. FORMAT WAJIB JSON ARRAY seperti ini, HANYA JSON tanpa teks lain:
[{"nama":"Nama Produk","brand":"Nama Brand","harga":"Rp50.000","deskripsi":"Deskripsi singkat 1 kalimat kenapa relevan"}]
)

===DURASI===
(Estimasi berapa lama trend ini akan bertahan, misal: "3-6 bulan", "1-2 tahun", "trend jangka panjang")

===RESIKO===
(Jelaskan 2-3 resiko utama jika perusahaan mengikuti trend ini)

===KEUNTUNGAN===
(Jelaskan 2-3 keuntungan potensial jika perusahaan mengadopsi trend ini)

===SKOR===
(Berikan angka kelayakan 1-100, hanya angka saja)`;

      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.3,
          max_tokens: 2000,
        });

        const content = chatCompletion.choices[0]?.message?.content || '';

        // Parse structured output
        const getSection = (tag: string) => {
          const regex = new RegExp(`===${tag}===\\s*([\\s\\S]*?)(?====|$)`, 'i');
          const match = content.match(regex);
          return match ? match[1].trim() : '';
        };

        aiAnalisis = getSection('ANALISIS') || content;
        aiReferensi = getSection('REFERENSI');
        aiDurasi = getSection('DURASI');
        aiResiko = getSection('RESIKO');
        aiKeuntungan = getSection('KEUNTUNGAN');

        const skorText = getSection('SKOR');
        const skorMatch = skorText.match(/(\d+)/);
        aiScore = skorMatch ? parseInt(skorMatch[1], 10) : 0;

      } catch (err) {
        console.error('Groq Error:', err);
        aiAnalisis = 'Gagal mengakses Groq AI. Mohon coba lagi.';
      }
    } else {
      aiAnalisis = 'Groq API Key tidak ditemukan.';
    }

    // Save to sheet
    await initializeSheetHeaders(SHEET_NAME, HEADERS);

    await appendSheetData(SHEET_NAME, [
      getCurrentTimestamp(),
      tipe_trend || 'Trend Produk',
      nama_produk,
      ukuran_gramasi || '',
      harga_referensi || '',
      link_medsos || '',
      foto_url || '',
      aiAnalisis,
      aiReferensi,
      aiDurasi,
      aiResiko,
      aiKeuntungan,
      aiScore,
    ]);

    return NextResponse.json({
      success: true,
      message: 'Data berhasil dianalisis dan disimpan!',
      preview: {
        analisis: aiAnalisis,
        referensi: aiReferensi,
        durasi: aiDurasi,
        resiko: aiResiko,
        keuntungan: aiKeuntungan,
        skor: aiScore,
      }
    });
  } catch (error) {
    console.error('Error adding Market Watch:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const rawData = await getSheetData<Record<string, string | number>>(SHEET_NAME);
    if (!rawData || rawData.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const data = rawData.map((obj) => {
      // Menerima berbagai kemungkinan nama header untuk backward compatibility dengan sheet lama
      return {
        timestamp: String(obj['Timestamp'] || ''),
        tipe_trend: String(obj['Tipe Trend'] || 'Trend Produk'),
        nama_produk: String(obj['Nama Ide/Produk'] || obj['Nama Produk'] || ''),
        ukuran_gramasi: String(obj['Ukuran/Gramasi'] || obj['Ukuran Gramasi'] || ''),
        harga_referensi: String(obj['Harga Referensi'] || ''),
        link_medsos: String(obj['Link Sosial Media'] || obj['Link Medsos'] || ''),
        foto_url: String(obj['Foto URL'] || ''),
        ai_analisis: String(obj['Rekomendasi AI R&D'] || obj['AI Analisis Lengkap'] || ''),
        ai_referensi: String(obj['AI Referensi Serupa'] || ''),
        ai_durasi: String(obj['AI Estimasi Durasi Trend'] || ''),
        ai_resiko: String(obj['AI Resiko'] || ''),
        ai_keuntungan: String(obj['AI Keuntungan'] || ''),
        ai_skor: Number(obj['AI Layak Skor (1-100)'] || obj['AI Skor (1-100)']) || 0,
      };
    });

    return NextResponse.json({ success: true, data: data.reverse() });
  } catch (error) {
    console.error('Error fetching Market Watch:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timestamp = searchParams.get('timestamp');

    if (!timestamp) {
      return NextResponse.json({ success: false, error: 'Timestamp wajib disertakan' }, { status: 400 });
    }

    // Kolom 0 = Timestamp
    const deleted = await deleteSheetRow(SHEET_NAME, 0, timestamp);

    if (deleted) {
      return NextResponse.json({ success: true, message: 'Data berhasil dihapus' });
    } else {
      return NextResponse.json({ success: false, error: 'Data tidak ditemukan' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting Market Watch:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghapus data' }, { status: 500 });
  }
}

