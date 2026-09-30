import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '../../../lib/db';
import { SaleModel, ProductModel, CustomerModel } from '../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    let sales = await SaleModel.find({}).sort({ createdAt: -1 });

    if (sales.length === 0) {
      const defaultSales = [
        {
          invoiceNumber: 'INV-2026-001',
          date: '2026-03-28',
          customerId: 'cust-1',
          customerName: 'Rahul Sharma',
          warehouseId: 'Main Central Hub',
          items: [
            {
              productId: 'prod-1',
              productName: 'MacBook Pro M3 Max 16"',
              sku: 'MBP-M3-16-01',
              quantity: 1,
              price: 349900,
              discount: 5000,
              tax: 62082,
              total: 406982
            }
          ],
          subtotal: 344900,
          discount: 5000,
          tax: 62082,
          grandTotal: 406982,
          paidAmount: 406982,
          dueAmount: 0,
          paymentStatus: 'Paid',
          status: 'Completed',
          paymentMethod: 'UPI'
        },
        {
          invoiceNumber: 'INV-2026-002',
          date: '2026-03-29',
          customerId: 'cust-2',
          customerName: 'TechCorp Solutions Pvt Ltd',
          warehouseId: 'Main Central Hub',
          items: [
            {
              productId: 'prod-2',
              productName: 'Samsung Galaxy S24 Ultra 512GB',
              sku: 'SM-S24U-512',
              quantity: 2,
              price: 129999,
              discount: 10000,
              tax: 44999,
              total: 294997
            }
          ],
          subtotal: 249998,
          discount: 10000,
          tax: 44999,
          grandTotal: 294997,
          paidAmount: 200000,
          dueAmount: 94997,
          paymentStatus: 'Partial',
          status: 'Completed',
          paymentMethod: 'Bank Transfer'
        },
        {
          invoiceNumber: 'INV-2026-003',
          date: '2026-03-30',
          customerId: 'cust-3',
          customerName: 'Priya Patel',
          warehouseId: 'Main Central Hub',
          items: [
            {
              productId: 'prod-3',
              productName: 'Sony WH-1000XM5 Wireless Headphones',
              sku: 'SNY-WH1000XM5',
              quantity: 1,
              price: 29990,
              discount: 0,
              tax: 5398,
              total: 35388
            }
          ],
          subtotal: 29990,
          discount: 0,
          tax: 5398,
          grandTotal: 35388,
          paidAmount: 35388,
          dueAmount: 0,
          paymentStatus: 'Paid',
          status: 'Completed',
          paymentMethod: 'Credit Card'
        }
      ];
      await SaleModel.insertMany(defaultSales);
      sales = await SaleModel.find({}).sort({ createdAt: -1 });
    }

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

    if (!body.invoiceNumber || !body.customerName || !body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'Invoice number, customer, and items are required' }, { status: 400 });
    }

    // 1. Process Stock Deductions in MongoDB
    if (Array.isArray(body.items)) {
      for (const item of body.items) {
        try {
          if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
            await ProductModel.findByIdAndUpdate(item.productId, {
              $inc: { openingStock: -(Number(item.quantity) || 1) }
            });
          } else if (item.sku) {
            await ProductModel.findOneAndUpdate({ sku: item.sku }, {
              $inc: { openingStock: -(Number(item.quantity) || 1) }
            });
          }
        } catch (stockErr) {
          console.warn(`Could not update stock for item:`, stockErr);
        }
      }
    }

    // 2. Process Customer Receivables Ledger
    const due = Number(body.dueAmount) || 0;
    if (due > 0 && body.customerName && body.customerName !== 'Walk-in Customer') {
      try {
        const customer = await CustomerModel.findOne({ name: body.customerName });
        if (customer) {
          customer.outstandingBalance = (customer.outstandingBalance || 0) + due;
          await customer.save();
        } else {
          await CustomerModel.create({
            name: body.customerName,
            phone: body.customerPhone || 'N/A',
            outstandingBalance: due,
            status: 'Active'
          });
        }
      } catch (custErr) {
        console.warn(`Could not update customer balance:`, custErr);
      }
    }

    // 3. Save Sale Record
    const newSale = await SaleModel.create({
      invoiceNumber: body.invoiceNumber,
      date: body.date || new Date().toISOString().split('T')[0],
      customerId: body.customerId || 'cust-1',
      customerName: body.customerName,
      warehouseId: body.warehouseId || 'Main Central Hub',
      items: body.items,
      subtotal: Number(body.subtotal) || 0,
      discount: Number(body.discount) || 0,
      tax: Number(body.tax) || 0,
      grandTotal: Number(body.grandTotal) || 0,
      paidAmount: Number(body.paidAmount) || 0,
      dueAmount: due,
      paymentStatus: body.paymentStatus || (due === 0 ? 'Paid' : Number(body.paidAmount) > 0 ? 'Partial' : 'Due'),
      status: body.status || 'Completed',
      paymentMethod: body.paymentMethod || 'Cash'
    });

    return NextResponse.json(newSale, { status: 201 });
  } catch (error: any) {
    console.error('Create Sale Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record sale' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ error: 'Sale ID is required for update' }, { status: 400 });
    }

    const updated = await SaleModel.findByIdAndUpdate(_id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Sale record not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update Sale Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update sale' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 });
    }

    await SaleModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Sale record deleted' });
  } catch (error: any) {
    console.error('Delete Sale Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete sale' }, { status: 500 });
  }
}
