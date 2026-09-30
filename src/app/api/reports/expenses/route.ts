import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { ExpenseModel, ExpenseCategoryModel } from '../../../../lib/models';

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

    const [expenses, categories] = await Promise.all([
      ExpenseModel.find(query).sort({ date: -1, createdAt: -1 }),
      ExpenseCategoryModel.find({})
    ]);

    const totalExpenseCount = expenses.length;
    const totalExpenseAmount = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const totalTaxPaid = expenses.reduce((acc, e) => acc + (Number(e.taxAmount) || 0), 0);

    // Group by category
    const categoryMap: Record<string, { name: string; count: number; total: number; budget: number }> = {};
    
    // Seed with existing categories
    categories.forEach(c => {
      categoryMap[c.name] = { name: c.name, count: 0, total: 0, budget: c.budgetLimit || 0 };
    });

    expenses.forEach(e => {
      const cat = e.category || 'General';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { name: cat, count: 0, total: 0, budget: 0 };
      }
      categoryMap[cat].count += 1;
      categoryMap[cat].total += Number(e.amount) || 0;
    });

    // Group by Payment Method
    const paymentMethods: Record<string, { count: number; total: number }> = {};
    expenses.forEach(e => {
      const method = e.paymentMethod || 'Cash';
      if (!paymentMethods[method]) paymentMethods[method] = { count: 0, total: 0 };
      paymentMethods[method].count += 1;
      paymentMethods[method].total += Number(e.amount) || 0;
    });

    return NextResponse.json({
      totalExpenseCount,
      totalExpenseAmount,
      totalTaxPaid,
      categoryBreakdown: Object.values(categoryMap).sort((a, b) => b.total - a.total),
      paymentMethods,
      expenses
    });
  } catch (error: any) {
    console.error('Expense Report API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch expense report' }, { status: 500 });
  }
}
