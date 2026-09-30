import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { StockAdjustmentModel, ProductModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    let adjustments = await StockAdjustmentModel.find({}).sort({ createdAt: -1 });

    if (adjustments.length === 0) {
      const defaultAdjustments = [
        {
          adjustmentNumber: 'ADJ-2026-001',
          date: '2026-03-20',
          warehouseName: 'Main Warehouse - Hub A',
          productId: '',
          productName: 'Sony WH-1000XM5 Wireless Headphones',
          sku: 'SNY-WH1000XM5',
          type: 'Addition',
          quantity: 5,
          reason: 'Found physical inventory discrepancy during audit',
          adjustedBy: 'Inventory Manager',
          notes: 'Added surplus units found in Section C2'
        },
        {
          adjustmentNumber: 'ADJ-2026-002',
          date: '2026-03-24',
          warehouseName: 'Main Warehouse - Hub A',
          productId: '',
          productName: 'Logitech MX Master 3S Wireless Mouse',
          sku: 'LOG-MX3S-BLK',
          type: 'Subtraction',
          quantity: 2,
          reason: 'Damaged in transit / water spill',
          adjustedBy: 'Warehouse Lead',
          notes: 'Scrapped damaged units'
        }
      ];
      await StockAdjustmentModel.insertMany(defaultAdjustments);
      adjustments = await StockAdjustmentModel.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json(adjustments);
  } catch (error: any) {
    console.error('Fetch Stock Adjustments Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch adjustments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.adjustmentNumber || !body.productName || !body.quantity) {
      return NextResponse.json({ error: 'Adjustment number, product, and quantity are required' }, { status: 400 });
    }

    const qty = Math.abs(Number(body.quantity));
    const isAddition = body.type === 'Addition';
    const delta = isAddition ? qty : -qty;

    // Record adjustment
    const newAdjustment = await StockAdjustmentModel.create({
      adjustmentNumber: body.adjustmentNumber.toUpperCase(),
      date: body.date || new Date().toISOString().split('T')[0],
      warehouseName: body.warehouseName || 'Main Warehouse - Hub A',
      productId: body.productId || '',
      productName: body.productName,
      sku: body.sku || '',
      type: body.type || 'Addition',
      quantity: qty,
      reason: body.reason || 'Inventory Count Adjustment',
      adjustedBy: body.adjustedBy || 'Admin',
      notes: body.notes || ''
    });

    // Update Product Stock in database if productId or sku is present
    if (body.productId) {
      await ProductModel.findByIdAndUpdate(body.productId, {
        $inc: { openingStock: delta }
      });
    } else if (body.sku) {
      await ProductModel.findOneAndUpdate({ sku: body.sku }, {
        $inc: { openingStock: delta }
      });
    }

    return NextResponse.json(newAdjustment, { status: 201 });
  } catch (error: any) {
    console.error('Create Adjustment Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create adjustment' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Adjustment ID is required' }, { status: 400 });
    }

    await StockAdjustmentModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Adjustment deleted successfully' });
  } catch (error: any) {
    console.error('Delete Adjustment Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete adjustment' }, { status: 500 });
  }
}
