import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { SupplierModel, PurchaseModel, DebitNoteModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    const [suppliers, purchases, debitNotes] = await Promise.all([
      SupplierModel.find({}).sort({ name: 1 }),
      PurchaseModel.find({}).sort({ date: -1 }),
      DebitNoteModel.find({}).sort({ date: -1 })
    ]);

    let totalPayables = 0;
    let totalLifetimeProcurement = 0;
    let totalSettled = 0;

    const supplierLedgers = suppliers.map(sup => {
      const supPurchases = purchases.filter(p => p.supplierId === sup._id.toString() || p.supplierName?.toLowerCase() === sup.name?.toLowerCase());
      const supDebits = debitNotes.filter(dn => dn.supplierName?.toLowerCase() === sup.name?.toLowerCase());

      const purchaseVolume = supPurchases.reduce((acc, p) => acc + (Number(p.grandTotal) || 0), 0);
      const paidVolume = supPurchases.reduce((acc, p) => acc + (Number(p.paidAmount) || 0), 0);
      const dueVolume = supPurchases.reduce((acc, p) => acc + (Number(p.dueAmount) || 0), 0);
      const debitDeductions = supDebits.reduce((acc, dn) => acc + (Number(dn.debitAmount) || 0), 0);

      const netPayable = Math.max(0, dueVolume || Number(sup.outstandingPayable) || 0);

      totalPayables += netPayable;
      totalLifetimeProcurement += purchaseVolume;
      totalSettled += paidVolume;

      return {
        _id: sup._id,
        name: sup.name,
        phone: sup.phone,
        email: sup.email || 'N/A',
        ordersCount: supPurchases.length,
        totalPurchased: purchaseVolume,
        totalPaid: paidVolume,
        totalPayable: netPayable,
        debitClaims: debitDeductions,
        status: sup.status || 'Active',
        recentBills: supPurchases.slice(0, 5).map(p => ({
          purchaseNumber: p.purchaseNumber,
          date: p.date,
          amount: p.grandTotal,
          paid: p.paidAmount,
          due: p.dueAmount,
          paymentStatus: p.paymentStatus
        }))
      };
    });

    return NextResponse.json({
      totalSupplierCount: suppliers.length,
      totalPayables,
      totalLifetimeProcurement,
      totalSettled,
      supplierLedgers
    });
  } catch (error: any) {
    console.error('Supplier Ledger API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch supplier ledger' }, { status: 500 });
  }
}
