import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { SalesReturnModel, CreditNoteModel } from '../../../../lib/models';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const query: any = {};
    if (status) query.status = status;

    let returns = await SalesReturnModel.find(query).sort({ createdAt: -1 });

    if (returns.length === 0 && Object.keys(query).length === 0) {
      const defaultReturns = [
        {
          returnNumber: 'SR-2026-001',
          invoiceNumber: 'INV-2026-0001',
          date: '2026-03-24',
          customerName: 'Acme Enterprises Ltd',
          customerPhone: '+91 98201 55432',
          warehouseName: 'Central Godown (HQ)',
          items: [
            {
              productId: 'prod1',
              productName: 'Sony WH-1000XM5 Headphones',
              sku: 'SNY-WH-XM5',
              quantity: 2,
              unitPrice: 29990,
              tax: 10796,
              total: 70776
            }
          ],
          totalAmount: 70776,
          refundAmount: 70776,
          refundStatus: 'Credit Issued',
          reason: 'Customer received duplicate color variant, requested store credit',
          status: 'Restocked',
          creditNoteNo: 'CN-2026-0012',
          notes: 'Box seal intact. Product inspected and verified by QC lead.',
          receivedBy: 'Arpita Sen'
        },
        {
          returnNumber: 'SR-2026-002',
          invoiceNumber: 'INV-2026-0002',
          date: '2026-03-27',
          customerName: 'TechVision Global Corp',
          customerPhone: '+91 98311 88990',
          warehouseName: 'Salt Lake Outlet Store',
          items: [
            {
              productId: 'prod2',
              productName: 'Samsung Galaxy S24 Ultra 512GB',
              sku: 'SM-S24U-512',
              quantity: 1,
              unitPrice: 129999,
              tax: 23399,
              total: 153398
            }
          ],
          totalAmount: 153398,
          refundAmount: 153398,
          refundStatus: 'Pending',
          reason: 'Screen flickering issue observed during customer setup',
          status: 'Inspected',
          creditNoteNo: 'CN-2026-0015',
          notes: 'Device sent to authorized service center for warranty replacement.',
          receivedBy: 'Rajesh Sharma'
        }
      ];

      returns = await SalesReturnModel.insertMany(defaultReturns);
    }

    return NextResponse.json(returns);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();

    if (!data.invoiceNumber || !data.customerName || !data.items || data.items.length === 0) {
      return NextResponse.json({ error: 'Invoice reference, customer name, and returned items are required.' }, { status: 400 });
    }

    const count = await SalesReturnModel.countDocuments();
    const currentYear = new Date().getFullYear();
    const returnNumber = data.returnNumber || `SR-${currentYear}-${String(count + 1).padStart(3, '0')}`;

    const processedItems = data.items.map((i: any) => {
      const qty = Number(i.quantity) || 1;
      const price = Number(i.unitPrice) || 0;
      const tax = Number(i.tax) || (qty * price * 0.18);
      const total = (qty * price) + tax;
      return {
        productId: i.productId || `prod-${Date.now()}`,
        productName: i.productName,
        sku: i.sku || '',
        quantity: qty,
        unitPrice: price,
        tax,
        total
      };
    });

    const totalAmount = processedItems.reduce((acc: number, i: any) => acc + i.total, 0);
    const refundAmount = Number(data.refundAmount) || totalAmount;
    const creditNoteNo = data.creditNoteNo || `CN-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReturn = await SalesReturnModel.create({
      returnNumber,
      invoiceNumber: data.invoiceNumber,
      date: data.date || new Date().toISOString().split('T')[0],
      customerName: data.customerName,
      customerPhone: data.customerPhone || '',
      warehouseName: data.warehouseName || 'Central Godown (HQ)',
      items: processedItems,
      totalAmount,
      refundAmount,
      refundStatus: data.refundStatus || 'Credit Issued',
      reason: data.reason || 'Customer Return',
      status: data.status || 'Received',
      creditNoteNo,
      notes: data.notes || '',
      receivedBy: data.receivedBy || 'Store Support Lead'
    });

    // Also auto-generate or link Credit Note in CreditNoteModel
    await CreditNoteModel.create({
      noteNo: creditNoteNo,
      invoiceNo: data.invoiceNumber,
      customerName: data.customerName,
      refundAmount,
      date: data.date || new Date().toISOString().split('T')[0],
      reason: `Sales Return ${returnNumber}: ${data.reason || 'Goods returned'}`,
      status: data.refundStatus === 'Refunded' ? 'Refunded' : 'Issued'
    }).catch(err => console.log('Credit note exists or skipped', err));

    return NextResponse.json(newReturn, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const deleted = await SalesReturnModel.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

    return NextResponse.json({ message: 'Sales return record deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
