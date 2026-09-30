import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { SaleModel } from '../../../../lib/models';

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

    const sales = await SaleModel.find(query).sort({ date: -1, createdAt: -1 });

    const totalSalesCount = sales.length;
    const totalGrossRevenue = sales.reduce((acc, s) => acc + (Number(s.subtotal) || Number(s.grandTotal) || 0), 0);
    const totalDiscount = sales.reduce((acc, s) => acc + (Number(s.discount) || 0), 0);
    const totalTax = sales.reduce((acc, s) => acc + (Number(s.tax) || 0), 0);
    const totalNetRevenue = sales.reduce((acc, s) => acc + (Number(s.grandTotal) || 0), 0);
    const totalPaid = sales.reduce((acc, s) => acc + (Number(s.paidAmount) || 0), 0);
    const totalDue = sales.reduce((acc, s) => acc + (Number(s.dueAmount) || 0), 0);

    // Payment methods breakdown
    const paymentMethods: Record<string, { count: number; total: number }> = {};
    sales.forEach(s => {
      const method = s.paymentMethod || 'Cash';
      if (!paymentMethods[method]) paymentMethods[method] = { count: 0, total: 0 };
      paymentMethods[method].count += 1;
      paymentMethods[method].total += Number(s.grandTotal) || 0;
    });

    // Customer sales ranking
    const customerMap: Record<string, { name: string; invoices: number; totalSpent: number }> = {};
    sales.forEach(s => {
      const name = s.customerName || 'Walk-in Customer';
      if (!customerMap[name]) customerMap[name] = { name, invoices: 0, totalSpent: 0 };
      customerMap[name].invoices += 1;
      customerMap[name].totalSpent += Number(s.grandTotal) || 0;
    });
    const topCustomers = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

    return NextResponse.json({
      totalSalesCount,
      totalGrossRevenue,
      totalDiscount,
      totalTax,
      totalNetRevenue,
      totalPaid,
      totalDue,
      paymentMethods,
      topCustomers,
      sales
    });
  } catch (error: any) {
    console.error('Sales Report API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch sales report' }, { status: 500 });
  }
}
