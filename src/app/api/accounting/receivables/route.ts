import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { CustomerModel, SaleModel, AccountTransactionModel, AccountModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    const customers = await CustomerModel.find().sort({ outstandingBalance: -1 });
    const dueSales = await SaleModel.find({ paymentStatus: { $in: ['Due', 'Partial'] } }).sort({ date: -1 });

    const totalReceivables = customers.reduce((sum, c) => sum + (Number(c.outstandingBalance) || 0), 0);
    const overdueCount = customers.filter(c => Number(c.outstandingBalance) > 0).length;

    return NextResponse.json({
      totalReceivables,
      overdueCount,
      customers,
      dueInvoices: dueSales
    });
  } catch (error: any) {
    console.error('Accounting Receivables GET Error:', error);
    return NextResponse.json({ totalReceivables: 0, customers: [], dueInvoices: [] });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { customerId, customerName, amount, paymentMethod, reference, destinationAccount, notes } = body;

    if (!customerName || !amount) {
      return NextResponse.json({ error: 'Customer and Received Amount are required.' }, { status: 400 });
    }

    const payAmount = Number(amount);

    // 1. Reduce Customer's outstanding balance
    if (customerId) {
      await CustomerModel.findByIdAndUpdate(customerId, {
        $inc: { outstandingBalance: -payAmount }
      });
    }

    // 2. Record Cash / Bank Inflow Transaction
    const destAcc = destinationAccount || (paymentMethod === 'Cash' ? 'Main Cash in Hand' : 'HDFC Corporate Current Account');
    const accType = paymentMethod === 'Cash' ? 'Cash' : 'Bank';

    const count = await AccountTransactionModel.countDocuments();
    const txnNumber = `TXN-REC-${String(count + 1).padStart(3, '0')}`;

    await AccountTransactionModel.create({
      transactionNumber: txnNumber,
      date: new Date().toISOString().split('T')[0],
      accountType: accType,
      accountName: destAcc,
      type: 'Inflow',
      amount: payAmount,
      category: 'Customer Payment',
      partyName: customerName,
      partyType: 'Customer',
      paymentMethod: paymentMethod || 'Bank Transfer',
      reference: reference || undefined,
      description: notes || `Receivable payment collected from ${customerName}`
    });

    // 3. Increase Cash/Bank Account Balance
    await AccountModel.findOneAndUpdate(
      { name: destAcc },
      { $inc: { currentBalance: payAmount } }
    );

    return NextResponse.json({ success: true, message: `Collected ₹${payAmount} from ${customerName}.` });
  } catch (error: any) {
    console.error('Accounting Receivables POST Error:', error);
    return NextResponse.json({ error: error.message || 'Payment collection failed' }, { status: 500 });
  }
}
