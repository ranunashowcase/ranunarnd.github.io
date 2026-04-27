export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Excel upload may take time

import { NextResponse } from 'next/server';
import { initializeSheetHeaders, appendSheetDataBulk } from '@/lib/sheets-service';
import * as XLSX from 'xlsx';

const SHEET_NAME = 'PEMESANAN PRODUK';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File Excel wajib diunggah' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return NextResponse.json(
        { success: false, error: 'File harus berformat Excel (.xlsx, .xls) atau CSV' },
        { status: 400 }
      );
    }

    // Read Excel file
    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: 'array', cellDates: true });

    // Use first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json(
        { success: false, error: 'File Excel kosong — tidak ada sheet ditemukan' },
        { status: 400 }
      );
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!rawData || rawData.length < 2) {
      return NextResponse.json(
        { success: false, error: 'File Excel tidak memiliki data (minimal header + 1 baris data)' },
        { status: 400 }
      );
    }

    // Extract headers from first row (lowercase, trimmed)
    const rawHeaders: string[] = rawData[0].map((h: any) => String(h).trim());
    const headersLower = rawHeaders.map((h) => h.toLowerCase());

    // ====================================================
    // Smart column mapping (Hanya untuk validasi)
    // ====================================================
    const findCol = (keywords: string[]): number => {
      return headersLower.findIndex((h) =>
        keywords.some((kw) => h.includes(kw))
      );
    };

    const tanggalCol = findCol(['tanggal', 'date', 'waktu pesanan', 'waktu']);
    const barcodeCol = findCol(['barcode']);
    const skuCol = findCol(['sku', 'nomor referensi', 'sku induk']);
    const namaCol = findCol(['nama produk', 'nama barang', 'nama', 'product name']);
    const qtyCol = findCol(['qty', 'jumlah', 'quantity', 'kuantitas']);
    const platformCol = findCol(['platform', 'marketplace', 'channel', 'toko']);

    // At minimum we need nama or sku, and qty
    if (namaCol === -1 && skuCol === -1 && barcodeCol === -1) {
      return NextResponse.json({
        success: false,
        error: `Kolom produk tidak ditemukan. Pastikan Excel memiliki kolom "Nama Produk" atau "SKU" atau "Barcode". Header yang terdeteksi: [${rawHeaders.join(', ')}]`,
      }, { status: 400 });
    }

    if (qtyCol === -1) {
      return NextResponse.json({
        success: false,
        error: `Kolom quantity tidak ditemukan. Pastikan Excel memiliki kolom "Qty" atau "Jumlah". Header yang terdeteksi: [${rawHeaders.join(', ')}]`,
      }, { status: 400 });
    }

    // ====================================================
    // Initialize sheet headers with ALL ORIGINAL HEADERS
    // ====================================================
    const sheetHeaders = rawHeaders;
    await initializeSheetHeaders(SHEET_NAME, sheetHeaders);

    // ====================================================
    // Parse rows and build bulk data
    // ====================================================
    const dataRows = rawData.slice(1); // skip header
    const bulkValues: (string | number)[][] = [];
    let skippedRows = 0;

    for (const row of dataRows) {
      // Extract qty for validation
      const qtyRaw = String(row[qtyCol] || '0');
      const qty = parseInt(qtyRaw.replace(/[^\d]/g, ''), 10) || 0;
      if (qty <= 0) {
        skippedRows++;
        continue; // Skip rows with 0 or invalid qty
      }

      // Check if product identifier exists
      const barcode = barcodeCol !== -1 ? String(row[barcodeCol] || '').trim() : '';
      const sku = skuCol !== -1 ? String(row[skuCol] || '').trim() : '';
      const nama = namaCol !== -1 ? String(row[namaCol] || '').trim() : '';

      if (!nama && !sku && !barcode) {
        skippedRows++;
        continue;
      }

      // Format date if needed, but preserve all other columns exactly as is
      const finalRow = [...row];
      
      if (tanggalCol !== -1) {
        const rawDate = row[tanggalCol];
        if (rawDate instanceof Date) {
          finalRow[tanggalCol] = rawDate.toISOString().split('T')[0];
        } else if (rawDate) {
          finalRow[tanggalCol] = String(rawDate).split(' ')[0];
        }
      }

      // Fill empty cells with empty strings up to header length to ensure alignment
      while (finalRow.length < sheetHeaders.length) {
        finalRow.push('');
      }

      // Trim to header length in case row has extra unheadered data
      bulkValues.push(finalRow.slice(0, sheetHeaders.length));
    }

    if (bulkValues.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Tidak ada baris data valid yang ditemukan dalam file Excel',
      }, { status: 400 });
    }

    // ====================================================
    // Bulk append to Google Sheet
    // ====================================================
    // Split into chunks of 500 rows max to avoid API limits
    const CHUNK_SIZE = 500;
    for (let i = 0; i < bulkValues.length; i += CHUNK_SIZE) {
      const chunk = bulkValues.slice(i, i + CHUNK_SIZE);
      await appendSheetDataBulk(SHEET_NAME, chunk);
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${bulkValues.length} baris data penjualan${skippedRows > 0 ? ` (${skippedRows} baris dilewati karena qty kosong/invalid)` : ''}`,
      imported: bulkValues.length,
      skipped: skippedRows,
      columns_detected: {
        tanggal: tanggalCol !== -1 ? rawHeaders[tanggalCol] : '(default: hari ini)',
        barcode: barcodeCol !== -1 ? rawHeaders[barcodeCol] : '(tidak ditemukan)',
        sku: skuCol !== -1 ? rawHeaders[skuCol] : '(tidak ditemukan)',
        nama: namaCol !== -1 ? rawHeaders[namaCol] : '(tidak ditemukan)',
        qty: rawHeaders[qtyCol],
        platform: platformCol !== -1 ? rawHeaders[platformCol] : '(tidak ditemukan)',
      },
    });
  } catch (error) {
    console.error('Error uploading sales Excel:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memproses file Excel. Pastikan format file benar.' },
      { status: 500 }
    );
  }
}
