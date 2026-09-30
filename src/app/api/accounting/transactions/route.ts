import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { AccountTransactionModel, AccountModel } from '../../../../lib/models';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const accountType = searchParams.get('type'); // 'Cash', 'Bank', 'all'
    const dateParam = searchParams.get('date');

    const filter: any = {};
    if (accountType && accountType !== 'all') {
      filter.accountType = accountType;
    }
    if (dateParam) {
      filter.date = dateParam;
    }

    let transactions = await AccountTransactionModel.find(filter).sort({ date: -1, createdAt: -1 });

    // Auto-seed initial financial transactions if empty
    if (transactions.length === 0 && !dateParam) {
      const defaultTxns = [
        {
          transactionNumber: 'TXN-2026-001',
          date: '2026-09-30',
          accountType: 'Cash',
          accountName: 'Main Cash in Hand',
          type: 'Inflow',
          amount: 14500,
          category: 'Sales Revenue',
          partyName: 'Walk-In Customers (POS)',
          partyType: 'Customer',
          paymentMethod: 'Cash',
          reference: 'POS-BATCH-0930',
          balanceAfter: 82500,
          description: 'Daily cash counter POS sales collections.'
        },
        {
          transactionNumber: 'TXN-2026-002',
          date: '2026-09-30',
          accountType: 'Bank',
          accountName: 'HDFC Corporate Current Account',
          type: 'Inflow',
          amount: 28500,
          category: 'Customer Payment',
          partyName: 'Apex Retailers Corp',
          partyType: 'Customer',
          paymentMethod: 'UPI',
          reference: 'INV-2026-8941',
          balanceAfter: 285400,
          description: 'Invoice settlement payment via HDFC SmartHub.'
        },
        {
          transactionNumber: 'TXN-2026-003',
          date: '2026-09-29',
          accountType: 'Bank',
          accountName: 'SBI Business Account',
          type: 'Outflow',
          amount: 18000,
          category: 'Vendor Payment',
          partyName: 'Prime Distribution Logistics',
          partyType: 'Supplier',
          paymentMethod: 'Bank Transfer',
          reference: 'PO-88219-NEFT',
          balanceAfter: 94200,
          description: 'Procurement raw material stock invoice payout.'
        },
        {
          transactionNumber: 'TXN-2026-004',
          date: '2026-09-29',
          accountType: 'Cash',
          accountName: 'Main Cash in Hand',
          type: 'Outflow',
          amount: 3500,
          category: 'Store Rent & Utilities',
          partyName: 'City Power Corporation',
          partyType: 'Other',
          paymentMethod: 'Cash',
          reference: 'BILL-ELEC-SEP26',
          balanceAfter: 68000,
          description: 'Commercial store electricity & maintenance petty cash voucher.'
        },
        {
          transactionNumber: 'TXN-2026-005',
          date: '2026-09-28',
          accountType: 'Bank',
          accountName: 'HDFC Corporate Current Account',
          type: 'Outflow',
          amount: 35000,
          category: 'Staff Payroll & Salaries',
          partyName: 'Aryan Sharma (Staff)',
          partyType: 'Employee',
          paymentMethod: 'Bank Transfer',
          reference: 'PAY-202609-100',
          balanceAfter: 256900,
          description: 'Direct salary disbursement via HDFC Corporate Netbanking.'
        }
      ];
      transactions = await AccountTransactionModel.insertMany(defaultTxns);
    }

    return NextResponse.json(transactions);
  } catch (error: any) {
    console.error('Accounting Transactions GET Error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { 
      accountType, accountId, accountName, type, amount, 
      category, partyName, partyType, paymentMethod, reference, date, description 
    } = body;

    if (!accountName || !type || !amount) {
      return NextResponse.json({ error: 'Account, Inflow/Outflow Type, and Amount are required.' }, { status: 400 });
    }

    const numAmount = Number(amount);
    const count = await AccountTransactionModel.countDocuments();
    const transactionNumber = `TXN-2026-${String(count + 1).padStart(3, '0')}`;
    const txDate = date || new Date().toISOString().split('T')[0];

    // Adjust Account Balance in Chart of Accounts
    let balanceAfter = 0;
    const isIncrease = type === 'Inflow' || type === 'Debit';
    const acc = await AccountModel.findOneAndUpdate(
      accountId ? { _id: accountId } : { name: accountName },
      { $inc: { currentBalance: isIncrease ? numAmount : -numAmount } },
      { new: true }
    );
    if (acc) {
      balanceAfter = acc.currentBalance;
    }

    const newTxn = await AccountTransactionModel.create({
      transactionNumber,
      date: txDate,
      accountType: accountType || 'Cash',
      accountId: accountId || undefined,
      accountName,
      type,
      amount: numAmount,
      category: category || 'General',
      partyName: partyName || undefined,
      partyType: partyType || 'Other',
      paymentMethod: paymentMethod || 'Cash',
      reference: reference || undefined,
      balanceAfter,
      status: 'Completed',
      description: description || ''
    });

    return NextResponse.json(newTxn, { status: 201 });
  } catch (error: any) {
    console.error('Accounting Transaction POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record transaction' }, { status: 500 });
  }
}
