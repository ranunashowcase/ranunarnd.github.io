export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { getSheetData } from '@/lib/sheets-service';
import { OnProgressProduct } from '@/types';
import { generateGeminiCompletion, safeParseGeminiJson } from '@/lib/gemini-service';
import { generateDeepThinkingCompletion, safeParseAiJson } from '@/lib/groq-service';
import {
  getProductResearch,
  canRefreshToday,
  saveProductResearch,
} from '@/lib/on-progress-research-cache';

// ============================================
// AI Deep Research for Product On Progress
// - GET: Retrieve research for a product (auto-generate if none exists)
// - POST: Manually refresh research (max 2x per day)
// ============================================

const RND_SHEET = 'RND ON PROGRESS';

/**
 * Build the comprehensive AI research prompt for a product.
 */
function buildResearchPrompt(product: OnProgressProduct): { system: string; user: string } {
  const system = `Anda adalah seorang Senior Market Research Analyst & R&D Strategy Consultant di industri FMCG Indonesia, khususnya di bidang Natural & Healthy Food (kurma, kacang, trail mix, madu, ekstrak, cokelat, superfood).

Anda memiliki pengetahuan mendalam tentang:
- Tren pasar makanan sehat di Indonesia, Asia Tenggara, dan global
- Perilaku konsumen Indonesia (offline & online marketplace: Shopee, Tokopedia, TikTok Shop)
- Competitive landscape di industri makanan sehat Indonesia
- Regulasi BPOM, sertifikasi halal, dan standar kualitas F&B Indonesia
- Supply chain & sourcing bahan baku natural food

ATURAN OUTPUT:
- Bahasa Indonesia, profesional dan mendalam
- Setiap klaim harus berbasis data/logika yang kuat
- JANGAN gunakan markdown formatting (**, ##, dll). Plain text saja.
- Output HANYA JSON tanpa markdown code blocks
- Pastikan semua string di-escape dengan benar`;

  const user = `Analisis mendalam untuk produk R&D baru berikut:

DETAIL PRODUK:
- Nama Produk: ${product.nama_produk}
- Kategori: ${product.kategori || 'Belum ditentukan'}
- Fase Development: ${product.fase_development || 'Ideation'}
- Target Rilis: ${product.target_rilis || 'Belum ditentukan'}
- Rangkaian/Komposisi: ${product.rangkaian_produk || 'Belum ditentukan'}
- Ukuran Produk: ${product.ukuran_produk || 'Belum ditentukan'}
- Catatan R&D: ${product.catatan_formulasi || 'Tidak ada catatan'}

Berikan analisis lengkap dalam format JSON berikut:

{
  "analisis_pasar": "3-4 paragraf analisis mendalam tentang potensi produk ini di pasar Indonesia. Bahas ukuran pasar, pertumbuhan kategori, demand konsumen, tren online marketplace (Shopee, TikTok Shop, Tokopedia), dan bagaimana produk ini bisa mengambil peluang. Sertakan data/estimasi yang relevan.",
  
  "kompetitor": "2-3 paragraf tentang siapa saja kompetitor utama di kategori ini di Indonesia. Sebutkan nama brand jika memungkinkan, posisi mereka di pasar, kelebihan dan kekurangan mereka, dan di mana celah/gap yang bisa dimanfaatkan oleh produk ini.",
  
  "target_market": "2-3 paragraf tentang segmen konsumen yang paling tepat untuk produk ini. Bahas demografi (usia, gender, SES), psikografi (lifestyle, nilai), behavior (kapan beli, di mana beli, berapa sering), dan bagaimana cara menjangkau mereka.",
  
  "trend_forecast": "2-3 paragraf tentang prediksi tren untuk kategori produk ini. Bahas tren jangka pendek (3-6 bulan), menengah (6-12 bulan), dan panjang (1-3 tahun). Apakah kategori ini sedang naik, stabil, atau menurun? Apa yang mendorong tren?",
  
  "rekomendasi_strategi": "3-4 paragraf rekomendasi strategi go-to-market. Bahas: positioning produk, strategi pricing (premium/mass), channel distribusi prioritas, strategi digital marketing, dan timeline langkah-langkah yang direkomendasikan.",
  
  "risk_assessment": "2-3 paragraf tentang risiko dan tantangan yang mungkin dihadapi produk ini. Bahas risiko pasar, regulasi, supply chain, kompetisi, dan cara mitigasi masing-masing risiko.",
  
  "estimated_lifespan": "Evergreen / XX Bulan — estimasi berapa lama produk ini relevan di pasaran, dengan penjelasan singkat 1-2 kalimat.",
  
  "skor_potensi": 85,
  
  "verdict": "1-2 kalimat kesimpulan singkat: apakah produk ini layak dilanjutkan, perlu pivot, atau harus di-hold."
}

INGAT: Output HANYA JSON murni tanpa markdown code blocks. Pastikan semua string di-escape dengan benar.`;

  return { system, user };
}

/**
 * Generate AI research for a product.
 * Tries Gemini first, falls back to Groq.
 */
async function generateResearch(product: OnProgressProduct): Promise<any> {
  const { system, user } = buildResearchPrompt(product);
  let parsed: any = null;

  // Try Gemini first
  try {
    console.log(`[Research] Generating research via Gemini for: ${product.nama_produk}`);
    const result = await generateGeminiCompletion(user, system);
    parsed = safeParseGeminiJson(result);
  } catch (err) {
    console.warn('[Research] Gemini failed, trying Groq:', err);
  }

  // Fallback to Groq
  if (!parsed) {
    try {
      console.log(`[Research] Generating research via Groq for: ${product.nama_produk}`);
      const result = await generateDeepThinkingCompletion(user, system);
      parsed = safeParseAiJson(result);
    } catch (err) {
      console.error('[Research] Both AI engines failed:', err);
    }
  }

  if (!parsed) {
    // Return a minimal fallback
    return {
      analisis_pasar: 'Analisis sedang tidak tersedia. Silakan coba refresh.',
      kompetitor: 'Data kompetitor tidak tersedia.',
      target_market: 'Data target market tidak tersedia.',
      trend_forecast: 'Prediksi tren tidak tersedia.',
      rekomendasi_strategi: 'Rekomendasi tidak tersedia.',
      risk_assessment: 'Analisis risiko tidak tersedia.',
      estimated_lifespan: 'Tidak diketahui',
      skor_potensi: 0,
      verdict: 'Analisis gagal di-generate. Silakan refresh.',
    };
  }

  return parsed;
}

/**
 * GET /api/products/on-progress/research?id=xxx
 * Retrieve research for a product. Auto-generate if none exists.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Parameter id wajib diisi' },
        { status: 400 }
      );
    }

    // Check if research already exists
    const cached = await getProductResearch(productId);

    if (cached.data) {
      // Research exists — return it
      return NextResponse.json({
        success: true,
        data: cached.data,
        meta: {
          created_at: cached.created_at,
          last_refreshed_at: cached.last_refreshed_at,
          refresh_remaining: cached.refresh_remaining,
        },
      });
    }

    // No research yet — auto-generate
    // First, get the product details from the sheet
    const products = await getSheetData<OnProgressProduct>(RND_SHEET);
    const product = products.find((p) => p.id === productId);

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produk tidak ditemukan' },
        { status: 404 }
      );
    }

    // Generate research
    const research = await generateResearch(product);

    // Save to persistent cache (isRefresh = false → first generation)
    await saveProductResearch(productId, research, false);

    // Get the updated cache info
    const updated = await getProductResearch(productId);

    return NextResponse.json({
      success: true,
      data: research,
      meta: {
        created_at: updated.created_at,
        last_refreshed_at: updated.last_refreshed_at,
        refresh_remaining: updated.refresh_remaining,
      },
    });
  } catch (error) {
    console.error('[Research API] GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data riset produk' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/on-progress/research
 * Manually refresh research for a product (max 2x per day).
 * Body: { product_id: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id } = body;

    if (!product_id) {
      return NextResponse.json(
        { success: false, error: 'product_id wajib diisi' },
        { status: 400 }
      );
    }

    // Check refresh limit
    const limitCheck = await canRefreshToday(product_id);

    if (!limitCheck.canRefresh) {
      return NextResponse.json(
        {
          success: false,
          error: limitCheck.message,
          refresh_remaining: limitCheck.remaining,
        },
        { status: 429 }
      );
    }

    // Get product details
    const products = await getSheetData<OnProgressProduct>(RND_SHEET);
    const product = products.find((p) => p.id === product_id);

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produk tidak ditemukan' },
        { status: 404 }
      );
    }

    // Re-generate research
    const research = await generateResearch(product);

    // Save to cache with refresh = true (increments counter)
    await saveProductResearch(product_id, research, true);

    // Get updated info
    const updated = await getProductResearch(product_id);

    return NextResponse.json({
      success: true,
      data: research,
      meta: {
        created_at: updated.created_at,
        last_refreshed_at: updated.last_refreshed_at,
        refresh_remaining: updated.refresh_remaining,
      },
    });
  } catch (error) {
    console.error('[Research API] POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal me-refresh riset produk' },
      { status: 500 }
    );
  }
}
