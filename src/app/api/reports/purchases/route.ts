import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { PurchaseModel } from '../../../../lib/models';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query: any = {};
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const purchases = await PurchaseModel.find(query).sort({ date: -1, createdAt: -1 });

    const totalPurchaseCount = purchases.length;
    const totalGrossSpend = purchases.reduce((acc, p) => acc + (Number(p.subtotal) || Number(p.grandTotal) || 0), 0);
    const totalTax = purchases.reduce((acc, p) => acc + (Number(p.tax) || 0), 0);
    const totalDiscount = purchases.reduce((acc, p) => acc + (Number(p.discount) || 0), 0);
    const totalNetSpend = purchases.reduce((acc, p) => acc + (Number(p.grandTotal) || 0), 0);
    const totalPaid = purchases.reduce((acc, p) => acc + (Number(p.paidAmount) || 0), 0);
    const totalDue = purchases.reduce((acc, p) => acc + (Number(p.dueAmount) || 0), 0);

    // Supplier spend ranking
    const supplierMap: Record<string, { name: string; orders: number; totalSpend: number }> = {};
    purchases.forEach(p => {
      const name = p.supplierName || 'Default Supplier';
      if (!supplierMap[name]) supplierMap[name] = { name, orders: 0, totalSpend: 0 };
      supplierMap[name].orders += 1;
      supplierMap[name].totalSpend += Number(p.grandTotal) || 0;
    });
    const topSuppliers = Object.values(supplierMap).sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 5);

    return NextResponse.json({
      totalPurchaseCount,
      totalGrossSpend,
      totalTax,
      totalDiscount,
      totalNetSpend,
      totalPaid,
      totalDue,
      topSuppliers,
      purchases
    });
  } catch (error: any) {
    console.error('Purchase Report API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch purchase report' }, { status: 500 });
  }
}
