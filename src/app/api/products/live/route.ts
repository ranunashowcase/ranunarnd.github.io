export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { appendSheetData } from '@/lib/sheets-service';
import { verifyToken, isAdmin } from '@/lib/auth-service';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    const user = token ? verifyToken(token) : null;
    
    if (!isAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Akses Ditolak: Hanya Admin yang dapat menambahkan produk live' }, { status: 403 });
    }

    const body = await req.json();
    const { barcode_produk, sku_produk, sku_per_produk, nama_barang, qty } = body;

    if (!barcode_produk || !sku_produk || !nama_barang || !qty) {
      return NextResponse.json({ success: false, error: 'Field mandatory harus diisi' }, { status: 400 });
    }

    // Append to MASTER SKU (Barcode Produk, SKU Produk, SKU Per Produk, Nama Barang, Qty)
    await appendSheetData('MASTER SKU', [
      barcode_produk,
      sku_produk,
      sku_per_produk || '',
      nama_barang,
      qty.toString()
    ]);

    return NextResponse.json({ success: true, message: 'Data added to MASTER SKU' });
  } catch (error) {
    console.error('Error adding Live Product:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

