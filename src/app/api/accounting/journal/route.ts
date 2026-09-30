import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { JournalEntryModel, AccountModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    let entries = await JournalEntryModel.find().sort({ date: -1, createdAt: -1 });

    if (entries.length === 0) {
      const defaultEntries = [
        {
          entryNumber: 'JRN-2026-001',
          date: '2026-09-30',
          reference: 'POS-REV-ADJ-09',
          description: 'Daily cash sales recognition and tax output entry.',
          lines: [
            {
              accountId: '1010',
              accountCode: '1010',
              accountName: 'Main Cash in Hand',
              debit: 14500,
              credit: 0,
              notes: 'Gross retail cash collected'
            },
            {
              accountId: '4010',
              accountCode: '4010',
              accountName: 'POS Retail & Commercial Sales Revenue',
              debit: 0,
              credit: 12946.43,
              notes: 'Net turnover revenue'
            },
            {
              accountId: '2020',
              accountCode: '2020',
              accountName: 'GST / VAT Output Tax Payable',
              debit: 0,
              credit: 1553.57,
              notes: '12% GST tax component'
            }
          ],
          totalDebit: 14500,
          totalCredit: 14500,
          status: 'Posted',
          createdBy: 'Super Admin'
        },
        {
          entryNumber: 'JRN-2026-002',
          date: '2026-09-28',
          reference: 'PAYROLL-DISB-SEP',
          description: 'Staff payroll disbursement from HDFC Bank.',
          lines: [
            {
              accountId: '5020',
              accountCode: '5020',
              accountName: 'Staff Payroll & Salaries Expense',
              debit: 35000,
              credit: 0,
              notes: 'September month salary expense'
            },
            {
              accountId: '1020',
              accountCode: '1020',
              accountName: 'HDFC Corporate Current Account',
              debit: 0,
              credit: 35000,
              notes: 'Bank fund transfer clearance'
            }
          ],
          totalDebit: 35000,
          totalCredit: 35000,
          status: 'Posted',
          createdBy: 'Super Admin'
        }
      ];
      entries = await JournalEntryModel.insertMany(defaultEntries);
    }

    return NextResponse.json(entries);
  } catch (error: any) {
    console.error('Accounting Journal GET Error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { date, reference, description, lines, createdBy } = body;

    if (!description || !Array.isArray(lines) || lines.length < 2) {
      return NextResponse.json({ error: 'A journal entry requires a description and at least 2 debit/credit lines.' }, { status: 400 });
    }

    const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);

    // Validate debit === credit in double-entry bookkeeping
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json({ 
        error: `Unbalanced journal entry! Total Debit (₹${totalDebit.toFixed(2)}) must equal Total Credit (₹${totalCredit.toFixed(2)}).` 
      }, { status: 400 });
    }

    const count = await JournalEntryModel.countDocuments();
    const entryNumber = `JRN-2026-${String(count + 1).padStart(3, '0')}`;

    // Update account balances
    for (const line of lines) {
      const netChange = (Number(line.debit) || 0) - (Number(line.credit) || 0);
      if (line.accountId || line.accountName) {
        await AccountModel.findOneAndUpdate(
          line.accountId ? { _id: line.accountId } : { name: line.accountName },
          { $inc: { currentBalance: netChange } }
        );
      }
    }

    const newJournal = await JournalEntryModel.create({
      entryNumber,
      date: date || new Date().toISOString().split('T')[0],
      reference: reference || undefined,
      description: description.trim(),
      lines,
      totalDebit,
      totalCredit,
      status: 'Posted',
      createdBy: createdBy || 'Super Admin'
    });

    return NextResponse.json(newJournal, { status: 201 });
  } catch (error: any) {
    console.error('Accounting Journal POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to post journal entry' }, { status: 500 });
  }
}
