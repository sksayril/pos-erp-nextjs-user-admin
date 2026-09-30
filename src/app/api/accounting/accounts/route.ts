import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { AccountModel } from '../../../../lib/models';
import { mockAccounts } from '../../../../lib/mockData';

export async function GET() {
  try {
    await connectDB();
    let accounts = await AccountModel.find().sort({ code: 1 });

    // Seed default chart of accounts if empty
    if (accounts.length === 0) {
      const defaultAccounts = [
        {
          code: '1010',
          name: 'Main Cash in Hand',
          type: 'Asset',
          subtype: 'Cash & Cash Equivalents',
          openingBalance: 45000,
          currentBalance: 82500,
          status: 'Active',
          description: 'Physical cash counter balance at primary store checkout.'
        },
        {
          code: '1020',
          name: 'HDFC Corporate Current Account',
          type: 'Asset',
          subtype: 'Bank Account',
          openingBalance: 120000,
          currentBalance: 285400,
          bankName: 'HDFC Bank Ltd',
          accountNumber: '50200088992211',
          ifscCode: 'HDFC0001234',
          status: 'Active',
          description: 'Primary corporate business checking account.'
        },
        {
          code: '1030',
          name: 'SBI Business Account',
          type: 'Asset',
          subtype: 'Bank Account',
          openingBalance: 50000,
          currentBalance: 94200,
          bankName: 'State Bank of India',
          accountNumber: '309988776655',
          ifscCode: 'SBIN0004567',
          status: 'Active',
          description: 'Secondary operational vendor payout account.'
        },
        {
          code: '1040',
          name: 'Accounts Receivable (Trade Debtors)',
          type: 'Asset',
          subtype: 'Current Asset',
          openingBalance: 18500,
          currentBalance: 42350,
          status: 'Active',
          description: 'Uncollected credit sales dues from retail & corporate customers.'
        },
        {
          code: '1050',
          name: 'Merchandise Inventory Asset',
          type: 'Asset',
          subtype: 'Inventory Asset',
          openingBalance: 250000,
          currentBalance: 310000,
          status: 'Active',
          description: 'Valuation of finished stock goods held in warehouses.'
        },
        {
          code: '2010',
          name: 'Accounts Payable (Trade Creditors)',
          type: 'Liability',
          subtype: 'Current Liability',
          openingBalance: 32000,
          currentBalance: 58400,
          status: 'Active',
          description: 'Outstanding dues owed to raw material & stock suppliers.'
        },
        {
          code: '2020',
          name: 'GST / VAT Output Tax Payable',
          type: 'Liability',
          subtype: 'Tax Liability',
          openingBalance: 8500,
          currentBalance: 14200,
          status: 'Active',
          description: 'Collected sales tax owed to state/central taxation authorities.'
        },
        {
          code: '3010',
          name: 'Owner Share Capital & Equity',
          type: 'Equity',
          subtype: 'Equity',
          openingBalance: 500000,
          currentBalance: 500000,
          status: 'Active',
          description: 'Founder initial investment and retained earnings reserve.'
        },
        {
          code: '4010',
          name: 'POS Retail & Commercial Sales Revenue',
          type: 'Revenue',
          subtype: 'Operating Revenue',
          openingBalance: 0,
          currentBalance: 642800,
          status: 'Active',
          description: 'Total turnover from daily point of sale invoices.'
        },
        {
          code: '5010',
          name: 'Cost of Goods Sold (COGS)',
          type: 'Expense',
          subtype: 'Direct Expense',
          openingBalance: 0,
          currentBalance: 385000,
          status: 'Active',
          description: 'Procurement and direct manufacturing cost of sold inventory.'
        },
        {
          code: '5020',
          name: 'Staff Payroll & Salaries Expense',
          type: 'Expense',
          subtype: 'Operating Expense',
          openingBalance: 0,
          currentBalance: 145000,
          status: 'Active',
          description: 'Monthly employee compensation, bonuses and allowances.'
        },
        {
          code: '5030',
          name: 'Store Rent & Utilities Expense',
          type: 'Expense',
          subtype: 'Administrative Expense',
          openingBalance: 0,
          currentBalance: 38000,
          status: 'Active',
          description: 'Commercial premise lease, electricity, and internet utilities.'
        }
      ];
      accounts = await AccountModel.insertMany(defaultAccounts);
    }

    return NextResponse.json(accounts);
  } catch (error: any) {
    console.error('Accounting Accounts GET Error:', error);
    return NextResponse.json(mockAccounts);
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, code, type, subtype, openingBalance, bankName, accountNumber, ifscCode, description } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Account Name and Classification Type are required.' }, { status: 400 });
    }

    const finalCode = code?.trim() || `10${Math.floor(50 + Math.random() * 40)}`;
    const openBal = Number(openingBalance) || 0;

    const newAccount = await AccountModel.create({
      code: finalCode,
      name: name.trim(),
      type,
      subtype: subtype || 'General',
      openingBalance: openBal,
      currentBalance: openBal,
      currency: 'INR',
      bankName: bankName?.trim() || undefined,
      accountNumber: accountNumber?.trim() || undefined,
      ifscCode: ifscCode?.trim() || undefined,
      status: 'Active',
      description: description?.trim() || ''
    });

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error: any) {
    console.error('Accounting Account POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create account' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updates } = body;

    if (!_id) {
      return NextResponse.json({ error: 'Account ID is required for update' }, { status: 400 });
    }

    const updated = await AccountModel.findByIdAndUpdate(_id, { $set: updates }, { new: true });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Accounting Account PUT Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update account' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required to delete account' }, { status: 400 });
    }

    await AccountModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Account removed' });
  } catch (error: any) {
    console.error('Accounting Account DELETE Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete account' }, { status: 500 });
  }
}
