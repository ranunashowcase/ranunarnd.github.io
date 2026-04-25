import { google } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.join(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1).replace(/\\n/g, '\n');
    }
    process.env[key] = val;
  }
});

async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client as any });
}

async function fixHeaders() {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = '1ZhCzCLwcK6tJ5ClUwkUoiPv0qwTu-4Y68yq1te-g4W4'; // Extracted from user URL
    
    const HEADERS = [
      'Timestamp',
      'Tipe Trend',
      'Nama Ide/Produk',
      'Ukuran/Gramasi',
      'Harga Referensi',
      'Link Sosial Media',
      'Foto URL',
      'AI Analisis Lengkap',
      'AI Referensi Serupa',
      'AI Estimasi Durasi Trend',
      'AI Resiko',
      'AI Keuntungan',
      'AI Layak Skor (1-100)',
    ];

    console.log('Memperbarui Header...');
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'MARKET WATCH!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [HEADERS],
      },
    });

    console.log('✅ HEADER BERHASIL DIPERBARUI!');

    // Juga perbaiki baris 3 dan 4 yang bergeser ke kanan
    // Dari A3: 2024-04-... | Trend Produk | roasted almond | 500gr | 15000 | 10000 | link
    // Harusnya Tipe Trend = "Trend Produk", Nama = "roasted almond", Ukuran = "500gr", dll
    console.log('Membaca data lama untuk diperbaiki...');
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'MARKET WATCH!A2:Z100',
    });
    
    const rows = res.data.values;
    if (rows) {
       for (let i = 0; i < rows.length; i++) {
         let row = rows[i];
         // Jika row[1] bukan 'Trend Produk' atau 'Trend Packaging Unik', berarti ini baris lama (cth: "Pistachio Pouch") yang Tipe Trend-nya kosong
         // Kita geser semuanya kanan 1 mulai dari index 1
         let isShifted = false;
         if (row[1] !== 'Trend Produk' && row[1] !== 'Trend Packaging Unik') {
            // Berarti row[1] berisi Nama Produk
            const newRow = [
               row[0], // Timestamp
               'Trend Produk', // Default Tipe Trend
               row[1] || '', // Nama Produk
               row[2] || '', // Ukuran
               row[4] || '', // Harga (asumsi row[4] krn row[3] dulunya estimasi penjualan)
               row[5] || row[4] || '', // Link medsos
               row[6] || row[5] || '', // Foto URL
               '', '', '', '', '', // AI spaces
               row[9] || '' // old Skor AI
            ];
            
            await sheets.spreadsheets.values.update({
              spreadsheetId,
              range: `MARKET WATCH!A${i + 2}`,
              valueInputOption: 'USER_ENTERED',
              requestBody: { values: [newRow] },
            });
            console.log(`Baris ${i+2} diperbaiki formatnya (Tipe Trend ditambahkan)`);
         } else if (row[3] == '10000' && !row[3].includes('gr')) { // Cek baris 3 & 4 user yg bergeser
            // row[0]=Timestamp, row[1]=Trend Produk, row[2]=roasted almond, row[3]=500, row[4]=150000, row[5]=10000 (estimasi dibuang sj), row[6]=link
            const newRow = [
               row[0],
               row[1], // Trend Produk
               row[2] || '', // Nama
               row[3].includes('gr') ? row[3] : '500gr', // ukuran
               row[4] || '', // harga referensi
               row[6] || row[5] || '', // Link
               row[7] || '', // Foto
            ];
            await sheets.spreadsheets.values.update({
              spreadsheetId,
              range: `MARKET WATCH!A${i + 2}`,
              valueInputOption: 'USER_ENTERED',
              requestBody: { values: [newRow] },
            });
            console.log(`Baris ${i+2} diperbaiki formatnya (Geser dan bersihkan Estimasi)`);
         }
       }
    }
    console.log('✅ SEMUA SELESAI');
  } catch (err) {
    console.error('Error:', err);
  }
}

fixHeaders();
