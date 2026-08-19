import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { SaleModel, ProductModel, CustomerModel } from '../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    const sales = await SaleModel.find({}).sort({ createdAt: -1 });
    return NextResponse.json(sales);
  } catch (error: any) {
    console.error('Fetch Sales Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // 1. Process Stock Deductions in MongoDB
    for (const item of body.items) {
      await ProductModel.findByIdAndUpdate(
        item.productId,
        { $inc: { openingStock: -item.quantity } }
      );
    }

    // 2. Process Customer Receivables Ledger
    if (body.dueAmount > 0 && body.customerId !== 'cust-1') {
      // Create customer record in DB if not exists to save balance
      const customer = await CustomerModel.findById(body.customerId);
      if (customer) {
        customer.outstandingBalance += body.dueAmount;
        await customer.save();
      } else {
        await CustomerModel.create({
          _id: body.customerId,
          name: body.customerName,
          phone: '0000000000',
          outstandingBalance: body.dueAmount,
          status: 'Active'
        });
      }
    }

    // 3. Save Sale Invoice
    const newSale = await SaleModel.create(body);
    return NextResponse.json(newSale, { status: 201 });
  } catch (error: any) {
    console.error('Create Sale Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record sale' }, { status: 500 });
  }
}
