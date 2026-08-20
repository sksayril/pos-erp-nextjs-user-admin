import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { WaybillModel } from '../../../../lib/models';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const waybill = await WaybillModel.findById(id);
    if (!waybill) {
      return NextResponse.json({ error: 'Waybill not found' }, { status: 404 });
    }
    return NextResponse.json(waybill);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching waybill' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const updates = await req.json();

    const updatedWaybill = await WaybillModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );

    if (!updatedWaybill) {
      return NextResponse.json({ error: 'Waybill not found' }, { status: 404 });
    }

    return NextResponse.json(updatedWaybill);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating waybill' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const deleted = await WaybillModel.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Waybill not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Waybill deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deleting waybill' }, { status: 500 });
  }
}
