import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { CustomerModel, SaleModel, CreditNoteModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    const [customers, sales, creditNotes] = await Promise.all([
      CustomerModel.find({}).sort({ name: 1 }),
      SaleModel.find({}).sort({ date: -1 }),
      CreditNoteModel.find({}).sort({ date: -1 })
    ]);

    let totalReceivables = 0;
    let totalLifetimeSales = 0;
    let totalCollected = 0;

    const customerLedgers = customers.map(c => {
      const custSales = sales.filter(s => s.customerId === c._id.toString() || s.customerName?.toLowerCase() === c.name?.toLowerCase());
      const custCredits = creditNotes.filter(cn => cn.customerName?.toLowerCase() === c.name?.toLowerCase());

      const salesVolume = custSales.reduce((acc, s) => acc + (Number(s.grandTotal) || 0), 0);
      const paidVolume = custSales.reduce((acc, s) => acc + (Number(s.paidAmount) || 0), 0);
      const dueVolume = custSales.reduce((acc, s) => acc + (Number(s.dueAmount) || 0), 0);
      const creditRefunds = custCredits.reduce((acc, cn) => acc + (Number(cn.refundAmount) || 0), 0);

      const netReceivable = Math.max(0, dueVolume || Number(c.outstandingBalance) || 0);

      totalReceivables += netReceivable;
      totalLifetimeSales += salesVolume;
      totalCollected += paidVolume;

      return {
        _id: c._id,
        name: c.name,
        phone: c.phone,
        email: c.email || 'N/A',
        creditLimit: Number(c.creditLimit) || 0,
        invoiceCount: custSales.length,
        totalSalesVolume: salesVolume,
        totalPaid: paidVolume,
        totalDue: netReceivable,
        creditNotesValue: creditRefunds,
        status: c.status || 'Active',
        recentInvoices: custSales.slice(0, 5).map(s => ({
          invoiceNumber: s.invoiceNumber,
          date: s.date,
          amount: s.grandTotal,
          paid: s.paidAmount,
          due: s.dueAmount,
          paymentStatus: s.paymentStatus
        }))
      };
    });

    return NextResponse.json({
      totalCustomerCount: customers.length,
      totalReceivables,
      totalLifetimeSales,
      totalCollected,
      customerLedgers
    });
  } catch (error: any) {
    console.error('Customer Ledger API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch customer ledger' }, { status: 500 });
  }
}
