import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { PurchaseReturnModel, DebitNoteModel } from '../../../../lib/models';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const query: any = {};
    if (status) query.status = status;

    let returns = await PurchaseReturnModel.find(query).sort({ createdAt: -1 });

    if (returns.length === 0 && Object.keys(query).length === 0) {
      const defaultReturns = [
        {
          returnNumber: 'PR-2026-001',
          purchaseNumber: 'PUR-2026-001',
          date: '2026-03-25',
          supplierName: 'Apple Authorized Distributor',
          supplierPhone: '+91 98100 22334',
          warehouseName: 'Central Godown (HQ)',
          items: [
            {
              productId: 'prod1',
              productName: 'MacBook Pro M3 Max 16"',
              sku: 'MBP-M3-16-01',
              quantity: 1,
              unitCost: 280000,
              subtotal: 280000
            }
          ],
          totalAmount: 280000,
          debitAmount: 280000,
          claimStatus: 'Debit Issued',
          reason: 'Factory seal damaged upon unboxing, internal chassis scratch',
          status: 'Dispatched',
          debitNoteNo: 'DN-2026-0041',
          notes: 'Returned under DOA (Dead On Arrival) authorized vendor replacement SLA.',
          initiatedBy: 'QC Lead Vikram'
        },
        {
          returnNumber: 'PR-2026-002',
          purchaseNumber: 'PUR-2026-002',
          date: '2026-03-28',
          supplierName: 'Samsung Direct Logistics',
          supplierPhone: '+91 98200 99887',
          warehouseName: 'Howrah Buffer Depot',
          items: [
            {
              productId: 'prod3',
              productName: 'Samsung Galaxy S24 Ultra 512GB',
              sku: 'SM-S24U-512',
              quantity: 2,
              unitCost: 95000,
              subtotal: 190000
            }
          ],
          totalAmount: 190000,
          debitAmount: 190000,
          claimStatus: 'Adjusted in Next Bill',
          reason: 'Wrong color batch sent (Titanium Gray instead of Black)',
          status: 'Supplier Acknowledged',
          debitNoteNo: 'DN-2026-0045',
          notes: 'Supplier agreed to adjust Rs. 1,90,000 on upcoming monthly PO balance.',
          initiatedBy: 'Warehouse Manager Rajesh'
        }
      ];

      returns = await PurchaseReturnModel.insertMany(defaultReturns);
    }

    return NextResponse.json(returns);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();

    if (!data.purchaseNumber || !data.supplierName || !data.items || data.items.length === 0) {
      return NextResponse.json({ error: 'Purchase bill reference, supplier name, and return items are required.' }, { status: 400 });
    }

    const count = await PurchaseReturnModel.countDocuments();
    const currentYear = new Date().getFullYear();
    const returnNumber = data.returnNumber || `PR-${currentYear}-${String(count + 1).padStart(3, '0')}`;

    const processedItems = data.items.map((i: any) => {
      const qty = Number(i.quantity) || 1;
      const cost = Number(i.unitCost) || 0;
      return {
        productId: i.productId || `prod-${Date.now()}`,
        productName: i.productName,
        sku: i.sku || '',
        quantity: qty,
        unitCost: cost,
        subtotal: qty * cost
      };
    });

    const totalAmount = processedItems.reduce((acc: number, i: any) => acc + i.subtotal, 0);
    const debitAmount = Number(data.debitAmount) || totalAmount;
    const debitNoteNo = data.debitNoteNo || `DN-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReturn = await PurchaseReturnModel.create({
      returnNumber,
      purchaseNumber: data.purchaseNumber,
      date: data.date || new Date().toISOString().split('T')[0],
      supplierName: data.supplierName,
      supplierPhone: data.supplierPhone || '',
      warehouseName: data.warehouseName || 'Central Godown (HQ)',
      items: processedItems,
      totalAmount,
      debitAmount,
      claimStatus: data.claimStatus || 'Debit Issued',
      reason: data.reason || 'Supplier Defect / Return',
      status: data.status || 'Dispatched',
      debitNoteNo,
      notes: data.notes || '',
      initiatedBy: data.initiatedBy || 'QC & Procurement Officer'
    });

    // Also auto-generate or link Debit Note in DebitNoteModel
    await DebitNoteModel.create({
      noteNo: debitNoteNo,
      purchaseNo: data.purchaseNumber,
      supplierName: data.supplierName,
      debitAmount,
      date: data.date || new Date().toISOString().split('T')[0],
      reason: `Purchase Return ${returnNumber}: ${data.reason || 'Damaged goods return'}`,
      status: data.claimStatus === 'Adjusted in Next Bill' ? 'Adjusted' : 'Issued'
    }).catch(err => console.log('Debit note exists or skipped', err));

    return NextResponse.json(newReturn, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const deleted = await PurchaseReturnModel.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

    return NextResponse.json({ message: 'Purchase return record deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
