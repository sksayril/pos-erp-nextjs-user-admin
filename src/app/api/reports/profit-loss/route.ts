import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { SaleModel, PurchaseModel, ExpenseModel, SalesReturnModel } from '../../../../lib/models';

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

    const [sales, purchases, expenses, salesReturns] = await Promise.all([
      SaleModel.find(dateQuery),
      PurchaseModel.find(dateQuery),
      ExpenseModel.find(dateQuery),
      SalesReturnModel.find(dateQuery)
    ]);

    // Gross Revenue from Sales
    const totalSalesRevenue = sales.reduce((acc, s) => acc + (Number(s.grandTotal) || 0), 0);
    const totalSalesDiscount = sales.reduce((acc, s) => acc + (Number(s.discount) || 0), 0);
    const totalSalesTax = sales.reduce((acc, s) => acc + (Number(s.tax) || 0), 0);
    
    // Returns & Refunds deduction
    const totalSalesReturnsValue = salesReturns.reduce((acc, r) => acc + (Number(r.totalAmount) || 0), 0);
    const netSalesRevenue = totalSalesRevenue - totalSalesReturnsValue;

    // Cost of Goods Sold (Purchase procurement)
    const totalPurchaseCost = purchases.reduce((acc, p) => acc + (Number(p.grandTotal) || 0), 0);
    const totalPurchaseTax = purchases.reduce((acc, p) => acc + (Number(p.tax) || 0), 0);

    // Gross Profit
    const grossProfit = netSalesRevenue - totalPurchaseCost;
    const grossMarginPercent = netSalesRevenue > 0 ? ((grossProfit / netSalesRevenue) * 100) : 0;

    // Operating Expenses
    const totalOperatingExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    
    // Expense categories breakdown
    const expenseBreakdown: Record<string, number> = {};
    expenses.forEach(e => {
      const cat = e.category || 'General Expense';
      expenseBreakdown[cat] = (expenseBreakdown[cat] || 0) + (Number(e.amount) || 0);
    });

    // Net Profit
    const netProfit = grossProfit - totalOperatingExpenses;
    const netProfitMarginPercent = netSalesRevenue > 0 ? ((netProfit / netSalesRevenue) * 100) : 0;

    // Monthly summary structure
    const breakdown = {
      revenue: [
        { title: 'Gross Sales Revenue', amount: totalSalesRevenue, type: 'credit' },
        { title: 'Less: Sales Returns & Refunds', amount: -totalSalesReturnsValue, type: 'debit' },
        { title: 'Net Sales Revenue', amount: netSalesRevenue, type: 'total' }
      ],
      costOfSales: [
        { title: 'Cost of Goods Sold (Purchases)', amount: totalPurchaseCost, type: 'debit' },
        { title: 'Gross Operating Profit', amount: grossProfit, type: 'total' }
      ],
      operatingExpenses: Object.entries(expenseBreakdown).map(([cat, amt]) => ({
        title: cat,
        amount: amt,
        type: 'debit'
      })),
      totalExpenses: totalOperatingExpenses,
      netProfit: netProfit
    };

    return NextResponse.json({
      totalSalesRevenue,
      totalSalesReturnsValue,
      netSalesRevenue,
      totalPurchaseCost,
      grossProfit,
      grossMarginPercent,
      totalOperatingExpenses,
      expenseBreakdown,
      netProfit,
      netProfitMarginPercent,
      breakdown,
      salesCount: sales.length,
      purchasesCount: purchases.length,
      expensesCount: expenses.length
    });
  } catch (error: any) {
    console.error('Profit & Loss API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to compute profit & loss' }, { status: 500 });
  }
}
