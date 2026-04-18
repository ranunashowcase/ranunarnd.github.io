import { NextResponse } from 'next/server';
import { getSheetData, initializeSheetHeaders } from '@/lib/sheets-service';

const SHEET_NAME = 'PEMESANAN PRODUK';

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
      let barcode = String(row.barcode_produk || row['Barcode Produk'] || '').trim();
      const sku = String(row.sku_produk || row['SKU Produk'] || '').trim();
      const nama = String(row.nama_barang || row['Nama Barang'] || '');
      const image = String(row.image_url || row['Image URL'] || row.foto_url || '');

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
      let barcode = String(row.barcode_produk || row['Barcode Produk'] || '').trim();
      const sku = String(row.sku_produk || row['SKU Produk'] || '').trim();
      const nama = String(row.nama_barang || row['Nama Barang'] || '');
      const image = String(row.image_url || row['Image URL'] || row.foto_url || '');

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
      let barcode = String(row.barcode_produk || row['Barcode Produk'] || '').trim();
      const skuRaw = String(row.sku_produk || row['SKU Produk'] || row['Nomor Referensi SKU'] || row['SKU Induk'] || barcode);
      const sku = skuRaw.trim();
      
      if (!barcode) barcode = sku; // Mirror barcode dgn SKU
      
      const tanggalObj = row.tanggal || row['Tanggal'] || row['Waktu Pesanan Dibuat'] || '';
      const tanggal = String(tanggalObj).split(' ')[0] || ''; // Ambill YYYY-MM-DD saja

      const qtyRaw = String(row.qty || row['Qty'] || row['QTY'] || row['Jumlah'] || 0);
      const qty = parseInt(qtyRaw.replace(/\D/g, ''), 10) || 0;

      const namaFromOrder = String(row.nama_barang || row['Nama Barang'] || row['Nama Produk'] || '');

      // Use sku as primary key to perfectly match the master initialization
      const key = sku || barcode;
      if (!key) return;

      // Lookup in master SKU
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
