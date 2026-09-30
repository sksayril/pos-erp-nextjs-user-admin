import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { ExpenseModel } from '../../../../lib/models';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const expense = await ExpenseModel.findById(id);
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    return NextResponse.json(expense);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const data = await req.json();

    const updated = await ExpenseModel.findByIdAndUpdate(
      id,
      {
        title: data.title,
        category: data.category,
        categoryId: data.categoryId,
        amount: Number(data.amount) || 0,
        taxAmount: Number(data.taxAmount) || 0,
        date: data.date,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        paidBy: data.paidBy,
        vendor: data.vendor,
        reference: data.reference,
        receiptUrl: data.receiptUrl,
        warehouseName: data.warehouseName,
        description: data.description,
        approvedBy: data.approvedBy
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const deleted = await ExpenseModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
