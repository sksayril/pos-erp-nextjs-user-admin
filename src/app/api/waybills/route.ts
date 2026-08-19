import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { WaybillModel } from '../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    let waybills = await WaybillModel.find({}).sort({ createdAt: -1 });

    if (waybills.length === 0) {
      // Seed default waybill data for demonstration
      const defaults = [
        {
          ewayBillNo: 'EWAY-2026-8871',
          invoiceNo: 'INV-2026-9041',
          customerName: 'Acme Corporates',
          transporterName: 'Blue Dart Logistics',
          vehicleNo: 'KA-03-MG-4421',
          distance: 280,
          status: 'Active',
          date: '2026-08-19'
        },
        {
          ewayBillNo: 'EWAY-2026-1049',
          invoiceNo: 'INV-2026-8812',
          customerName: 'Retail Trader Corp',
          transporterName: 'Safe Express',
          vehicleNo: 'MH-12-PQ-8891',
          distance: 450,
          status: 'Expired',
          date: '2026-08-15'
        }
      ];
      await WaybillModel.insertMany(defaults);
      waybills = await WaybillModel.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json(waybills);
  } catch (error: any) {
    console.error('Fetch Waybills Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch waybills' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const existing = await WaybillModel.findOne({ ewayBillNo: body.ewayBillNo });
    if (existing) {
      return NextResponse.json({ error: `E-Waybill No "${body.ewayBillNo}" already exists.` }, { status: 400 });
    }

    const newWaybill = await WaybillModel.create(body);
    return NextResponse.json(newWaybill, { status: 201 });
  } catch (error: any) {
    console.error('Create Waybill Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create waybill' }, { status: 500 });
  }
}
