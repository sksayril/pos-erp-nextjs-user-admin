import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import { ExpenseCategoryModel, ExpenseModel } from '../../../../../lib/models';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const category = await ExpenseCategoryModel.findById(id);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const data = await req.json();

    const updated = await ExpenseCategoryModel.findByIdAndUpdate(
      id,
      {
        name: data.name,
        code: data.code,
        budgetLimit: Number(data.budgetLimit) || 0,
        description: data.description || '',
        color: data.color || 'blue',
        status: data.status || 'Active'
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Also update any expenses referencing the old category name if name changed
    if (data.name) {
      await ExpenseModel.updateMany({ categoryId: id }, { category: data.name });
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
    const deleted = await ExpenseCategoryModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
