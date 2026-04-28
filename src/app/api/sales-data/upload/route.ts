export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Excel upload may take time

import { NextResponse } from 'next/server';
import { initializeSheetHeaders, appendSheetDataBulk, getSheetData } from '@/lib/sheets-service';
import * as XLSX from 'xlsx';

const SHEET_NAME = 'PEMESANAN PRODUK';

// ====================================================
// Canonical target columns for PEMESANAN PRODUK
// These are the standard columns the system expects.
// All downstream consumers (sales-data GET, data-all, AI routes)
// read these column names from the sheet.
// ====================================================
const CANONICAL_COLUMNS = [
  'Tanggal',
  'Barcode Produk',
  'SKU Produk',
  'Nama Produk',
  'Nama Barang',
  'Qty',
  'Platform',
  'Harga',
  'Total',
  'Status',
  'Nomor Referensi SKU',
  'SKU Induk',
] as const;

// ====================================================
// Smart keyword mapping: target column → possible Excel column keywords
// Each target column has a list of keywords (lowercase) that could
// appear in the Excel header to identify it.
// Priority order matters — first match wins.
// ====================================================
interface ColumnMapping {
  target: string;
  keywords: string[];
  /** If true, this column is critical for validation */
  isProductIdentifier?: boolean;
  isQty?: boolean;
}

const COLUMN_MAPPINGS: ColumnMapping[] = [
  {
    target: 'Tanggal',
    keywords: [
      'waktu pesanan dibuat', 'waktu pesanan', 'tanggal pesanan', 'tanggal order',
      'order date', 'tanggal', 'date', 'waktu dibuat', 'waktu', 'tgl',
      'created', 'order_date', 'tanggal_order',
    ],
  },
  {
    target: 'Barcode Produk',
    keywords: [
      'barcode produk', 'barcode_produk', 'barcode', 'kode barcode', 'product barcode',
    ],
    isProductIdentifier: true,
  },
  {
    target: 'SKU Produk',
    keywords: [
      'sku produk', 'sku_produk', 'sku per produk', 'product sku',
    ],
    isProductIdentifier: true,
  },
  {
    target: 'Nomor Referensi SKU',
    keywords: [
      'nomor referensi sku', 'nomor referensi', 'referensi sku', 'ref sku', 'no referensi',
      'no ref', 'reference', 'nomor_referensi',
    ],
    isProductIdentifier: true,
  },
  {
    target: 'SKU Induk',
    keywords: [
      'sku induk', 'sku_induk', 'parent sku', 'induk sku', 'sku parent',
    ],
    isProductIdentifier: true,
  },
  {
    target: 'Nama Produk',
    keywords: [
      'nama produk', 'nama_produk', 'product name', 'produk', 'item name',
      'nama item', 'product',
    ],
    isProductIdentifier: true,
  },
  {
    target: 'Nama Barang',
    keywords: [
      'nama barang', 'nama_barang', 'goods name', 'barang', 'item',
    ],
    isProductIdentifier: true,
  },
  {
    target: 'Qty',
    keywords: [
      'kuantitas', 'quantity', 'jumlah produk', 'jumlah pesanan', 'jumlah',
      'qty', 'jml', 'total qty', 'total_qty', 'banyak',
    ],
    isQty: true,
  },
  {
    target: 'Platform',
    keywords: [
      'platform', 'marketplace', 'channel', 'toko', 'store', 'shop',
      'sumber pesanan', 'sumber order', 'source',
    ],
  },
  {
    target: 'Harga',
    keywords: [
      'harga awal', 'harga satuan', 'harga produk', 'harga', 'price', 'unit price',
      'harga_satuan', 'harga asli',
    ],
  },
  {
    target: 'Total',
    keywords: [
      'total harga', 'total pembayaran', 'total pesanan', 'total bayar',
      'total_harga', 'subtotal', 'sub total', 'amount', 'total',
    ],
  },
  {
    target: 'Status',
    keywords: [
      'status pesanan', 'status pembatalan', 'status order', 'status pengiriman',
      'status', 'order status',
    ],
  },
];

/**
 * Intelligently match an Excel header to the best canonical target column.
 * Uses keyword matching with prioritized ordering.
 * Longer/more-specific keywords are checked first for accuracy.
 */
function findBestMatch(excelHeader: string, usedTargets: Set<string>): string | null {
  const headerLower = excelHeader.toLowerCase().trim();
  if (!headerLower) return null;

  // Try each mapping in order; longer keyword match = more specific = better
  let bestMatch: { target: string; keywordLen: number } | null = null;

  for (const mapping of COLUMN_MAPPINGS) {
    if (usedTargets.has(mapping.target)) continue; // already mapped

    for (const kw of mapping.keywords) {
      if (headerLower.includes(kw) || kw.includes(headerLower)) {
        // Prefer longer keyword matches (more specific)
        if (!bestMatch || kw.length > bestMatch.keywordLen) {
          bestMatch = { target: mapping.target, keywordLen: kw.length };
        }
      }
    }
  }

  return bestMatch?.target || null;
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
    // 1. Extract Excel headers
    // ====================================================
    const rawHeaders: string[] = rawData[0].map((h: any) => String(h).trim());

    // ====================================================
    // 2. Smart column mapping: Excel header → canonical target
    // ====================================================
    const usedTargets = new Set<string>();
    const columnMap: { excelIndex: number; excelHeader: string; targetColumn: string }[] = [];
    const unmappedColumns: string[] = [];

    for (let i = 0; i < rawHeaders.length; i++) {
      const header = rawHeaders[i];
      if (!header) continue;

      const target = findBestMatch(header, usedTargets);
      if (target) {
        columnMap.push({ excelIndex: i, excelHeader: header, targetColumn: target });
        usedTargets.add(target);
      } else {
        unmappedColumns.push(header);
      }
    }

    // ====================================================
    // 3. Validation: we need at least product identifier + qty
    // ====================================================
    const hasProductId = columnMap.some(m => {
      const mapping = COLUMN_MAPPINGS.find(cm => cm.target === m.targetColumn);
      return mapping?.isProductIdentifier;
    });
    const hasQty = columnMap.some(m => {
      const mapping = COLUMN_MAPPINGS.find(cm => cm.target === m.targetColumn);
      return mapping?.isQty;
    });

    if (!hasProductId) {
      return NextResponse.json({
        success: false,
        error: `Kolom produk tidak ditemukan. Pastikan Excel memiliki kolom seperti "Nama Produk", "SKU", atau "Barcode".\n\nHeader Excel yang terdeteksi: [${rawHeaders.join(', ')}]\n\nKolom yang berhasil dicocokkan: ${columnMap.map(m => `${m.excelHeader} → ${m.targetColumn}`).join(', ') || '(tidak ada)'}`,
      }, { status: 400 });
    }

    if (!hasQty) {
      return NextResponse.json({
        success: false,
        error: `Kolom quantity tidak ditemukan. Pastikan Excel memiliki kolom seperti "Qty", "Jumlah", atau "Kuantitas".\n\nHeader Excel yang terdeteksi: [${rawHeaders.join(', ')}]\n\nKolom yang berhasil dicocokkan: ${columnMap.map(m => `${m.excelHeader} → ${m.targetColumn}`).join(', ') || '(tidak ada)'}`,
      }, { status: 400 });
    }

    // ====================================================
    // 4. Determine final sheet headers
    //    Use existing sheet headers if they exist,
    //    otherwise build from canonical columns that are mapped.
    // ====================================================
    let sheetHeaders: string[];
    try {
      const existingData = await getSheetData<Record<string, string>>(SHEET_NAME);
      // getSheetData returns [] if sheet is empty/missing, but headers
      // are inferred from the first row — we need to check if there's structure
      if (existingData.length > 0) {
        // Sheet has data, extract existing headers from the first record's keys
        sheetHeaders = Object.keys(existingData[0]);
      } else {
        // No existing data — build headers from mapped columns
        sheetHeaders = columnMap.map(m => m.targetColumn);
      }
    } catch {
      // Sheet doesn't exist yet — build from mapped columns
      sheetHeaders = columnMap.map(m => m.targetColumn);
    }

    // Ensure all mapped target columns exist in sheetHeaders
    for (const m of columnMap) {
      if (!sheetHeaders.includes(m.targetColumn)) {
        sheetHeaders.push(m.targetColumn);
      }
    }

    await initializeSheetHeaders(SHEET_NAME, sheetHeaders);

    // ====================================================
    // 5. Build index maps for fast row transformation
    // ====================================================
    // Map: target column name → index in sheetHeaders
    const targetIndexMap = new Map<string, number>();
    sheetHeaders.forEach((h, i) => targetIndexMap.set(h, i));

    // Find indices for validation columns
    const qtyMapping = columnMap.find(m => {
      const cm = COLUMN_MAPPINGS.find(c => c.target === m.targetColumn);
      return cm?.isQty;
    });
    const tanggalMapping = columnMap.find(m => m.targetColumn === 'Tanggal');
    const productIdMappings = columnMap.filter(m => {
      const cm = COLUMN_MAPPINGS.find(c => c.target === m.targetColumn);
      return cm?.isProductIdentifier;
    });

    // ====================================================
    // 6. Parse rows and build bulk data in canonical format
    // ====================================================
    const dataRows = rawData.slice(1); // skip header
    const bulkValues: (string | number)[][] = [];
    let skippedRows = 0;

    for (const row of dataRows) {
      // Validate qty
      if (qtyMapping) {
        const qtyRaw = String(row[qtyMapping.excelIndex] || '0');
        const qty = parseInt(qtyRaw.replace(/[^\d]/g, ''), 10) || 0;
        if (qty <= 0) {
          skippedRows++;
          continue;
        }
      }

      // Validate product identifier — at least one must have a value
      const hasAnyProductId = productIdMappings.some(m => {
        const val = String(row[m.excelIndex] || '').trim();
        return val.length > 0;
      });
      if (!hasAnyProductId) {
        skippedRows++;
        continue;
      }

      // Build the canonical row
      const finalRow: (string | number)[] = new Array(sheetHeaders.length).fill('');

      for (const m of columnMap) {
        const targetIdx = targetIndexMap.get(m.targetColumn);
        if (targetIdx === undefined) continue;

        let value = row[m.excelIndex];

        // Special handling: format date columns
        if (m.targetColumn === 'Tanggal') {
          if (value instanceof Date) {
            value = value.toISOString().split('T')[0];
          } else if (value) {
            // Try to extract YYYY-MM-DD from various formats
            const strVal = String(value).trim();
            // Handle "2024-01-15 10:30:00" or "2024-01-15T10:30:00" formats
            if (strVal.includes('T')) {
              value = strVal.split('T')[0];
            } else if (strVal.includes(' ')) {
              value = strVal.split(' ')[0];
            } else {
              value = strVal;
            }
          }
        }

        // Special handling: ensure qty is numeric
        if (m.targetColumn === 'Qty') {
          const numVal = parseInt(String(value || '0').replace(/[^\d]/g, ''), 10) || 0;
          value = numVal;
        }

        // Convert to string/number
        if (value instanceof Date) {
          finalRow[targetIdx] = value.toISOString().split('T')[0];
        } else if (value !== undefined && value !== null) {
          finalRow[targetIdx] = typeof value === 'number' ? value : String(value);
        }
      }

      // If no date was mapped but we have a Tanggal column, fill with today
      if (!tanggalMapping) {
        const tanggalIdx = targetIndexMap.get('Tanggal');
        if (tanggalIdx !== undefined && !finalRow[tanggalIdx]) {
          finalRow[tanggalIdx] = new Date().toISOString().split('T')[0];
        }
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
    // 7. Bulk append to Google Sheet
    // ====================================================
    const CHUNK_SIZE = 500;
    for (let i = 0; i < bulkValues.length; i += CHUNK_SIZE) {
      const chunk = bulkValues.slice(i, i + CHUNK_SIZE);
      await appendSheetDataBulk(SHEET_NAME, chunk);
    }

    // Build readable mapping result for the response
    const mappingResult: Record<string, string> = {};
    for (const m of columnMap) {
      mappingResult[m.targetColumn] = m.excelHeader;
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${bulkValues.length} baris data penjualan${skippedRows > 0 ? ` (${skippedRows} baris dilewati karena qty kosong/invalid atau tanpa identitas produk)` : ''}`,
      imported: bulkValues.length,
      skipped: skippedRows,
      columns_detected: mappingResult,
      unmapped_columns: unmappedColumns.length > 0 ? unmappedColumns : undefined,
    });
  } catch (error) {
    console.error('Error uploading sales Excel:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memproses file Excel. Pastikan format file benar.' },
      { status: 500 }
    );
  }
}
