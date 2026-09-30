import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { TransferModel } from '../../../../lib/models';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const transfer = await TransferModel.findById(id);
    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }
    return NextResponse.json(transfer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const data = await req.json();

    const updated = await TransferModel.findByIdAndUpdate(
      id,
      {
        status: data.status,
        vehicleNumber: data.vehicleNumber,
        driverName: data.driverName,
        driverPhone: data.driverPhone,
        trackingNumber: data.trackingNumber,
        shippingCharge: Number(data.shippingCharge) || 0,
        notes: data.notes,
        receivedBy: data.receivedBy,
        receivedDate: data.receivedDate
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
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
    const deleted = await TransferModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Transfer record deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
