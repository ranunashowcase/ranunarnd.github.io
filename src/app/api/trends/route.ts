import { NextRequest, NextResponse } from 'next/server';
import { getSheetData, appendSheetData, generateId, getCurrentTimestamp, initializeSheetHeaders } from '@/lib/sheets-service';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SHEET_NAME = 'MarketTrends';
const HEADERS = ['trend_id', 'trend_name', 'target_market', 'competitor_price', 'trend_status', 'estimasi_durasi', 'created_at'];

export async function GET() {
  try {
    await initializeSheetHeaders(SHEET_NAME, HEADERS);

    const data = await getSheetData(SHEET_NAME);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching trends:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data tren' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trend_name, tambahan_info } = body;

    if (!trend_name) {
      return NextResponse.json(
        { success: false, error: 'Nama tren/produk wajib diisi' },
        { status: 400 }
      );
    }

    let target_market = 'Umum';
    let competitor_price = 0;
    let trend_status = 'naik';
    let estimasi_durasi = 'Tidak diketahui';

    if (process.env.GROQ_API_KEY) {
      const prompt = `Saya melihat produk ini sedang ramai diperbincangkan di medsos/marketplace:
Nama/Info Produk: ${trend_name}
${tambahan_info ? `Info Tambahan: ${tambahan_info}` : ''}

Tugas Anda sebagai AI Market Intelligence:
1. Tentukan target_market (siapa pembelinya, misal Anak Muda, Ibu Rumah Tangga)
2. Estimasi harga pasaran atau angka 'competitor_price' (hanya ANGKA tanpa simbol, misal 50000)
3. Tentukan trend_status HANYA DARI (naik, turun, stabil). Jika sedang viral, pilih "naik".
4. Tentukan estimasi durasi ngetrend (contoh: "3-6 Bulan", "Evergreen", "Sesaat").

Jawab HANYA dengan format JSON tanpa awalan/akhiran apapun:
{
  "target_market": "string",
  "competitor_price": 0,
  "trend_status": "naik/turun/stabil",
  "estimasi_durasi": "string"
}`;

      try {
        const completion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.2, // lowered for strict JSON compliance
          max_tokens: 256,
        });

        const content = completion.choices[0]?.message?.content || '{}';
        // Extract JSON simply
        const startIdx = content.indexOf('{');
        const endIdx = content.lastIndexOf('}');
        if (startIdx >= 0 && endIdx > startIdx) {
          const jsonStr = content.substring(startIdx, endIdx + 1);
          const parsed = JSON.parse(jsonStr);
          
          target_market = parsed.target_market || target_market;
          competitor_price = Number(parsed.competitor_price) || competitor_price;
          trend_status = ['naik', 'turun', 'stabil'].includes(parsed.trend_status?.toLowerCase()) ? parsed.trend_status.toLowerCase() : trend_status;
          estimasi_durasi = parsed.estimasi_durasi || estimasi_durasi;
        }
      } catch (err) {
        console.error('Groq parsing error for trends:', err);
      }
    }

    await initializeSheetHeaders(SHEET_NAME, HEADERS);

    // type any for now since we added fields
    const existingData = await getSheetData<any>(SHEET_NAME);
    const existingIds = existingData.map((t) => t.trend_id);
    const newId = generateId('TRD', existingIds);
    const timestamp = getCurrentTimestamp();

    await appendSheetData(SHEET_NAME, [
      newId,
      trend_name,
      target_market,
      competitor_price,
      trend_status,
      estimasi_durasi,
      timestamp,
    ]);

    return NextResponse.json({
      success: true,
      data: { trend_id: newId, trend_name, target_market, competitor_price, trend_status, estimasi_durasi, created_at: timestamp },
    });
  } catch (error) {
    console.error('Error creating trend:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan data tren' },
      { status: 500 }
    );
  }
}
