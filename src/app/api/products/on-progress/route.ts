export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSheetData, appendSheetData, updateSheetRow, deleteSheetRow, generateId, getCurrentTimestamp, initializeSheetHeaders } from '@/lib/sheets-service';
import { OnProgressProduct } from '@/types';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy_key' });

const SHEET_NAME = 'RND ON PROGRESS';
const HEADERS = [
  'id', 'nama_produk', 'kategori', 'fase_development', 'target_rilis',
  'catatan_formulasi', 'foto_produk_url', 'rangkaian_produk', 'ukuran_produk',
  'mockup_url', 'ai_forecast', 'ai_lifespan', 'timestamp', 'tanggal_selesai'
];

export async function GET() {
  try {
    await initializeSheetHeaders(SHEET_NAME, HEADERS);
    const data = await getSheetData<OnProgressProduct>(SHEET_NAME);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching on-progress:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data produk on progress' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nama_produk, kategori, fase_development, target_rilis,
      catatan_formulasi, foto_produk_url, rangkaian_produk,
      ukuran_produk, mockup_url, tanggal_selesai
    } = body;

    if (!nama_produk) {
      return NextResponse.json(
        { success: false, error: 'Nama produk wajib diisi' },
        { status: 400 }
      );
    }

    // AI Forecast
    let aiForecast = 'Analisis tidak tersedia';
    let aiLifespan = 'Tidak diketahui';

    if (process.env.GROQ_API_KEY) {
      const prompt = `Saya tim R&D FMCG. Sedang develop produk baru:
- Nama: ${nama_produk}
- Kategori: ${kategori}
- Fase: ${fase_development}
- Target Rilis: ${target_rilis}
- Catatan: ${catatan_formulasi}

Berikan:
1. Prediksi kekuatan tren produk kategori ${kategori} di pasaran Indonesia
2. Apakah timeline menuju target ${target_rilis} beresiko terlambat

Jawab ringkas 2 paragraf. Di akhir tulis "LIFESPAN: XX Bulan" atau "LIFESPAN: Evergreen".`;

      try {
        const completion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.3,
          max_tokens: 512,
        });

        const content = completion.choices[0]?.message?.content || '';
        const match = content.match(/LIFESPAN:\s*(.+)/i);
        if (match) aiLifespan = match[1].trim();
        aiForecast = content.replace(/LIFESPAN:\s*.+/i, '').trim();
      } catch (err) {
        console.error('Groq Error:', err);
        aiForecast = 'Gagal mengakses AI.';
      }
    }

    await initializeSheetHeaders(SHEET_NAME, HEADERS);

    const existingData = await getSheetData<OnProgressProduct>(SHEET_NAME);
    const existingIds = existingData.map((d) => d.id);
    const newId = generateId('RND', existingIds);
    const timestamp = getCurrentTimestamp();

    await appendSheetData(SHEET_NAME, [
      newId,
      nama_produk,
      kategori || '',
      fase_development || '',
      target_rilis || '',
      catatan_formulasi || '',
      foto_produk_url || '',
      rangkaian_produk || '',
      ukuran_produk || '',
      mockup_url || '',
      aiForecast,
      aiLifespan,
      timestamp,
      tanggal_selesai || '',
    ]);

    return NextResponse.json({
      success: true,
      data: { id: newId, nama_produk, ai_forecast: aiForecast, ai_lifespan: aiLifespan },
    });
  } catch (error) {
    console.error('Error saving on-progress:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan data produk on progress' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id, nama_produk, kategori, fase_development, target_rilis,
      catatan_formulasi, foto_produk_url, rangkaian_produk,
      ukuran_produk, mockup_url, tanggal_selesai
    } = body;

    if (!id || !nama_produk) {
      return NextResponse.json({ success: false, error: 'ID dan Nama produk wajib diisi' }, { status: 400 });
    }

    let aiForecast = body.ai_forecast || 'Analisis tidak tersedia';
    let aiLifespan = body.ai_lifespan || 'Tidak diketahui';
    const timestamp = body.timestamp || getCurrentTimestamp();

    if (process.env.GROQ_API_KEY) {
      const prompt = `Update Proyek R&D FMCG:
- Nama: ${nama_produk}
- Kategori: ${kategori}
- Fase Perubahan: ${fase_development}
- Catatan Baru: ${catatan_formulasi}

Berikan:
1. Analisis progress R&D ini
2. Rekomendasi langkah selanjutnya

Jawab ringkas 2 paragraf. Di akhir tulis "LIFESPAN: XX Bulan" atau "LIFESPAN: Evergreen".`;

      try {
        const completion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.3,
          max_tokens: 512,
        });

        const content = completion.choices[0]?.message?.content || '';
        const match = content.match(/LIFESPAN:\s*(.+)/i);
        if (match) aiLifespan = match[1].trim();
        aiForecast = content.replace(/LIFESPAN:\s*.+/i, '').trim();
      } catch (err) {}
    }

    const updatedRow = [
      id, nama_produk, kategori || '', fase_development || '', target_rilis || '',
      catatan_formulasi || '', foto_produk_url || '', rangkaian_produk || '',
      ukuran_produk || '', mockup_url || '', aiForecast, aiLifespan, timestamp, tanggal_selesai || ''
    ];

    const updated = await updateSheetRow(SHEET_NAME, 0, id, updatedRow);

    if (updated) {
      return NextResponse.json({
        success: true,
        data: { id, nama_produk, ai_forecast: aiForecast, ai_lifespan: aiLifespan },
      });
    } else {
      return NextResponse.json({ success: false, error: 'Data tidak ditemukan' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error updating on-progress:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengupdate data' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID wajib diisi' }, { status: 400 });
    }

    const deleted = await deleteSheetRow(SHEET_NAME, 0, id);
    if (deleted) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Data tidak ditemukan' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting on-progress:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghapus data' }, { status: 500 });
  }
}

