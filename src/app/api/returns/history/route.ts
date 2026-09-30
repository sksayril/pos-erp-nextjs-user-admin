import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { SalesReturnModel, PurchaseReturnModel, CreditNoteModel, DebitNoteModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    const [salesReturns, purchaseReturns, creditNotes, debitNotes] = await Promise.all([
      SalesReturnModel.find({}).sort({ createdAt: -1 }),
      PurchaseReturnModel.find({}).sort({ createdAt: -1 }),
      CreditNoteModel.find({}).sort({ createdAt: -1 }),
      DebitNoteModel.find({}).sort({ createdAt: -1 })
    ]);

    const totalSalesReturnValue = salesReturns.reduce((acc, r) => acc + (Number(r.totalAmount) || 0), 0);
    const totalPurchaseReturnValue = purchaseReturns.reduce((acc, r) => acc + (Number(r.totalAmount) || 0), 0);
    const totalSalesReturnCount = salesReturns.length;
    const totalPurchaseReturnCount = purchaseReturns.length;

    // Reason frequency
    const reasonBreakdown: Record<string, number> = {};
    salesReturns.forEach(r => {
      const reason = r.reason || 'Customer Return';
      reasonBreakdown[reason] = (reasonBreakdown[reason] || 0) + 1;
    });
    purchaseReturns.forEach(r => {
      const reason = r.reason || 'Supplier Defect';
      reasonBreakdown[reason] = (reasonBreakdown[reason] || 0) + 1;
    });

    return NextResponse.json({
      totalSalesReturnValue,
      totalPurchaseReturnValue,
      totalSalesReturnCount,
      totalPurchaseReturnCount,
      totalCreditNotesIssued: creditNotes.length,
      totalDebitNotesIssued: debitNotes.length,
      reasonBreakdown,
      salesReturns,
      purchaseReturns
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
