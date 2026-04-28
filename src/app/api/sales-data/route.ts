export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSheetData, initializeSheetHeaders, appendSheetData } from '@/lib/sheets-service';

const SHEET_NAME = 'PEMESANAN PRODUK';

/**
 * Smart value extractor — tries multiple column name variants (case-insensitive).
 * Handles: BARCODE, Barcode, barcode, Barcode Produk, barcode_produk, etc.
 */
function getVal(row: Record<string, any>, ...keys: string[]): string {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return String(row[key]).trim();
    }
  }
  // Case-insensitive fallback
  const rowKeys = Object.keys(row);
  for (const key of keys) {
    const lower = key.toLowerCase();
    const found = rowKeys.find(k => k.toLowerCase() === lower);
    if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== '') {
      return String(row[found]).trim();
    }
  }
  return '';
}

export async function GET() {
  try {
    // Fetch data
    let salesData: Record<string, string | number>[] = [];
    try { salesData = await getSheetData<Record<string, string | number>>(SHEET_NAME); } catch { salesData = []; }

    let masterSku: Record<string, string>[] = [];
    try { masterSku = await getSheetData<Record<string, string>>('MASTER SKU'); } catch { masterSku = []; }

    // =====================================================
    // Aggregate by PRODUCT NAME (not SKU — because MASTER SKU
    // has multiple SKU codes per product: MZ600, MZ600CTN, etc.)
    // =====================================================
    const productSales = new Map<string, {
      nama_barang: string;
      sku_produk: string;       // Primary/first SKU
      barcode_produk: string;   // Primary/first barcode
      total_qty: number;
      image_url: string;
      daily: Map<string, number>;
    }>();

    // Build lookup: barcode/sku → nama_barang (from MASTER SKU)
    const codeToNama = new Map<string, string>();
    const skuPerProdukMap = new Map<string, string>(); // SKU Per Produk → Nama
    
    masterSku.forEach((row) => {
      const barcode = getVal(row, 'Barcode Produk', 'barcode_produk', 'BARCODE', 'Barcode', 'barcode');
      const sku = getVal(row, 'SKU Produk', 'sku_produk', 'SKU', 'Sku', 'sku');
      const skuPer = getVal(row, 'SKU Per Produk', 'sku_per_produk');
      const nama = getVal(row, 'Nama Barang', 'nama_barang', 'NAMA BARANG', 'Nama Produk');
      const image = getVal(row, 'Image URL', 'image_url', 'foto_url');

      if (!nama) return;

      // Map all codes to this product name
      if (barcode) codeToNama.set(barcode, nama);
      if (sku) codeToNama.set(sku, nama);
      if (skuPer) {
        codeToNama.set(skuPer, nama);
        skuPerProdukMap.set(skuPer, nama);
      }
      // Handle combo SKUs like "AJWA500&MED500" — map each part too
      if (sku && sku.includes('&')) {
        sku.split('&').forEach(part => { if (part.trim()) codeToNama.set(part.trim(), nama); });
      }

      // Initialize product entry (only once per unique name)
      if (!productSales.has(nama)) {
        productSales.set(nama, {
          nama_barang: nama,
          sku_produk: skuPer || sku,  // Prefer SKU Per Produk (individual, not CTN)
          barcode_produk: barcode,
          total_qty: 0,
          image_url: image,
          daily: new Map(),
        });
      }
    });

    // Aggregate sales from PEMESANAN PRODUK
    salesData.forEach((row) => {
      const barcode = getVal(row, 'Barcode', 'BARCODE', 'barcode', 'Barcode Produk', 'barcode_produk');
      const sku = getVal(row, 'SKU', 'Sku', 'sku', 'SKU Produk', 'sku_produk', 'Nomor Referensi SKU');
      const namaFromOrder = getVal(row, 'Nama Barang', 'NAMA BARANG', 'nama_barang', 'Nama Produk', 'nama_produk');
      
      const tanggalRaw = getVal(row, 'Tanggal', 'TANGGAL', 'tanggal', 'Waktu Pesanan Dibuat', 'Date');
      const tanggal = tanggalRaw.split(' ')[0] || '';

      const qtyRaw = getVal(row, 'Qty', 'QTY', 'qty', 'Jumlah', 'jumlah', 'Kuantitas') || '0';
      const qty = parseInt(qtyRaw.replace(/\D/g, ''), 10) || 0;

      // Resolve product name: try lookup by SKU, barcode, or use nama from order directly
      const nama = codeToNama.get(sku) || codeToNama.get(barcode) || namaFromOrder;
      if (!nama || qty <= 0) return;

      if (!productSales.has(nama)) {
        productSales.set(nama, {
          nama_barang: nama,
          sku_produk: sku,
          barcode_produk: barcode,
          total_qty: 0,
          image_url: '',
          daily: new Map(),
        });
      }

      const entry = productSales.get(nama)!;
      entry.total_qty += qty;

      if (tanggal) {
        entry.daily.set(tanggal, (entry.daily.get(tanggal) || 0) + qty);
      }
    });

    // Convert to array and sort by total_qty desc
    const result = Array.from(productSales.values())
      .map((entry) => ({
        nama_barang: entry.nama_barang,
        sku_produk: entry.sku_produk,
        barcode_produk: entry.barcode_produk,
        total_qty: entry.total_qty,
        image_url: entry.image_url,
        daily_data: Array.from(entry.daily.entries())
          .map(([tanggal, qty]) => ({ tanggal, qty }))
          .sort((a, b) => a.tanggal.localeCompare(b.tanggal)),
      }))
      .sort((a, b) => b.total_qty - a.total_qty);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data penjualan' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tanggal, barcode_produk, sku_produk, nama_barang, qty, platform } = body;

    const headers = ['Tanggal', 'Barcode Produk', 'SKU Produk', 'Nama Barang', 'Qty', 'Platform'];
    await initializeSheetHeaders(SHEET_NAME, headers);

    const values = [
      tanggal || new Date().toISOString().split('T')[0],
      barcode_produk || '',
      sku_produk || '',
      nama_barang || '',
      qty || 0,
      platform || ''
    ];

    await appendSheetData(SHEET_NAME, values);

    return NextResponse.json({ success: true, message: 'Data penjualan berhasil disimpan' });
  } catch (error) {
    console.error('Error saving sales data:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan data penjualan' },
      { status: 500 }
    );
  }
}

