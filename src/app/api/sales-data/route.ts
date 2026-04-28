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
    // Try to read sales data
    let salesData: Record<string, string | number>[] = [];
    try {
      salesData = await getSheetData<Record<string, string | number>>(SHEET_NAME);
    } catch {
      salesData = [];
    }

    // Also get MASTER SKU for image URLs and product details
    let masterSku: Record<string, string>[] = [];
    try {
      masterSku = await getSheetData<Record<string, string>>('MASTER SKU');
    } catch {
      masterSku = [];
    }

    // Build a lookup map: barcode/sku -> product info from MASTER SKU
    const skuMap = new Map<string, { nama_barang: string; image_url: string; barcode: string; sku: string }>();
    masterSku.forEach((row) => {
      let barcode = getVal(row, 'barcode_produk', 'Barcode Produk', 'BARCODE', 'Barcode', 'barcode');
      const sku = getVal(row, 'sku_produk', 'SKU Produk', 'SKU', 'Sku', 'sku');
      const nama = getVal(row, 'nama_barang', 'Nama Barang', 'NAMA BARANG', 'Nama Produk', 'nama_produk');
      const image = getVal(row, 'image_url', 'Image URL', 'foto_url', 'IMAGE URL', 'Image');

      if (!barcode) barcode = sku; // Mirror barcode dgn SKU

      if (barcode) skuMap.set(barcode, { nama_barang: nama, image_url: image, barcode, sku });
      if (sku) skuMap.set(sku, { nama_barang: nama, image_url: image, barcode, sku });
    });

    // Aggregate sales per product
    const productSales = new Map<string, {
      nama_barang: string;
      sku_produk: string;
      barcode_produk: string;
      total_qty: number;
      image_url: string;
      daily: Map<string, number>;
    }>();

    // Inisialisasi semua produk dari Master SKU agar tampil meski sales 0
    masterSku.forEach((row) => {
      let barcode = getVal(row, 'barcode_produk', 'Barcode Produk', 'BARCODE', 'Barcode', 'barcode');
      const sku = getVal(row, 'sku_produk', 'SKU Produk', 'SKU', 'Sku', 'sku');
      const nama = getVal(row, 'nama_barang', 'Nama Barang', 'NAMA BARANG', 'Nama Produk', 'nama_produk');
      const image = getVal(row, 'image_url', 'Image URL', 'foto_url', 'IMAGE URL', 'Image');

      if (!barcode) barcode = sku; // Mirror barcode dgn SKU

      const key = sku || barcode;
      if (key && !productSales.has(key)) {
        productSales.set(key, {
          nama_barang: nama,
          sku_produk: sku,
          barcode_produk: barcode,
          total_qty: 0,
          image_url: image,
          daily: new Map(),
        });
      }
    });

    salesData.forEach((row) => {
      // Smart read — handles ALL column name variants from sheet
      let barcode = getVal(row, 'BARCODE', 'Barcode', 'barcode', 'Barcode Produk', 'barcode_produk');
      const skuRaw = getVal(row, 'SKU', 'Sku', 'sku', 'SKU Produk', 'sku_produk', 'Nomor Referensi SKU', 'SKU Induk') || barcode;
      const sku = skuRaw;
      
      if (!barcode) barcode = sku; // Mirror barcode dgn SKU
      
      const tanggalRaw = getVal(row, 'TANGGAL', 'Tanggal', 'tanggal', 'Waktu Pesanan Dibuat', 'Date', 'date');
      const tanggal = tanggalRaw.split(' ')[0] || ''; // Ambil YYYY-MM-DD saja

      const qtyRaw = getVal(row, 'QTY', 'Qty', 'qty', 'Jumlah', 'jumlah', 'Kuantitas', 'Quantity') || '0';
      const qty = parseInt(qtyRaw.replace(/\D/g, ''), 10) || 0;

      const namaFromOrder = getVal(row, 'NAMA BARANG', 'Nama Barang', 'nama_barang', 'Nama Produk', 'nama_produk');

      // Use sku as primary key to perfectly match the master initialization
      const key = sku || barcode;
      if (!key) return;

      // Lookup in master SKU — mirror barcode<->sku
      const masterInfo = skuMap.get(barcode) || skuMap.get(sku);
      const nama = masterInfo?.nama_barang || namaFromOrder || key;
      const imageUrl = masterInfo?.image_url || '';

      if (!productSales.has(key)) {
        productSales.set(key, {
          nama_barang: nama,
          sku_produk: masterInfo?.sku || sku,
          barcode_produk: masterInfo?.barcode || barcode,
          total_qty: 0,
          image_url: imageUrl,
          daily: new Map(),
        });
      }

      const entry = productSales.get(key)!;
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

