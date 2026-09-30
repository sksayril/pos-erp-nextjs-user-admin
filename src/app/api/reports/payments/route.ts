import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { SaleModel, PurchaseModel, ExpenseModel, AccountTransactionModel } from '../../../../lib/models';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let dateQuery: any = {};
    if (startDate && endDate) {
      dateQuery.date = { $gte: startDate, $lte: endDate };
    }

    const [sales, purchases, expenses, accountTx] = await Promise.all([
      SaleModel.find(dateQuery).sort({ date: -1 }),
      PurchaseModel.find(dateQuery).sort({ date: -1 }),
      ExpenseModel.find(dateQuery).sort({ date: -1 }),
      AccountTransactionModel.find(dateQuery).sort({ date: -1 })
    ]);

    const customerReceipts = sales
      .filter(s => (Number(s.paidAmount) || 0) > 0)
      .map(s => ({
        id: s._id,
        ref: s.invoiceNumber,
        date: s.date,
        party: s.customerName,
        type: 'Customer Receipt (Sale Inflow)',
        direction: 'Inflow',
        method: s.paymentMethod || 'Cash',
        amount: Number(s.paidAmount) || 0,
        status: s.paymentStatus || 'Paid'
      }));

    const supplierPayments = purchases
      .filter(p => (Number(p.paidAmount) || 0) > 0)
      .map(p => ({
        id: p._id,
        ref: p.purchaseNumber,
        date: p.date,
        party: p.supplierName,
        type: 'Supplier Payment (Purchase Outflow)',
        direction: 'Outflow',
        method: p.paymentMethod || 'Cash',
        amount: Number(p.paidAmount) || 0,
        status: p.paymentStatus || 'Paid'
      }));

    const expensePayments = expenses
      .map(e => ({
        id: e._id,
        ref: e.expenseNumber || 'EXP',
        date: e.date,
        party: e.vendor || e.title,
        type: `Expense (${e.category || 'General'})`,
        direction: 'Outflow',
        method: e.paymentMethod || 'Cash',
        amount: Number(e.amount) || 0,
        status: e.paymentStatus || 'Paid'
      }));

    const allPayments = [...customerReceipts, ...supplierPayments, ...expensePayments].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    const totalInflow = customerReceipts.reduce((acc, r) => acc + r.amount, 0);
    const totalOutflow = supplierPayments.reduce((acc, p) => acc + p.amount, 0) + expensePayments.reduce((acc, e) => acc + e.amount, 0);
    const netCashFlow = totalInflow - totalOutflow;

    // Method breakdown
    const methodSummary: Record<string, { inflow: number; outflow: number }> = {};
    allPayments.forEach(p => {
      const m = p.method || 'Cash';
      if (!methodSummary[m]) methodSummary[m] = { inflow: 0, outflow: 0 };
      if (p.direction === 'Inflow') methodSummary[m].inflow += p.amount;
      else methodSummary[m].outflow += p.amount;
    });

    return NextResponse.json({
      totalInflow,
      totalOutflow,
      netCashFlow,
      totalTransactionsCount: allPayments.length,
      methodSummary,
      payments: allPayments
    });
  } catch (error: any) {
    console.error('Payment Audit API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch payment audit report' }, { status: 500 });
  }
}
