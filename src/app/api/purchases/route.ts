import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { PurchaseModel, ProductModel, SupplierModel, shouldSeedData } from '../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    let purchases = await PurchaseModel.find({}).sort({ createdAt: -1 });

    if (purchases.length === 0 && (await shouldSeedData())) {
      const defaultPurchases = [
        {
          purchaseNumber: 'PUR-2026-001',
          invoiceNumber: 'INV-APL-8891',
          date: '2026-03-25',
          supplierId: 'sup-1',
          supplierName: 'Apple Authorized Distributor',
          warehouseId: 'wh-1',
          items: [
            {
              productId: 'prod1',
              productName: 'MacBook Pro M3 Max 16"',
              sku: 'MBP-M3-16-01',
              quantity: 10,
              price: 280000,
              discount: 0,
              tax: 504000,
              total: 3304000
            }
          ],
          subtotal: 2800000,
          discount: 0,
          tax: 504000,
          grandTotal: 3304000,
          paidAmount: 3304000,
          dueAmount: 0,
          paymentStatus: 'Paid',
          status: 'Received',
          paymentMethod: 'Bank Transfer'
        },
        {
          purchaseNumber: 'PUR-2026-002',
          invoiceNumber: 'INV-SAM-4421',
          date: '2026-03-27',
          supplierId: 'sup-2',
          supplierName: 'Samsung Direct Logistics',
          warehouseId: 'wh-1',
          items: [
            {
              productId: 'prod2',
              productName: 'Samsung Galaxy S24 Ultra 512GB',
              sku: 'SM-S24U-512',
              quantity: 15,
              price: 95000,
              discount: 50000,
              tax: 247500,
              total: 1622500
            }
          ],
          subtotal: 1425000,
          discount: 50000,
          tax: 247500,
          grandTotal: 1622500,
          paidAmount: 1000000,
          dueAmount: 622500,
          paymentStatus: 'Partial',
          status: 'Received',
          paymentMethod: 'Bank Transfer'
        },
        {
          purchaseNumber: 'PUR-2026-003',
          invoiceNumber: 'INV-SNY-1092',
          date: '2026-03-29',
          supplierId: 'sup-3',
          supplierName: 'Sony Audio Importers',
          warehouseId: 'wh-1',
          items: [
            {
              productId: 'prod3',
              productName: 'Sony WH-1000XM5 Wireless Headphones',
              sku: 'SNY-WH1000XM5',
              quantity: 25,
              price: 22000,
              discount: 10000,
              tax: 97200,
              total: 637200
            }
          ],
          subtotal: 550000,
          discount: 10000,
          tax: 97200,
          grandTotal: 637200,
          paidAmount: 637200,
          dueAmount: 0,
          paymentStatus: 'Paid',
          status: 'Received',
          paymentMethod: 'UPI'
        }
      ];
      await PurchaseModel.insertMany(defaultPurchases);
      purchases = await PurchaseModel.find({}).sort({ createdAt: -1 });
    }

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

    if (!body.purchaseNumber || !body.supplierName || !body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'Purchase number, supplier, and items are required' }, { status: 400 });
    }

    // 1. Process Stock Increments in MongoDB if status is Received
    if (body.status === 'Received') {
      for (const item of body.items) {
        if (item.productId) {
          await ProductModel.findByIdAndUpdate(
            item.productId,
            { $inc: { openingStock: Number(item.quantity) || 1 } }
          );
        } else if (item.sku) {
          await ProductModel.findOneAndUpdate(
            { sku: item.sku },
            { $inc: { openingStock: Number(item.quantity) || 1 } }
          );
        }
      }
    }

    // 2. Process Supplier Payables Ledger if there is due amount
    const due = Number(body.dueAmount) || 0;
    if (due > 0 && body.supplierName) {
      const supplier = await SupplierModel.findOne({ name: body.supplierName });
      if (supplier) {
        supplier.outstandingPayable = (supplier.outstandingPayable || 0) + due;
        await supplier.save();
      } else {
        await SupplierModel.create({
          name: body.supplierName,
          phone: body.supplierPhone || 'N/A',
          outstandingPayable: due,
          status: 'Active'
        });
      }
    }

    // 3. Save Purchase Ticket
    const newPurchase = await PurchaseModel.create({
      ...body,
      subtotal: Number(body.subtotal) || 0,
      discount: Number(body.discount) || 0,
      tax: Number(body.tax) || 0,
      grandTotal: Number(body.grandTotal) || 0,
      paidAmount: Number(body.paidAmount) || 0,
      dueAmount: due,
      paymentStatus: body.paymentStatus || (due === 0 ? 'Paid' : Number(body.paidAmount) > 0 ? 'Partial' : 'Due'),
      status: body.status || 'Received'
    });

    return NextResponse.json(newPurchase, { status: 201 });
  } catch (error: any) {
    console.error('Create Purchase Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record purchase' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ error: 'Purchase ID is required for update' }, { status: 400 });
    }

    const updated = await PurchaseModel.findByIdAndUpdate(_id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update Purchase Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update purchase' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Purchase ID is required' }, { status: 400 });
    }

    await PurchaseModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Purchase record deleted' });
  } catch (error: any) {
    console.error('Delete Purchase Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete purchase' }, { status: 500 });
  }
}
