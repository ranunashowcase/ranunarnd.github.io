import { NextRequest, NextResponse } from 'next/server';
import { getSheetData, appendSheetData, generateId, getCurrentTimestamp, initializeSheetHeaders } from '@/lib/sheets-service';
import { ProductSchema, Product } from '@/types';

const SHEET_NAME = 'Products';
const HEADERS = ['product_id', 'product_name', 'variant', 'status', 'category', 'nutrition_highlight', 'cogs', 'created_at'];

export async function GET() {
  try {
    // Initialize headers if sheet is empty
    await initializeSheetHeaders(SHEET_NAME, HEADERS);

    const data = await getSheetData<Product>(SHEET_NAME);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data produk' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ProductSchema.parse(body);

    // Initialize headers if sheet is empty
    await initializeSheetHeaders(SHEET_NAME, HEADERS);

    // Get existing data to generate ID
    const existingData = await getSheetData<Product>(SHEET_NAME);
    const existingIds = existingData.map((p) => p.product_id);
    const newId = generateId('PRD', existingIds);
    const timestamp = getCurrentTimestamp();

    // Append row in order matching HEADERS
    await appendSheetData(SHEET_NAME, [
      newId,
      validated.product_name,
      validated.variant || '',
      validated.status,
      validated.category,
      validated.nutrition_highlight || '',
      validated.cogs,
      timestamp,
    ]);

    return NextResponse.json({
      success: true,
      data: { product_id: newId, ...validated, created_at: timestamp },
    });
  } catch (error) {
    console.error('Error creating product:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Data tidak valid', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan data produk' },
      { status: 500 }
    );
  }
}
