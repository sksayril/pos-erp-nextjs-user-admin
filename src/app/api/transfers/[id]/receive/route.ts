import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import { TransferModel } from '../../../../../lib/models';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const transfer = await TransferModel.findById(id);
    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    if (transfer.status === 'Completed') {
      return NextResponse.json({ error: 'Transfer is already marked as Completed.' }, { status: 400 });
    }

    transfer.status = 'Completed';
    transfer.receivedBy = body.receivedBy || 'Destination Warehouse Manager';
    transfer.receivedDate = new Date().toISOString().split('T')[0];
    await transfer.save();

    return NextResponse.json({
      message: `Transfer ${transfer.transferNumber} received and stock successfully replenished at ${transfer.toWarehouseName}!`,
      transfer
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
