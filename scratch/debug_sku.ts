import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getGoogleSheetsClient, getSpreadsheetId } from '../src/lib/google-sheets';

async function main() {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  // Full MASTER SKU
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'MASTER SKU!A1:Z200' });
  const rows = res.data.values || [];
  console.log('MASTER SKU Headers:', JSON.stringify(rows[0]));
  console.log('Total rows:', rows.length - 1);
  
  // Show all unique SKU + names
  const seen = new Map();
  for (let i = 1; i < rows.length; i++) {
    const sku = rows[i][1] || '';
    const nama = rows[i][3] || '';
    console.log(`  Row ${i}: Barcode="${rows[i][0]}" SKU="${sku}" SKU_Per="${rows[i][2]}" Nama="${nama}" Qty="${rows[i][4]}"`);
    if (seen.has(nama)) {
      seen.get(nama).push(sku);
    } else {
      seen.set(nama, [sku]);
    }
  }
  
  console.log('\n--- Products with multiple SKUs ---');
  for (const [nama, skus] of seen) {
    if (skus.length > 1) {
      console.log(`  "${nama}" → SKUs: [${skus.join(', ')}]`);
    }
  }
  console.log(`\nTotal unique product names: ${seen.size}`);
  console.log(`Total SKU rows: ${rows.length - 1}`);
}
main().catch(console.error);
