// Fix script using dotenv + app's google-sheets module
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getGoogleSheetsClient, getSpreadsheetId } from '../src/lib/google-sheets';

async function main() {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  // 1. Read all current data
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'PEMESANAN PRODUK!A1:Z1000',
  });
  const rows = res.data.values || [];
  if (rows.length < 2) {
    console.log('No data to fix');
    return;
  }

  const headers: string[] = rows[0];
  console.log('Current headers:', JSON.stringify(headers));
  console.log('Total data rows:', rows.length - 1);

  // Headers: ["No","Bulan","Tanggal","No. Pesanan","Barcode","SKU","Nama Barang","Qty","No. Resi","Ekspedisi","Platfrom","Admin"]
  // Data is misaligned - [counter, date, barcode, sku, nama, qty] occupies first 6 cols
  // Need to shift to match header positions

  const fixedRows: string[][] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Check if data is misaligned: if col[2] looks like a barcode number (>10 digits)
    // or if col[6] (where Nama Barang should be) is empty but col[4] has text
    const col2 = String(row[2] || '');
    const col6 = String(row[6] || '');
    const col4 = String(row[4] || '');
    const isMisaligned = (row.length <= 6) || (/^\d{10,}$/.test(col2) && !col6);

    if (isMisaligned) {
      // Current: [counter, date, barcode, sku, nama, qty]
      // Target:  [No, Bulan, Tanggal, No. Pesanan, Barcode, SKU, Nama Barang, Qty, ...]
      const newRow = new Array(headers.length).fill('');
      newRow[0] = row[0] || '';  // No
      newRow[1] = '';            // Bulan
      newRow[2] = row[1] || '';  // Tanggal
      newRow[3] = '';            // No. Pesanan
      newRow[4] = row[2] || '';  // Barcode
      newRow[5] = row[3] || '';  // SKU
      newRow[6] = row[4] || '';  // Nama Barang
      newRow[7] = row[5] || '';  // Qty
      fixedRows.push(newRow);
      console.log(`Row ${i}: FIXED → Barcode=${newRow[4]}, SKU=${newRow[5]}, Nama=${newRow[6]}, Qty=${newRow[7]}`);
    } else {
      // Already properly aligned
      const newRow = new Array(headers.length).fill('');
      for (let j = 0; j < Math.min(row.length, headers.length); j++) {
        newRow[j] = row[j] || '';
      }
      fixedRows.push(newRow);
      console.log(`Row ${i}: OK → Nama=${newRow[6]}, Qty=${newRow[7]}`);
    }
  }

  // 2. Write fixed data back
  const lastCol = String.fromCharCode(64 + headers.length);
  const writeRange = `PEMESANAN PRODUK!A2:${lastCol}${fixedRows.length + 1}`;
  console.log(`\nWriting ${fixedRows.length} fixed rows to ${writeRange}...`);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: writeRange,
    valueInputOption: 'RAW',
    requestBody: {
      values: fixedRows,
    },
  });

  console.log('DONE! Data re-aligned.');

  // 3. Verify
  const verify = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'PEMESANAN PRODUK!A1:L3',
  });
  console.log('\nVerification:');
  console.log('Headers:', JSON.stringify(verify.data.values?.[0]));
  console.log('Row 2:  ', JSON.stringify(verify.data.values?.[1]));
}

main().catch(console.error);
