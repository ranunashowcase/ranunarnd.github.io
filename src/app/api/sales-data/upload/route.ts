export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextResponse } from 'next/server';
import { appendSheetDataBulk } from '@/lib/sheets-service';
import { getGoogleSheetsClient, getSpreadsheetId } from '@/lib/google-sheets';
import * as XLSX from 'xlsx';

const SHEET_NAME = 'PEMESANAN PRODUK';

// ====================================================
// Keyword groups: map concept → possible Excel column names
// Used to match Excel headers to the actual sheet columns
// ====================================================
const KEYWORD_GROUPS: Record<string, string[]> = {
  'tanggal':     ['waktu pesanan dibuat', 'waktu pesanan', 'tanggal pesanan', 'tanggal order', 'order date', 'tanggal', 'date', 'waktu', 'tgl', 'created', 'bulan'],
  'no_pesanan':  ['no pesanan', 'no. pesanan', 'nomor pesanan', 'order number', 'no order', 'order id', 'order no', 'id pesanan'],
  'barcode':     ['barcode produk', 'barcode_produk', 'barcode', 'kode barcode', 'product barcode'],
  'sku':         ['nomor referensi sku', 'sku produk', 'sku_produk', 'sku induk', 'sku per produk', 'sku', 'product sku', 'referensi sku'],
  'nama':        ['nama produk', 'nama_produk', 'nama barang', 'nama_barang', 'product name', 'produk', 'item name', 'nama item', 'barang'],
  'qty':         ['kuantitas', 'quantity', 'jumlah produk', 'jumlah pesanan', 'jumlah', 'qty', 'jml', 'total qty', 'banyak'],
  'resi':        ['no resi', 'no. resi', 'nomor resi', 'resi', 'tracking', 'tracking number', 'awb'],
  'ekspedisi':   ['ekspedisi', 'kurir', 'shipping', 'jasa kirim', 'pengiriman', 'opsi pengiriman'],
  'platform':    ['platform', 'marketplace', 'channel', 'toko', 'store', 'shop', 'sumber pesanan'],
  'admin':       ['admin', 'handler', 'operator', 'pic'],
  'status':      ['status pesanan', 'status pembatalan', 'status order', 'status'],
  'harga':       ['harga awal', 'harga satuan', 'harga produk', 'harga', 'price'],
  'total':       ['total harga', 'total pembayaran', 'total pesanan', 'subtotal', 'total'],
};

// Map sheet column names to keyword group concepts
const SHEET_COL_TO_CONCEPT: Record<string, string> = {
  'No': '',           // Auto-generated, not from Excel
  'Bulan': '',        // Auto-generated
  'Tanggal': 'tanggal',
  'No. Pesanan': 'no_pesanan',
  'Barcode': 'barcode',
  'SKU': 'sku',
  'Nama Barang': 'nama',
  'Qty': 'qty',
  'No. Resi': 'resi',
  'Ekspedisi': 'ekspedisi',
  'Platfrom': 'platform',  // Note: typo preserved to match actual sheet
  'Admin': 'admin',
};

/**
 * Find which concept group an Excel header belongs to
 */
function findConcept(excelHeader: string): string | null {
  const headerLower = excelHeader.toLowerCase().trim();
  if (!headerLower) return null;

  let bestMatch: { concept: string; matchLen: number } | null = null;
  
  for (const [concept, keywords] of Object.entries(KEYWORD_GROUPS)) {
    for (const kw of keywords) {
      if (headerLower.includes(kw) || kw.includes(headerLower)) {
        if (!bestMatch || kw.length > bestMatch.matchLen) {
          bestMatch = { concept, matchLen: kw.length };
        }
      }
    }
  }
  
  return bestMatch?.concept || null;
}

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
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
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

    const wsName = workbook.SheetNames[0];
    if (!wsName) {
      return NextResponse.json(
        { success: false, error: 'File Excel kosong — tidak ada sheet ditemukan' },
        { status: 400 }
      );
    }

    const worksheet = workbook.Sheets[wsName];
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!rawData || rawData.length < 2) {
      return NextResponse.json(
        { success: false, error: 'File Excel tidak memiliki data (minimal header + 1 baris data)' },
        { status: 400 }
      );
    }

    // ====================================================
    // 1. Read existing sheet headers from Google Sheets
    // ====================================================
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    
    let sheetHeaders: string[];
    let existingRowCount = 0;
    try {
      const headerRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${SHEET_NAME}!A1:Z1`,
      });
      sheetHeaders = (headerRes.data.values?.[0] || []) as string[];
      
      // Count existing rows
      const countRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${SHEET_NAME}!A:A`,
      });
      existingRowCount = (countRes.data.values?.length || 1) - 1; // minus header
    } catch {
      // Sheet doesn't exist, use default headers
      sheetHeaders = ['No', 'Bulan', 'Tanggal', 'No. Pesanan', 'Barcode', 'SKU', 'Nama Barang', 'Qty', 'No. Resi', 'Ekspedisi', 'Platfrom', 'Admin'];
    }

    console.log('Sheet headers:', sheetHeaders);

    // ====================================================
    // 2. Map Excel headers → sheet column positions
    // ====================================================
    const rawHeaders: string[] = rawData[0].map((h: any) => String(h).trim());
    
    // For each sheet column, find which Excel column maps to it
    const sheetColToExcelIdx: Map<number, number> = new Map();
    const usedExcelCols = new Set<number>();
    const mappingLog: string[] = [];

    for (let sheetIdx = 0; sheetIdx < sheetHeaders.length; sheetIdx++) {
      const sheetCol = sheetHeaders[sheetIdx];
      const concept = SHEET_COL_TO_CONCEPT[sheetCol];
      
      if (!concept) continue; // Skip auto-generated columns like No, Bulan
      
      // Find matching Excel column for this concept
      for (let excelIdx = 0; excelIdx < rawHeaders.length; excelIdx++) {
        if (usedExcelCols.has(excelIdx)) continue;
        
        const excelConcept = findConcept(rawHeaders[excelIdx]);
        if (excelConcept === concept) {
          sheetColToExcelIdx.set(sheetIdx, excelIdx);
          usedExcelCols.add(excelIdx);
          mappingLog.push(`${rawHeaders[excelIdx]} → ${sheetCol}`);
          break;
        }
      }
    }

    console.log('Column mappings:', mappingLog.join(', '));

    // Validate: need at least nama/sku/barcode + qty
    const hasProductId = Array.from(sheetColToExcelIdx.entries()).some(([sheetIdx]) => {
      const col = sheetHeaders[sheetIdx];
      return col === 'Barcode' || col === 'SKU' || col === 'Nama Barang';
    });
    const hasQty = Array.from(sheetColToExcelIdx.entries()).some(([sheetIdx]) => {
      return sheetHeaders[sheetIdx] === 'Qty';
    });

    if (!hasProductId) {
      return NextResponse.json({
        success: false,
        error: `Kolom produk tidak ditemukan di Excel. Pastikan ada kolom seperti "Nama Produk", "SKU", atau "Barcode".\n\nHeader Excel: [${rawHeaders.join(', ')}]\nMapping: ${mappingLog.join(', ') || '(tidak ada)'}`,
      }, { status: 400 });
    }

    if (!hasQty) {
      return NextResponse.json({
        success: false,
        error: `Kolom jumlah/qty tidak ditemukan di Excel.\n\nHeader Excel: [${rawHeaders.join(', ')}]\nMapping: ${mappingLog.join(', ') || '(tidak ada)'}`,
      }, { status: 400 });
    }

    // ====================================================
    // 3. Build rows matching sheet column structure
    // ====================================================
    const dataRows = rawData.slice(1);
    const bulkValues: (string | number)[][] = [];
    let skippedRows = 0;
    let rowCounter = existingRowCount;

    // Find sheet column indices for validation
    const qtySheetIdx = sheetHeaders.indexOf('Qty');
    const barcodeSheetIdx = sheetHeaders.indexOf('Barcode');
    const skuSheetIdx = sheetHeaders.indexOf('SKU');
    const namaSheetIdx = sheetHeaders.indexOf('Nama Barang');
    const tanggalSheetIdx = sheetHeaders.indexOf('Tanggal');
    const noSheetIdx = sheetHeaders.indexOf('No');

    for (const row of dataRows) {
      // Build the row matching sheet column order
      const finalRow: (string | number)[] = new Array(sheetHeaders.length).fill('');

      // Fill mapped columns from Excel
      for (const [sheetIdx, excelIdx] of sheetColToExcelIdx.entries()) {
        let value = row[excelIdx];

        // Format dates
        if (sheetHeaders[sheetIdx] === 'Tanggal') {
          if (value instanceof Date) {
            value = value.toISOString().split('T')[0];
          } else if (value) {
            const strVal = String(value).trim();
            if (strVal.includes('T')) value = strVal.split('T')[0];
            else if (strVal.includes(' ')) value = strVal.split(' ')[0];
            else value = strVal;
          }
        }

        // Ensure qty is numeric
        if (sheetHeaders[sheetIdx] === 'Qty') {
          value = parseInt(String(value || '0').replace(/[^\d]/g, ''), 10) || 0;
        }

        if (value instanceof Date) {
          finalRow[sheetIdx] = value.toISOString().split('T')[0];
        } else if (value !== undefined && value !== null) {
          finalRow[sheetIdx] = typeof value === 'number' ? value : String(value);
        }
      }

      // Validate: qty > 0
      const qty = typeof finalRow[qtySheetIdx] === 'number' 
        ? finalRow[qtySheetIdx] 
        : parseInt(String(finalRow[qtySheetIdx] || '0').replace(/\D/g, ''), 10) || 0;
      if (qty <= 0) {
        skippedRows++;
        continue;
      }

      // Validate: has at least one product identifier
      const hasBarcode = String(finalRow[barcodeSheetIdx] || '').trim().length > 0;
      const hasSku = String(finalRow[skuSheetIdx] || '').trim().length > 0;
      const hasNama = String(finalRow[namaSheetIdx] || '').trim().length > 0;
      if (!hasBarcode && !hasSku && !hasNama) {
        skippedRows++;
        continue;
      }

      // Auto-fill No column
      if (noSheetIdx >= 0) {
        rowCounter++;
        finalRow[noSheetIdx] = rowCounter;
      }

      // If no date, fill with today
      if (tanggalSheetIdx >= 0 && !String(finalRow[tanggalSheetIdx]).trim()) {
        finalRow[tanggalSheetIdx] = new Date().toISOString().split('T')[0];
      }

      bulkValues.push(finalRow);
    }

    if (bulkValues.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Tidak ada baris data valid yang ditemukan dalam file Excel',
      }, { status: 400 });
    }

    // ====================================================
    // 4. Bulk append to Google Sheet
    // ====================================================
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
      columns_detected: Object.fromEntries(mappingLog.map(m => m.split(' → ')).map(([a, b]) => [b, a])),
    });
  } catch (error) {
    console.error('Error uploading sales Excel:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memproses file Excel. Pastikan format file benar.' },
      { status: 500 }
    );
  }
}

