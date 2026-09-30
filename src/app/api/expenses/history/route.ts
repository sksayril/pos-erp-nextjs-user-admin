import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { ExpenseModel, ExpenseCategoryModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    const expenses = await ExpenseModel.find({}).sort({ date: -1 });
    const categories = await ExpenseCategoryModel.find({});

    const totalExpenseAmount = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const totalTaxPaid = expenses.reduce((acc, e) => acc + (Number(e.taxAmount) || 0), 0);
    const totalTransactions = expenses.length;

    // Breakdown by category
    const categoryBreakdown: Record<string, { total: number; count: number; budget: number }> = {};
    
    categories.forEach(cat => {
      categoryBreakdown[cat.name] = { total: 0, count: 0, budget: cat.budgetLimit || 0 };
    });

    expenses.forEach(exp => {
      if (!categoryBreakdown[exp.category]) {
        categoryBreakdown[exp.category] = { total: 0, count: 0, budget: 0 };
      }
      categoryBreakdown[exp.category].total += Number(exp.amount) || 0;
      categoryBreakdown[exp.category].count += 1;
    });

    // Breakdown by payment method
    const paymentMethodBreakdown: Record<string, number> = {};
    expenses.forEach(exp => {
      const method = exp.paymentMethod || 'Cash';
      paymentMethodBreakdown[method] = (paymentMethodBreakdown[method] || 0) + (Number(exp.amount) || 0);
    });

    return NextResponse.json({
      totalExpenseAmount,
      totalTaxPaid,
      totalTransactions,
      categoryBreakdown,
      paymentMethodBreakdown,
      history: expenses
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
