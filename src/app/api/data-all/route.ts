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

    const data = {
      sales: filterByDate(sales.status === 'fulfilled' ? sales.value : [], ['Tanggal', 'tanggal', 'Waktu Pesanan Dibuat']),
      sku: sku.status === 'fulfilled' ? sku.value : [], // SKU doesn't usually have date filter
      rnd: filterByDate(rnd.status === 'fulfilled' ? rnd.value : [], ['timestamp', 'tanggal_selesai']),
      market: filterByDate(market.status === 'fulfilled' ? market.value : [], ['Timestamp', 'timestamp']),
      info: filterByDate(info.status === 'fulfilled' ? info.value : [], ['created_at', 'timestamp']),
    };

    return NextResponse.json({
      success: true,
      data: {
        counts: {
          sales: data.sales.length,
          sku: data.sku.length,
          rnd: data.rnd.length,
          market: data.market.length,
          info: data.info.length,
        },
        // We can pass a sample or the full data if needed. For visualization, usually full is fine if not millions of rows.
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
