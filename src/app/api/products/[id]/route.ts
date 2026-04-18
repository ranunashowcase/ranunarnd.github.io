export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { deleteSheetRow } from '@/lib/sheets-service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Sheet Name: Products
    // idColumnIndex: 0 (product_id is the first column)
    const success = await deleteSheetRow('Products', 0, id);

    if (success) {
      return NextResponse.json({ success: true, message: 'Product deleted successfully' });
    } else {
      return NextResponse.json(
        { success: false, error: 'Product not found or already deleted' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
