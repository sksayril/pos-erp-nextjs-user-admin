import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { ExpenseModel, ExpenseCategoryModel } from '../../../lib/models';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const paymentMethod = searchParams.get('paymentMethod');
    const paymentStatus = searchParams.get('paymentStatus');

    const query: any = {};
    if (category) query.category = category;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    let expenses = await ExpenseModel.find(query).sort({ createdAt: -1 });

    if (expenses.length === 0 && Object.keys(query).length === 0) {
      const defaultExpenses = [
        {
          expenseNumber: 'EXP-2026-001',
          title: 'Main Floor Monthly Lease & Building Maintenance',
          category: 'Office Rent & Facilities',
          amount: 45000,
          taxAmount: 4500,
          date: '2026-03-01',
          paymentMethod: 'Bank Transfer',
          paymentStatus: 'Paid',
          paidBy: 'Accounts Dept',
          vendor: 'Apex Real Estate Ventures',
          reference: 'RENT-MAR-2026',
          warehouseName: 'Central Hub Warehouse',
          description: 'Monthly office and storage premises lease payment for March 2026.',
          approvedBy: 'Admin'
        },
        {
          expenseNumber: 'EXP-2026-002',
          title: 'Electricity Power Grid & Generator Diesel',
          category: 'Electricity & Utilities',
          amount: 12450,
          taxAmount: 1245,
          date: '2026-03-05',
          paymentMethod: 'UPI',
          paymentStatus: 'Paid',
          paidBy: 'Operations Manager',
          vendor: 'State Electricity Supply Corp',
          reference: 'EBILL-8849201',
          warehouseName: 'Central Hub Warehouse',
          description: 'Power grid consumption for warehouse cooling and office computers.',
          approvedBy: 'Admin'
        },
        {
          expenseNumber: 'EXP-2026-003',
          title: 'Express Delivery Van Fuel & Courier Dispatch',
          category: 'Logistics & Courier Delivery',
          amount: 8750,
          taxAmount: 0,
          date: '2026-03-12',
          paymentMethod: 'Cash',
          paymentStatus: 'Paid',
          paidBy: 'Fleet Supervisor',
          vendor: 'Indian Oil & BlueDart Logistics',
          reference: 'FUEL-09923',
          warehouseName: 'East Distribution Center',
          description: 'Fuel re-fills for 3 delivery transit vans and express parcels.',
          approvedBy: 'Admin'
        },
        {
          expenseNumber: 'EXP-2026-004',
          title: 'Pantry Supplies, Tea, Coffee & Client Hospitality',
          category: 'Staff Refreshments & Tea',
          amount: 4200,
          taxAmount: 0,
          date: '2026-03-18',
          paymentMethod: 'Cash',
          paymentStatus: 'Paid',
          paidBy: 'Pantry Lead',
          vendor: 'Metro Cash & Carry',
          reference: 'RCP-PANTRY-77',
          warehouseName: 'Central Hub Warehouse',
          description: 'Monthly grocery, coffee beans, biscuits, milk, and tea bags for office staff.',
          approvedBy: 'Admin'
        },
        {
          expenseNumber: 'EXP-2026-005',
          title: 'Google Ads & Social Media Lead Gen Campaign',
          category: 'Digital Marketing & Ads',
          amount: 18500,
          taxAmount: 3330,
          date: '2026-03-22',
          paymentMethod: 'Credit Card',
          paymentStatus: 'Paid',
          paidBy: 'Marketing Lead',
          vendor: 'Google India Pvt Ltd',
          reference: 'G-ADS-MAR26',
          warehouseName: 'Central Hub Warehouse',
          description: 'Targeted pay-per-click ads for POS and wholesale electronics discount season.',
          approvedBy: 'Admin'
        },
        {
          expenseNumber: 'EXP-2026-006',
          title: 'AWS Cloud Hosting & Database Backup Cluster',
          category: 'IT & Software Subscriptions',
          amount: 14200,
          taxAmount: 2556,
          date: '2026-03-26',
          paymentMethod: 'Credit Card',
          paymentStatus: 'Paid',
          paidBy: 'CTO / System Admin',
          vendor: 'Amazon Web Services Inc',
          reference: 'AWS-INV-99014',
          warehouseName: 'Central Hub Warehouse',
          description: 'Production Kubernetes cluster, MongoDB Atlas database storage and S3 CDN.',
          approvedBy: 'Admin'
        }
      ];

      expenses = await ExpenseModel.insertMany(defaultExpenses);
    }

    return NextResponse.json(expenses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();

    if (!data.title || !data.amount || !data.category) {
      return NextResponse.json({ error: 'Title, category and amount are required' }, { status: 400 });
    }

    // Generate Expense Number
    const count = await ExpenseModel.countDocuments();
    const currentYear = new Date().getFullYear();
    const expenseNumber = data.expenseNumber || `EXP-${currentYear}-${String(count + 1).padStart(3, '0')}`;

    const newExpense = await ExpenseModel.create({
      expenseNumber,
      title: data.title,
      category: data.category,
      categoryId: data.categoryId || null,
      amount: Number(data.amount) || 0,
      taxAmount: Number(data.taxAmount) || 0,
      date: data.date || new Date().toISOString().split('T')[0],
      paymentMethod: data.paymentMethod || 'Cash',
      paymentStatus: data.paymentStatus || 'Paid',
      paidBy: data.paidBy || '',
      vendor: data.vendor || '',
      reference: data.reference || '',
      receiptUrl: data.receiptUrl || '',
      warehouseId: data.warehouseId || '',
      warehouseName: data.warehouseName || 'Central Hub Warehouse',
      description: data.description || '',
      approvedBy: data.approvedBy || 'Admin'
    });

    return NextResponse.json(newExpense, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
