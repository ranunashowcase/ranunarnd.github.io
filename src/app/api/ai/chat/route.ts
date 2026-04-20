export const dynamic = 'force-dynamic';
export const maxDuration = 10; // Vercel Hobby plan limit

import { NextRequest, NextResponse } from 'next/server';
import { generateGroqCompletion } from '@/lib/groq-service';
import { getSheetData } from '@/lib/sheets-service';
import { InputInformation } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ success: false, error: 'Pesan kosong' }, { status: 400 });
    }

    // Fetch data in PARALLEL for speed
    const [productsResult, infoResult] = await Promise.allSettled([
      getSheetData<any>('Products'),
      getSheetData<InputInformation>('INPUT INFORMASI'),
    ]);

    // Build compact context
    let companyContext = "";
    if (productsResult.status === 'fulfilled' && productsResult.value.length > 0) {
      const products = productsResult.value;
      const liveProducts = products.filter((p: any) => p.status === 'live');
      const devProducts = products.filter((p: any) => p.status === 'development');
      companyContext = `Produk Live: ${liveProducts.map((p: any) => p.product_name).join(', ')}. Development: ${devProducts.map((p: any) => p.product_name).join(', ')}.`;
    }

    let researchContext = "";
    if (infoResult.status === 'fulfilled' && infoResult.value.length > 0) {
      const recentInfo = infoResult.value.slice(-5); // Reduced context
      researchContext = recentInfo.map((i) =>
        `[${i.kategori_info}] ${i.judul}: ${i.konten.substring(0, 400)}`
      ).join('\n');
    }

    // SINGLE AI call (no more dual-pairing to avoid Hobby plan timeout)
    const systemMessage = `Anda adalah "R&D Master AI", asisten cerdas PT. Shalee Berkah Jaya (Natural & Healthy Food).
Berikan jawaban cerdas, terstruktur, dan presisi. Bahasa Indonesia. Nada proaktif dan profesional.
Jika mengutip produk, sebutkan yang ada di marketplace Indonesia.

=== KONTEKS R&D ===
${companyContext}
${researchContext ? `\nRiset Terbaru:\n${researchContext}` : ''}
===================`;

    const reply = await generateGroqCompletion(message, systemMessage);

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghubungi AI' }, { status: 500 });
  }
}
