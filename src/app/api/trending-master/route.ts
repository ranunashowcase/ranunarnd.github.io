import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/sheets-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Smart value extractor — tries multiple column name variants (case-insensitive).
 */
function getVal(row: Record<string, any>, ...keys: string[]): string {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return String(row[key]).trim();
    }
  }
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
    // 1. Fetch MASTER SKU
    let masterSkuRows: Record<string, any>[] = [];
    try {
      masterSkuRows = await getSheetData<Record<string, any>>('MASTER SKU');
    } catch {
      console.warn('MASTER SKU sheet not found or empty.');
    }

    // Map Master SKU: key by SKU and Barcode
    const skuMap = new Map<string, { name: string; qty: number }>();
    
    masterSkuRows.forEach(row => {
      let barcode = getVal(row, 'barcode_produk', 'Barcode Produk', 'BARCODE', 'Barcode', 'barcode');
      const sku = getVal(row, 'sku_produk', 'SKU Produk', 'SKU', 'Sku', 'sku');
      const name = getVal(row, 'nama_barang', 'Nama Barang', 'NAMA BARANG', 'Nama Produk') || 'Unknown Product';
      const qtyRaw = getVal(row, 'qty', 'Qty', 'QTY', 'qty_per_carton') || '1';
      const qty = parseInt(qtyRaw, 10);
      
      const itemData = { name, qty: isNaN(qty) ? 1 : qty };
      
      if (sku) skuMap.set(sku, itemData);
      if (barcode) skuMap.set(barcode, itemData);
    });

    // 2. Fetch PEMESANAN PRODUK
    let orderRows: Record<string, any>[] = [];
    try {
      orderRows = await getSheetData<Record<string, any>>('PEMESANAN PRODUK');
    } catch {
      console.warn('PEMESANAN PRODUK sheet not found or empty.');
    }

    // 3. Aggregate Sales using smart column reading
    const salesMap = new Map<string, number>();

    orderRows.forEach(row => {
      // Try to find SKU/barcode from any possible column name
      let refSku = getVal(row, 'SKU', 'Sku', 'sku', 'SKU Produk', 'sku_produk', 'Nomor Referensi SKU', 'SKU Induk');
      if (!refSku) {
        refSku = getVal(row, 'BARCODE', 'Barcode', 'barcode', 'Barcode Produk', 'barcode_produk');
      }
      
      const qtyRaw = getVal(row, 'QTY', 'Qty', 'qty', 'Jumlah', 'jumlah', 'Kuantitas', 'Quantity') || '0';
      const orderedQty = parseInt(qtyRaw.replace(/\D/g, ''), 10) || 0;
      
      if (refSku && orderedQty > 0) {
        const masterInfo = skuMap.get(refSku);
        if (masterInfo) {
          const totalPacks = orderedQty * masterInfo.qty;
          const currentTotal = salesMap.get(masterInfo.name) || 0;
          salesMap.set(masterInfo.name, currentTotal + totalPacks);
        } else {
          // If product not found in Master, track by name from order
          const productName = getVal(row, 'NAMA BARANG', 'Nama Barang', 'nama_barang', 'Nama Produk', 'nama_produk') || refSku;
          const currentTotal = salesMap.get(productName) || 0;
          salesMap.set(productName, currentTotal + orderedQty);
        }
      }
    });

    // 4. Sort and Top 5
    const trendingProducts = Array.from(salesMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // 5. Format for Dashboard TrendGraph
    const data = trendingProducts.map(tp => ({
      product_category: 'Top Sales',
      product_name: tp.name,
      product_image_url: '', // No images from master yet
      estimated_duration: `Terjual: ${tp.total} pack`, // We repurpose this field to show string info
      trend_score: tp.total, // Serve as calculation bar size
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching calculated trends:', error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}

