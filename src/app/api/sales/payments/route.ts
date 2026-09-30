import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { SalesPaymentModel, SaleModel, CustomerModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    let payments = await SalesPaymentModel.find({}).sort({ createdAt: -1 });

    if (payments.length === 0) {
      const defaultPayments = [
        {
          paymentNumber: 'REC-SAL-2026-001',
          invoiceNumber: 'INV-2026-001',
          customerName: 'Rahul Sharma',
          date: '2026-03-28',
          amount: 406982,
          paymentMethod: 'UPI',
          referenceNumber: 'UPI-SBIN-119283',
          status: 'Success',
          notes: 'Full invoice settlement received'
        },
        {
          paymentNumber: 'REC-SAL-2026-002',
          invoiceNumber: 'INV-2026-002',
          customerName: 'TechCorp Solutions Pvt Ltd',
          date: '2026-03-29',
          amount: 200000,
          paymentMethod: 'Bank Transfer',
          referenceNumber: 'NEFT-HDFC-998124',
          status: 'Success',
          notes: 'Advance part payment received'
        },
        {
          paymentNumber: 'REC-SAL-2026-003',
          invoiceNumber: 'INV-2026-003',
          customerName: 'Priya Patel',
          date: '2026-03-30',
          amount: 35388,
          paymentMethod: 'Credit Card',
          referenceNumber: 'POS-TXN-881920',
          status: 'Success',
          notes: 'POS checkout card swipe'
        }
      ];
      await SalesPaymentModel.insertMany(defaultPayments);
      payments = await SalesPaymentModel.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json(payments);
  } catch (error: any) {
    console.error('Fetch Sales Payments Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch sales payments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.paymentNumber || !body.customerName || !body.amount) {
      return NextResponse.json({ error: 'Receipt reference, customer name, and amount are required' }, { status: 400 });
    }

    const payAmount = Number(body.amount) || 0;

    // 1. Reduce Customer Outstanding Balance
    if (body.customerName) {
      const customer = await CustomerModel.findOne({ name: body.customerName });
      if (customer && customer.outstandingBalance > 0) {
        customer.outstandingBalance = Math.max(0, (customer.outstandingBalance || 0) - payAmount);
        await customer.save();
      }
    }

    // 2. Update linked Sale Invoice if invoiceNumber is provided
    if (body.invoiceNumber) {
      const sale = await SaleModel.findOne({ invoiceNumber: body.invoiceNumber });
      if (sale) {
        const newPaid = (sale.paidAmount || 0) + payAmount;
        const newDue = Math.max(0, (sale.grandTotal || 0) - newPaid);
        sale.paidAmount = newPaid;
        sale.dueAmount = newDue;
        sale.paymentStatus = newDue === 0 ? 'Paid' : 'Partial';
        await sale.save();
      }
    }

    // 3. Create Payment record
    const newPayment = await SalesPaymentModel.create({
      paymentNumber: body.paymentNumber.toUpperCase(),
      invoiceNumber: body.invoiceNumber || 'DIRECT-RECEIPT',
      customerName: body.customerName,
      date: body.date || new Date().toISOString().split('T')[0],
      amount: payAmount,
      paymentMethod: body.paymentMethod || 'Cash',
      referenceNumber: body.referenceNumber || '',
      status: body.status || 'Success',
      notes: body.notes || ''
    });

    return NextResponse.json(newPayment, { status: 201 });
  } catch (error: any) {
    console.error('Create Sales Payment Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record customer receipt' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Receipt ID is required' }, { status: 400 });
    }

    await SalesPaymentModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Payment record deleted' });
  } catch (error: any) {
    console.error('Delete Sales Payment Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete payment' }, { status: 500 });
  }
}
