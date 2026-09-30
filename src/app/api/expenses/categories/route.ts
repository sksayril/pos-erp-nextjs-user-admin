import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { ExpenseCategoryModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    let categories = await ExpenseCategoryModel.find({}).sort({ createdAt: -1 });

    if (categories.length === 0) {
      const defaultCategories = [
        {
          name: 'Office Rent & Facilities',
          code: 'EXP-RENT',
          budgetLimit: 50000,
          description: 'Monthly office floor rent, maintenance charges, and building amenities',
          color: 'blue',
          status: 'Active'
        },
        {
          name: 'Electricity & Utilities',
          code: 'EXP-UTIL',
          budgetLimit: 15000,
          description: 'Power grid bills, water supply, generator diesel, and utilities',
          color: 'amber',
          status: 'Active'
        },
        {
          name: 'Logistics & Courier Delivery',
          code: 'EXP-LOG',
          budgetLimit: 25000,
          description: 'Inter-warehouse freight, customer delivery fuel, courier charges',
          color: 'indigo',
          status: 'Active'
        },
        {
          name: 'Staff Refreshments & Tea',
          code: 'EXP-PANTRY',
          budgetLimit: 8000,
          description: 'Daily pantry supplies, tea, coffee, snacks, and client hospitality',
          color: 'emerald',
          status: 'Active'
        },
        {
          name: 'Digital Marketing & Ads',
          code: 'EXP-MKTG',
          budgetLimit: 30000,
          description: 'Google & Meta advertising campaigns, promotional flyers, banners',
          color: 'rose',
          status: 'Active'
        },
        {
          name: 'IT & Software Subscriptions',
          code: 'EXP-IT',
          budgetLimit: 20000,
          description: 'Cloud hosting, ERP licenses, domain renewals, internet broadband',
          color: 'purple',
          status: 'Active'
        },
        {
          name: 'Equipment Maintenance & Repair',
          code: 'EXP-MAINT',
          budgetLimit: 12000,
          description: 'AC servicing, POS barcode printer maintenance, hardware repairs',
          color: 'teal',
          status: 'Active'
        }
      ];

      categories = await ExpenseCategoryModel.insertMany(defaultCategories);
    }

    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();

    if (!data.name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const code = data.code || `EXP-${data.name.slice(0, 4).toUpperCase()}`;

    const newCategory = await ExpenseCategoryModel.create({
      name: data.name,
      code,
      budgetLimit: Number(data.budgetLimit) || 0,
      description: data.description || '',
      color: data.color || 'blue',
      status: data.status || 'Active'
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
