import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { BatchModel, ProductModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    let batches = await BatchModel.find({}).sort({ createdAt: -1 });

    if (batches.length === 0) {
      // Find products to associate with sample batches
      const products = await ProductModel.find({});
      const p1 = products[0] || { _id: 'prod1', name: 'MacBook Pro M3 Max 16"', sku: 'MBP-M3-16-01' };
      const p2 = products[1] || { _id: 'prod2', name: 'Samsung Galaxy S24 Ultra 512GB', sku: 'SM-S24U-512' };
      const p3 = products[2] || { _id: 'prod3', name: 'Sony WH-1000XM5 Wireless Headphones', sku: 'SNY-WH1000XM5' };

      const defaultBatches = [
        {
          batchNumber: 'BAT-2026-001',
          productId: p1._id.toString(),
          productName: p1.name,
          sku: p1.sku,
          mfgDate: '2026-01-10',
          expDate: '2028-01-10',
          quantity: 24,
          remainingQuantity: 24,
          costPrice: 280000,
          status: 'Active'
        },
        {
          batchNumber: 'BAT-2026-002',
          productId: p2._id.toString(),
          productName: p2.name,
          sku: p2.sku,
          mfgDate: '2026-02-15',
          expDate: '2027-08-15',
          quantity: 40,
          remainingQuantity: 38,
          costPrice: 95000,
          status: 'Active'
        },
        {
          batchNumber: 'BAT-2025-089',
          productId: p3._id.toString(),
          productName: p3.name,
          sku: p3.sku,
          mfgDate: '2025-06-01',
          expDate: '2026-06-01',
          quantity: 65,
          remainingQuantity: 12,
          costPrice: 22000,
          status: 'Active'
        }
      ];
      await BatchModel.insertMany(defaultBatches);
      batches = await BatchModel.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json(batches);
  } catch (error: any) {
    console.error('Fetch Batches Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch batches' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.batchNumber || !body.productName) {
      return NextResponse.json({ error: 'Batch number and product are required' }, { status: 400 });
    }

    const existing = await BatchModel.findOne({ batchNumber: body.batchNumber });
    if (existing) {
      return NextResponse.json({ error: 'Batch number already exists' }, { status: 400 });
    }

    const totalQty = Number(body.quantity) || 0;
    const newBatch = await BatchModel.create({
      batchNumber: body.batchNumber.toUpperCase(),
      productId: body.productId || '',
      productName: body.productName,
      sku: body.sku || '',
      mfgDate: body.mfgDate || '',
      expDate: body.expDate || '',
      quantity: totalQty,
      remainingQuantity: body.remainingQuantity !== undefined ? Number(body.remainingQuantity) : totalQty,
      costPrice: Number(body.costPrice) || 0,
      status: body.status || 'Active'
    });

    return NextResponse.json(newBatch, { status: 201 });
  } catch (error: any) {
    console.error('Create Batch Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create batch' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    if (updateData.quantity !== undefined) updateData.quantity = Number(updateData.quantity);
    if (updateData.remainingQuantity !== undefined) updateData.remainingQuantity = Number(updateData.remainingQuantity);
    if (updateData.costPrice !== undefined) updateData.costPrice = Number(updateData.costPrice);

    const updated = await BatchModel.findByIdAndUpdate(_id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update Batch Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update batch' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    await BatchModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Batch deleted successfully' });
  } catch (error: any) {
    console.error('Delete Batch Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete batch' }, { status: 500 });
  }
}
