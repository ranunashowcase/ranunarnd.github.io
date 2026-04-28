export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSheetData, deleteSheetRowsByCondition } from '@/lib/sheets-service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFilter = searchParams.get('date'); // optional: YYYY-MM-DD

    // Fetch all sheets in parallel
    const [sales, sku, rnd, market, info] = await Promise.allSettled([
      getSheetData<any>('PEMESANAN PRODUK'),
      getSheetData<any>('MASTER SKU'),
      getSheetData<any>('RND ON PROGRESS'),
      getSheetData<any>('MARKET WATCH'),
      getSheetData<any>('INPUT INFORMASI'),
    ]);

    const extractDate = (row: any, keys: string[]) => {
      for (const key of keys) {
        if (row[key]) {
          const val = String(row[key]);
          if (val.includes('T')) return val.split('T')[0];
          if (val.includes(' ')) return val.split(' ')[0];
          return val;
        }
      }
      return '';
    };

    const filterByDate = (data: any[], dateKeys: string[]) => {
      if (!data) return [];
      if (!dateFilter) return data;
      return data.filter(row => {
        const rowDate = extractDate(row, dateKeys);
        return rowDate.includes(dateFilter) || dateFilter.includes(rowDate);
      });
    };

    // Aggregate sales per SKU instead of raw rows
    const rawSales = filterByDate(sales.status === 'fulfilled' ? sales.value : [], ['Tanggal', 'tanggal', 'Waktu Pesanan Dibuat']);
    
    const salesAgg = new Map<string, { SKU: string; Barcode: string; 'Nama Barang': string; 'Total Qty': number; 'Jumlah Pesanan': number }>();
    rawSales.forEach((row: any) => {
      const sku = String(row['SKU'] || row['Sku'] || row['sku'] || row['SKU Produk'] || row['sku_produk'] || row['Nomor Referensi SKU'] || '').trim();
      const barcode = String(row['Barcode'] || row['barcode'] || row['Barcode Produk'] || row['barcode_produk'] || '').trim();
      const nama = String(row['Nama Barang'] || row['nama_barang'] || row['Nama Produk'] || row['nama_produk'] || row['NAMA BARANG'] || '').trim();
      const qtyRaw = String(row['Qty'] || row['qty'] || row['QTY'] || row['Jumlah'] || '0');
      const qty = parseInt(qtyRaw.replace(/\D/g, ''), 10) || 0;
      
      const key = sku || barcode || nama;
      if (!key) return;
      
      if (salesAgg.has(key)) {
        const existing = salesAgg.get(key)!;
        existing['Total Qty'] += qty;
        existing['Jumlah Pesanan'] += 1;
        if (!existing.Barcode && barcode) existing.Barcode = barcode;
        if (!existing['Nama Barang'] && nama) existing['Nama Barang'] = nama;
      } else {
        salesAgg.set(key, {
          SKU: sku,
          Barcode: barcode,
          'Nama Barang': nama,
          'Total Qty': qty,
          'Jumlah Pesanan': 1,
        });
      }
    });
    
    const aggregatedSales = Array.from(salesAgg.values()).sort((a, b) => b['Total Qty'] - a['Total Qty']);

    const data = {
      sales: aggregatedSales,
      sku: sku.status === 'fulfilled' ? sku.value : [],
      rnd: filterByDate(rnd.status === 'fulfilled' ? rnd.value : [], ['timestamp', 'tanggal_selesai']),
      market: filterByDate(market.status === 'fulfilled' ? market.value : [], ['Timestamp', 'timestamp']),
      info: filterByDate(info.status === 'fulfilled' ? info.value : [], ['created_at', 'timestamp']),
    };

    return NextResponse.json({
      success: true,
      data: {
        counts: {
          sales: rawSales.length,
          sku: data.sku.length,
          rnd: data.rnd.length,
          market: data.market.length,
          info: data.info.length,
        },
        details: data
      }
    });

  } catch (error) {
    console.error('Error fetching all data:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get('target'); // 'all', 'sales', 'rnd', 'market', 'info'
    const date = searchParams.get('date'); // optional: YYYY-MM-DD

    if (!target) {
      return NextResponse.json({ success: false, error: 'Target sheet wajib diisi' }, { status: 400 });
    }

    const deleteMap: Record<string, string> = {
      sales: 'PEMESANAN PRODUK',
      rnd: 'RND ON PROGRESS',
      market: 'MARKET WATCH',
      info: 'INPUT INFORMASI',
      sku: 'MASTER SKU'
    };

    let deletedRows = 0;

    if (target === 'all') {
      // Delete from all tracked sheets
      const targets = ['sales', 'rnd', 'market', 'info'];
      for (const t of targets) {
        const sheetName = deleteMap[t];
        const delCount = await deleteSheetRowsByCondition(sheetName, date);
        deletedRows += delCount;
      }
    } else if (deleteMap[target]) {
      // Delete from specific sheet
      const sheetName = deleteMap[target];
      deletedRows = await deleteSheetRowsByCondition(sheetName, date);
    } else {
      return NextResponse.json({ success: false, error: 'Target sheet tidak valid' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${deletedRows} baris data.`,
      deletedCount: deletedRows
    });

  } catch (error) {
    console.error('Error deleting data:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghapus data' }, { status: 500 });
  }
}
