import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { PurchasePaymentModel, SupplierModel, PurchaseModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    let payments = await PurchasePaymentModel.find({}).sort({ createdAt: -1 });

    if (payments.length === 0) {
      const defaultPayments = [
        {
          paymentNumber: 'PAY-PUR-2026-001',
          purchaseNumber: 'PUR-2026-001',
          supplierName: 'Apple Authorized Distributor',
          date: '2026-03-25',
          amount: 3304000,
          paymentMethod: 'Bank Transfer',
          referenceNumber: 'NEFT-AXIS-99210',
          status: 'Success',
          notes: 'Full payment cleared against Invoice INV-APL-8891'
        },
        {
          paymentNumber: 'PAY-PUR-2026-002',
          purchaseNumber: 'PUR-2026-002',
          supplierName: 'Samsung Direct Logistics',
          date: '2026-03-27',
          amount: 1000000,
          paymentMethod: 'Bank Transfer',
          referenceNumber: 'RTGS-HDFC-55410',
          status: 'Success',
          notes: 'Part payment of Rs. 10,00,000 for INV-SAM-4421'
        },
        {
          paymentNumber: 'PAY-PUR-2026-003',
          purchaseNumber: 'PUR-2026-003',
          supplierName: 'Sony Audio Importers',
          date: '2026-03-29',
          amount: 637200,
          paymentMethod: 'UPI',
          referenceNumber: 'UPI-SBIN-889123',
          status: 'Success',
          notes: 'Instant settlement via Corporate UPI'
        }
      ];
      await PurchasePaymentModel.insertMany(defaultPayments);
      payments = await PurchasePaymentModel.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json(payments);
  } catch (error: any) {
    console.error('Fetch Purchase Payments Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch purchase payments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.paymentNumber || !body.supplierName || !body.amount) {
      return NextResponse.json({ error: 'Payment number, supplier, and amount are required' }, { status: 400 });
    }

    const payAmount = Number(body.amount) || 0;

    // 1. Reduce Supplier Outstanding Balance
    const supplier = await SupplierModel.findOne({ name: body.supplierName });
    if (supplier && supplier.outstandingPayable > 0) {
      supplier.outstandingPayable = Math.max(0, (supplier.outstandingPayable || 0) - payAmount);
      await supplier.save();
    }

    // 2. Update linked Purchase Bill if purchaseNumber is provided
    if (body.purchaseNumber) {
      const purchase = await PurchaseModel.findOne({ purchaseNumber: body.purchaseNumber });
      if (purchase) {
        const newPaid = (purchase.paidAmount || 0) + payAmount;
        const newDue = Math.max(0, (purchase.grandTotal || 0) - newPaid);
        purchase.paidAmount = newPaid;
        purchase.dueAmount = newDue;
        purchase.paymentStatus = newDue === 0 ? 'Paid' : 'Partial';
        await purchase.save();
      }
    }

    // 3. Create Payment record
    const newPayment = await PurchasePaymentModel.create({
      paymentNumber: body.paymentNumber.toUpperCase(),
      purchaseNumber: body.purchaseNumber || 'DIRECT-EXPENSE',
      supplierName: body.supplierName,
      date: body.date || new Date().toISOString().split('T')[0],
      amount: payAmount,
      paymentMethod: body.paymentMethod || 'Bank Transfer',
      referenceNumber: body.referenceNumber || '',
      status: body.status || 'Success',
      notes: body.notes || ''
    });

    return NextResponse.json(newPayment, { status: 201 });
  } catch (error: any) {
    console.error('Create Purchase Payment Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record purchase payment' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    await PurchasePaymentModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Payment record deleted successfully' });
  } catch (error: any) {
    console.error('Delete Purchase Payment Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete payment' }, { status: 500 });
  }
}
