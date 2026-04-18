import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient, getSpreadsheetId } from '@/lib/google-sheets';
import * as xlsx from 'xlsx';

const SHEET_NAME = 'TrendingMaster';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse Excel File
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // read first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to 2D array
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

    if (rawData.length < 2) {
      return NextResponse.json({ success: false, error: 'File Excel kosong atau tidak memiliki data baris' }, { status: 400 });
    }

    // Prepare Google Sheets Data
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();

    // 1. Ensure Tab Exists (Clear old data if you want it to be purely replaced, or append. Let's purely replace for a "Master" upload)
    try {
      // Clear existing first
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${SHEET_NAME}!A:Z`,
      });
    } catch (e: any) {
      // If sheet doesn't exist, create it
      if (e?.code === 400 || e?.code === 404) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title: SHEET_NAME } } }],
          },
        });
      }
    }

    // 2. Write new data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rawData,
      },
    });

    return NextResponse.json({ success: true, count: rawData.length - 1 });
  } catch (error) {
    console.error('Error uploading excel:', error);
    return NextResponse.json({ success: false, error: 'Gagal memproses file' }, { status: 500 });
  }
}
