export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSheetData, appendSheetData, generateId, getCurrentTimestamp, initializeSheetHeaders } from '@/lib/sheets-service';
import { PackagingSchema, PackagingAnalysis } from '@/types';

const SHEET_NAME = 'PackagingAnalysis';
const HEADERS = [
  'packaging_id', 'target_product', 'packaging_type', 'material_specs',
  'current_trend', 'visual_reference_url', 'moq', 'price_per_pcs',
  'qty_per_carton', 'arrangement_layout', 'created_at',
];

export async function GET() {
  try {
    await initializeSheetHeaders(SHEET_NAME, HEADERS);

    const data = await getSheetData<PackagingAnalysis>(SHEET_NAME);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching packaging:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data packaging' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = PackagingSchema.parse(body);

    await initializeSheetHeaders(SHEET_NAME, HEADERS);

    const existingData = await getSheetData<PackagingAnalysis>(SHEET_NAME);
    const existingIds = existingData.map((p) => p.packaging_id);
    const newId = generateId('PKG', existingIds);
    const timestamp = getCurrentTimestamp();

    await appendSheetData(SHEET_NAME, [
      newId,
      validated.target_product,
      validated.packaging_type,
      validated.material_specs,
      validated.current_trend || '',
      validated.visual_reference_url || '',
      validated.moq,
      validated.price_per_pcs,
      validated.qty_per_carton,
      validated.arrangement_layout || '',
      timestamp,
    ]);

    return NextResponse.json({
      success: true,
      data: { packaging_id: newId, ...validated, created_at: timestamp },
    });
  } catch (error) {
    console.error('Error creating packaging:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Data tidak valid', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan data packaging' },
      { status: 500 }
    );
  }
}

