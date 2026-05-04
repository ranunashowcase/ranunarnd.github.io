import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getGoogleSheetsClient, getSpreadsheetId } from '../src/lib/google-sheets';

async function main() {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'PEMESANAN PRODUK!A1:L5',
  });
  const rows = res.data.values || [];
  console.log('Headers:', JSON.stringify(rows[0]));
  console.log('Row 2:', JSON.stringify(rows[1]));
  console.log('Row 3:', JSON.stringify(rows[2]));
  console.log('Row 4:', JSON.stringify(rows[3]));

  // Simulate what getSheetData returns
  const headers = rows[0] as string[];
  for (let i = 1; i < rows.length; i++) {
    const obj: Record<string, string> = {};
    headers.forEach((h, j) => { obj[h] = rows[i][j] || ''; });
    console.log(`\ngetSheetData row ${i}:`, JSON.stringify(obj));
    console.log(`  → Barcode: "${obj['Barcode']}", SKU: "${obj['SKU']}", Nama Barang: "${obj['Nama Barang']}", Qty: "${obj['Qty']}"`);
  }
}
main().catch(console.error);
