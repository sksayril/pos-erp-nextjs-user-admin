import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { PurchaseModel, ProductModel, SupplierModel } from '../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    const purchases = await PurchaseModel.find({}).sort({ createdAt: -1 });
    return NextResponse.json(purchases);
  } catch (error: any) {
    console.error('Fetch Purchases Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch purchases' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // 1. Process Stock Increments in MongoDB
    for (const item of body.items) {
      await ProductModel.findByIdAndUpdate(
        item.productId,
        { $inc: { openingStock: item.quantity } }
      );
    }

    // 2. Process Supplier Payables Ledger
    if (body.dueAmount > 0) {
      const supplier = await SupplierModel.findById(body.supplierId);
      if (supplier) {
        supplier.outstandingPayable += body.dueAmount;
        await supplier.save();
      } else {
        await SupplierModel.create({
          _id: body.supplierId,
          name: body.supplierName,
          phone: '0000000000',
          outstandingPayable: body.dueAmount,
          status: 'Active'
        });
      }
    }

    // 3. Save Purchase Ticket
    const newPurchase = await PurchaseModel.create(body);
    return NextResponse.json(newPurchase, { status: 201 });
  } catch (error: any) {
    console.error('Create Purchase Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record purchase' }, { status: 500 });
  }
}
