import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { SupplierModel, PurchaseModel, AccountTransactionModel, AccountModel } from '../../../../lib/models';
import { mockSuppliers } from '../../../../lib/mockData';

export async function GET() {
  try {
    await connectDB();
    let suppliers = await SupplierModel.find().sort({ outstandingPayable: -1 });

    if (suppliers.length === 0) {
      const defaultSups = mockSuppliers.map(s => ({
        name: s.name,
        phone: s.phone,
        email: s.email || '',
        address: s.address || '',
        outstandingPayable: s.outstandingPayable || 0,
        status: 'Active'
      }));
      suppliers = await SupplierModel.insertMany(defaultSups);
    }

    const duePurchases = await PurchaseModel.find({ paymentStatus: { $in: ['Due', 'Partial'] } }).sort({ date: -1 });
    const totalPayables = suppliers.reduce((sum, s) => sum + (Number(s.outstandingPayable) || 0), 0);

    return NextResponse.json({
      totalPayables,
      suppliers,
      duePurchases
    });
  } catch (error: any) {
    console.error('Accounting Payables GET Error:', error);
    return NextResponse.json({ totalPayables: 0, suppliers: [], duePurchases: [] });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { supplierId, supplierName, amount, paymentMethod, reference, sourceAccount, notes } = body;

    if (!supplierName || !amount) {
      return NextResponse.json({ error: 'Supplier and Payment Amount are required.' }, { status: 400 });
    }

    const payAmount = Number(amount);

    // 1. Reduce Supplier's outstanding payable
    if (supplierId) {
      await SupplierModel.findByIdAndUpdate(supplierId, {
        $inc: { outstandingPayable: -payAmount }
      });
    }

    // 2. Record Cash / Bank Outflow Transaction
    const srcAcc = sourceAccount || (paymentMethod === 'Cash' ? 'Main Cash in Hand' : 'SBI Business Account');
    const accType = paymentMethod === 'Cash' ? 'Cash' : 'Bank';

    const count = await AccountTransactionModel.countDocuments();
    const txnNumber = `TXN-PAY-${String(count + 1).padStart(3, '0')}`;

    await AccountTransactionModel.create({
      transactionNumber: txnNumber,
      date: new Date().toISOString().split('T')[0],
      accountType: accType,
      accountName: srcAcc,
      type: 'Outflow',
      amount: payAmount,
      category: 'Vendor Payment',
      partyName: supplierName,
      partyType: 'Supplier',
      paymentMethod: paymentMethod || 'Bank Transfer',
      reference: reference || undefined,
      description: notes || `Vendor payment disbursed to ${supplierName}`
    });

    // 3. Deduct from Cash/Bank Account Balance
    await AccountModel.findOneAndUpdate(
      { name: srcAcc },
      { $inc: { currentBalance: -payAmount } }
    );

    return NextResponse.json({ success: true, message: `Disbursed ₹${payAmount} to ${supplierName}.` });
  } catch (error: any) {
    console.error('Accounting Payables POST Error:', error);
    return NextResponse.json({ error: error.message || 'Vendor payment failed' }, { status: 500 });
  }
}
