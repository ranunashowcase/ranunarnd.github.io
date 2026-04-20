export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for AI processing on Vercel

import { NextRequest, NextResponse } from 'next/server';
import { generateGroqCompletion, generateDeepThinkingCompletion } from '@/lib/groq-service';
import { getSheetData } from '@/lib/sheets-service';
import { InputInformation } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ success: false, error: 'Pesan kosong' }, { status: 400 });
    }

    // 1. GATHER RAW DATA
    let companyContext = "";
    try {
      const products = await getSheetData<any>('Products');
      const liveProducts = products.filter((p) => p.status === 'live');
      const devProducts = products.filter((p) => p.status === 'development');

      companyContext = `Data Produk R&D Perusahaan:
Live: ${liveProducts.map(p => p.product_name).join(', ')}.
Development: ${devProducts.map(p => p.product_name).join(', ')}.`;
    } catch { /* empty */ }

    let researchContext = "";
    try {
      const infoData = await getSheetData<InputInformation>('INPUT INFORMASI');
      if (infoData.length > 0) {
        // Ambil banyak research dari PDF untuk dirangkum
        const recentInfo = infoData.slice(-10);
        researchContext = `\nData Riset & Dokumen Tren (PDF Extracts):
${recentInfo.map((i) => `Judul: ${i.judul} (${i.kategori_info})\nIsi: ${i.konten.substring(0, 1000)}...`).join('\n\n')}`;
      }
    } catch { /* empty */ }

    // 2. PAIRING STAGE 1: Fast Summarization Model (Llama 8B)
    // Tujuannya memfilter ribuan kata dari PDF menjadi ringkasan poin padat yang relevan.
    let distilledContext = "";
    if (researchContext || companyContext) {
      const summaryPrompt = `Tugas Anda merangkum data R&D mentah berikut ini agar relevan untuk menjawab pertanyaan user: "${message}".
Ambil poin penting dari dokumen PDF/Riset dan cocokkan dengan data produk internal. Jawab singkat padat tanpa basa-basi.

Data Mentah:
${companyContext}
${researchContext}`;
      
      try {
         distilledContext = await generateGroqCompletion(summaryPrompt, "Anda adalah Data Summarizer yang sangat efisien.");
      } catch (err) {
         console.warn("Llama summarization failed, falling back to raw data", err);
         distilledContext = `${companyContext}\n${researchContext}`; // fallback if stage 1 fails
      }
    }

    // 3. PAIRING STAGE 2: Deep Thinking Model (GPT-OSS-120B)
    // Model yang sangat cerdas difokuskan untuk reasoning dan memberikan jawaban akhir terbaik.
    const systemMessage = `Anda adalah "GPT-OSS-120B R&D Master", asisten AI paling cerdas dari PT. Shalee Berkah Jaya. Produk perusahaan fokus di Natural & Healthy Food.
Berdasarkan ringkasan data terverifikasi berikut (hasil riset PDF & status internal), berikan jawaban yang cerdas, komprehensif, sangat terstruktur, dan presisi.
Gunakan nada pro-aktif, futuristik, namun bisa diaplikasikan secara bisnis. Jawab dalam bahasa Indonesia.
Jika mengutip produk, sebutkan yang ada di marketplace Indonesia.

=== DATA TERVERIFIKASI (Konteks R&D) ===
${distilledContext}
=======================================`;

    const reply = await generateDeepThinkingCompletion(message, systemMessage);

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghubungi AI' }, { status: 500 });
  }
}

