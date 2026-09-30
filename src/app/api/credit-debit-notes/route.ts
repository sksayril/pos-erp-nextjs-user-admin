import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { CreditNoteModel, DebitNoteModel } from '../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    let creditNotes = await CreditNoteModel.find({}).sort({ createdAt: -1 });
    let debitNotes = await DebitNoteModel.find({}).sort({ createdAt: -1 });

    if (creditNotes.length === 0) {
      const defaultCredits = [
        {
          noteNo: 'CN-2026-0012',
          invoiceNo: 'INV-2026-9041',
          customerName: 'Acme Corporates',
          refundAmount: 1250.00,
          date: '2026-08-19',
          reason: 'Defective product batch returns',
          status: 'Issued'
        },
        {
          noteNo: 'CN-2026-0009',
          invoiceNo: 'INV-2026-8812',
          customerName: 'Retail Trader Corp',
          refundAmount: 600.00,
          date: '2026-08-14',
          reason: 'Over-billed item rate discount correction',
          status: 'Refunded'
        }
      ];
      await CreditNoteModel.insertMany(defaultCredits);
      creditNotes = await CreditNoteModel.find({}).sort({ createdAt: -1 });
    }

    if (debitNotes.length === 0) {
      const defaultDebits = [
        {
          noteNo: 'DN-2026-0041',
          purchaseNo: 'PUR-2026-1042',
          supplierName: 'Indo Global Importers',
          debitAmount: 850.00,
          date: '2026-08-18',
          reason: 'Damaged item stock returned to supplier',
          status: 'Issued'
        },
        {
          noteNo: 'DN-2026-0018',
          purchaseNo: 'PUR-2026-0981',
          supplierName: 'Kolkata Wholesale Hub',
          debitAmount: 1200.00,
          date: '2026-08-12',
          reason: 'Shortage of delivery goods quantity discount',
          status: 'Adjusted'
        }
      ];
      await DebitNoteModel.insertMany(defaultDebits);
      debitNotes = await DebitNoteModel.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json({ creditNotes, debitNotes });
  } catch (error: any) {
    console.error('Fetch Credit/Debit Notes Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch credit/debit notes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const { type, data } = await req.json();

    if (type === 'credit') {
      const existing = await CreditNoteModel.findOne({ noteNo: data.noteNo });
      if (existing) {
        return NextResponse.json({ error: `Credit Note No "${data.noteNo}" already exists.` }, { status: 400 });
      }
      const newNote = await CreditNoteModel.create(data);
      return NextResponse.json(newNote, { status: 201 });
    } else if (type === 'debit') {
      const existing = await DebitNoteModel.findOne({ noteNo: data.noteNo });
      if (existing) {
        return NextResponse.json({ error: `Debit Note No "${data.noteNo}" already exists.` }, { status: 400 });
      }
      const newNote = await DebitNoteModel.create(data);
      return NextResponse.json(newNote, { status: 201 });
    } else {
      return NextResponse.json({ error: 'Invalid credit/debit type' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Create Note Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record credit/debit note' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const { id, type, status } = await req.json();
    if (type === 'credit') {
      const updated = await CreditNoteModel.findByIdAndUpdate(id, { status }, { new: true });
      return NextResponse.json(updated);
    } else if (type === 'debit') {
      const updated = await DebitNoteModel.findByIdAndUpdate(id, { status }, { new: true });
      return NextResponse.json(updated);
    }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (!id || !type) {
      return NextResponse.json({ error: 'ID and type are required' }, { status: 400 });
    }

    if (type === 'credit') {
      await CreditNoteModel.findByIdAndDelete(id);
      return NextResponse.json({ success: true, message: 'Credit note deleted successfully' });
    } else if (type === 'debit') {
      await DebitNoteModel.findByIdAndDelete(id);
      return NextResponse.json({ success: true, message: 'Debit note deleted successfully' });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete note' }, { status: 500 });
  }
}
