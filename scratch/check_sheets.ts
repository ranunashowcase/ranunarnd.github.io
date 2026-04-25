import { getSheetData } from '../src/lib/sheets-service';

async function main() {
  try {
    const pemesanan = await getSheetData('PEMESANAN PRODUKSI');
    console.log('PEMESANAN PRODUKSI rows:', pemesanan.slice(0, 2));

    const masterSku = await getSheetData('MASTER SKU');
    console.log('MASTER SKU rows:', masterSku.slice(0, 2));
  } catch (error) {
    console.error(error);
  }
}

main();
