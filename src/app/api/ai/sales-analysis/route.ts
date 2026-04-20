export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextResponse } from 'next/server';
import { generateGroqCompletion } from '@/lib/groq-service';

export async function POST(request: Request) {
  try {
    const { products } = await request.json();

    if (!products || products.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada data produk' }, { status: 400 });
    }

    // Limit to top 20 products to avoid huge payloads
    const topProducts = products.slice(0, 20).map((p: any) => ({
      nama: p.nama_barang,
      terjual: p.total_qty,
      tren_harian: p.daily_data && p.daily_data.length >= 2 
        ? (p.daily_data[p.daily_data.length-1].qty >= p.daily_data[0].qty ? 'Naik' : 'Turun') 
        : 'Stabil'
    }));

    const systemPrompt = `Anda adalah AI Sales Analyst PT. Shalee Berkah Jaya (Fokus: Natural & Healthy Food).
Tugas Anda merangkum laporan penjualan berdasarkan data mentah dalam 2-3 paragraf ringkas namun berbobot strategis.
Berikan insight mana produk paling bersinar, apa tantangannya, dan 1 rekomendasi marketing yang actionable. Gunakan bahasa Indonesia bernada proaktif dan profesional. JANGAN pakai markdown code block json, langsung teks saja berbentuk paragraf marketing/report.`;

    const userPrompt = `Data top 20 penjualan kami saat ini:
${JSON.stringify(topProducts, null, 2)}`;

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

