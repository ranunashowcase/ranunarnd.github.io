import { NextRequest, NextResponse } from 'next/server';
import { getSheetData, appendSheetData, generateId, getCurrentTimestamp, initializeSheetHeaders } from '@/lib/sheets-service';
import { InputInformation } from '@/types';
const pdfParse = require('pdf-parse');

const SHEET_NAME = 'INPUT INFORMASI';
const HEADERS = ['info_id', 'judul', 'kategori_info', 'sumber', 'konten', 'created_at'];

export async function GET() {
  try {
    await initializeSheetHeaders(SHEET_NAME, HEADERS);
    const data = await getSheetData<InputInformation>(SHEET_NAME);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching input info:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data informasi' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let judul = '';
    let kategori_info = 'Umum';
    let sumber = 'Manual';
    let konten = '';

    const contentType = request.headers.get('content-type') || '';
    
    // Support multipart/form-data for PDF Uploads
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      judul = (formData.get('judul') as string) || '';
      kategori_info = (formData.get('kategori_info') as string) || 'Umum';
      sumber = (formData.get('sumber') as string) || 'Manual';
      konten = (formData.get('konten') as string) || '';

      const file = formData.get('file') as File;
      if (file && file.size > 0) {
        if (file.type === 'application/pdf') {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          try {
            const data = await pdfParse(buffer);
            konten = data.text;
            sumber = 'PDF Upload';
          } catch (pdfErr) {
            console.error('Failed to parse PDF:', pdfErr);
            return NextResponse.json({ success: false, error: 'Gagal mengekstrak teks dari PDF' }, { status: 400 });
          }
        } else {
           return NextResponse.json({ success: false, error: 'File wajib berformat PDF' }, { status: 400 });
        }
      }
    } else {
      // Support standard JSON for raw text
      const body = await request.json();
      judul = body.judul;
      kategori_info = body.kategori_info;
      sumber = body.sumber;
      konten = body.konten;
    }

    if (!judul || !konten) {
      return NextResponse.json(
        { success: false, error: 'Judul dan konten (atau file PDF) wajib diisi' },
        { status: 400 }
      );
    }

    await initializeSheetHeaders(SHEET_NAME, HEADERS);

    const existingData = await getSheetData<InputInformation>(SHEET_NAME);
    const existingIds = existingData.map((d) => d.info_id);
    const newId = generateId('INFO', existingIds);
    const timestamp = getCurrentTimestamp();

    await appendSheetData(SHEET_NAME, [
      newId,
      judul,
      kategori_info,
      sumber,
      // Batasi konten agar tidak melebihi sel Google Sheets (max ~50k chars)
      konten.substring(0, 48000), 
      timestamp,
    ]);

    return NextResponse.json({
      success: true,
      data: { info_id: newId, judul, kategori_info, sumber, konten: konten.substring(0, 200) + '...', created_at: timestamp },
    });
  } catch (error) {
    console.error('Error saving input info:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan data informasi' },
      { status: 500 }
    );
  }
}
