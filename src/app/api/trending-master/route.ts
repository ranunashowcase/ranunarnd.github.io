import { NextResponse } from 'next/server';
import { getGoogleSheetsClient, getSpreadsheetId } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();

    // 1. Fetch MASTER SKU
    let masterSkuRows: any[][] = [];
    try {
      const msRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `MASTER SKU!A2:Z1000` // Assuming row 1 is header
      });
      masterSkuRows = msRes.data.values || [];
    } catch (e) {
      console.warn('MASTER SKU sheet not found or empty.');
    }

    // Map Master SKU: Key is SKU Produk (index 1), Value is { name: index 3, qty: index 4 }
    // Also map Barcode Produk (index 0) to handle both cases
    const skuMap = new Map<string, { name: string; qty: number }>();
    
    masterSkuRows.forEach(row => {
      const barcode = row[0]?.trim();
      const sku = row[1]?.trim();
      const name = row[3] || 'Unknown Product';
      const qty = parseInt(row[4] || '1', 10);
      
      const itemData = { name, qty: isNaN(qty) ? 1 : qty };
      
      if (sku) skuMap.set(sku, itemData);
      if (barcode) skuMap.set(barcode, itemData);
    });

    // 2. Fetch PEMESANAN PRODUK
    let orderRows: any[][] = [];
    try {
      const orderRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `PEMESANAN PRODUK!A2:Z` // Skip header
      });
      orderRows = orderRes.data.values || [];
    } catch (e) {
      console.warn('PEMESANAN PRODUK sheet not found or empty.');
    }

    // 3. Aggregate Sales
    // Column 14: Nomor Referensi SKU
    // Column 18: Jumlah (Quantity ordered)
    // Sometimes 'SKU Induk' column 12 is used. We'll use 14 as primary, fallback to 12.
    const salesMap = new Map<string, number>();

    orderRows.forEach(row => {
      let refSku = row[14]?.trim() || '';
      if (!refSku) {
        refSku = row[12]?.trim() || '';
      }
      
      const orderedQty = parseInt(row[18] || '0', 10);
      
      if (refSku && orderedQty > 0) {
        const masterInfo = skuMap.get(refSku);
        if (masterInfo) {
          const totalPacks = orderedQty * masterInfo.qty;
          const currentTotal = salesMap.get(masterInfo.name) || 0;
          salesMap.set(masterInfo.name, currentTotal + totalPacks);
        } else {
          // If product not found in Master, just track it by its SKU name and assume Qty = 1
          const productName = row[13] || refSku; // Nama Produk
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
