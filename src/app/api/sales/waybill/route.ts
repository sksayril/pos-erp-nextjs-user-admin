import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { EWaybillModel, SaleModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    let waybills = await EWaybillModel.find({}).sort({ createdAt: -1 });

    if (waybills.length === 0) {
      const defaultWaybills = [
        {
          ewaybillNumber: 'EWB-2026-992101',
          invoiceNumber: 'INV-2026-002',
          date: '2026-03-29',
          validUntil: '2026-04-02',
          customerName: 'TechCorp Solutions Pvt Ltd',
          dispatchFrom: 'Main Warehouse Central, Mumbai',
          shipTo: 'Plot 88, Tech Park Phase 2, Pune',
          vehicleNumber: 'MH-12-AB-9921',
          transporterName: 'Bluedart Surface Express',
          distanceKm: 145,
          totalValue: 294997,
          status: 'In Transit'
        },
        {
          ewaybillNumber: 'EWB-2026-881204',
          invoiceNumber: 'INV-2026-001',
          date: '2026-03-28',
          validUntil: '2026-03-31',
          customerName: 'Rahul Sharma',
          dispatchFrom: 'Main Warehouse Central, Mumbai',
          shipTo: 'Bandra West, Mumbai',
          vehicleNumber: 'MH-01-XY-4421',
          transporterName: 'Local Fleet Logistics',
          distanceKm: 18,
          totalValue: 406982,
          status: 'Delivered'
        }
      ];
      await EWaybillModel.insertMany(defaultWaybills);
      waybills = await EWaybillModel.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json(waybills);
  } catch (error: any) {
    console.error('Fetch E-Waybills Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch e-waybills' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.ewaybillNumber || !body.customerName || !body.vehicleNumber) {
      return NextResponse.json({ error: 'E-Waybill number, customer, and vehicle number are required' }, { status: 400 });
    }

    const existing = await EWaybillModel.findOne({ ewaybillNumber: body.ewaybillNumber });
    if (existing) {
      return NextResponse.json({ error: 'E-Waybill number already exists' }, { status: 400 });
    }

    const newWaybill = await EWaybillModel.create({
      ewaybillNumber: body.ewaybillNumber.toUpperCase(),
      invoiceNumber: body.invoiceNumber || 'INV-DIRECT',
      date: body.date || new Date().toISOString().split('T')[0],
      validUntil: body.validUntil || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customerName: body.customerName,
      dispatchFrom: body.dispatchFrom || 'Main Warehouse Central',
      shipTo: body.shipTo || 'Customer Billing Address',
      vehicleNumber: body.vehicleNumber.toUpperCase(),
      transporterName: body.transporterName || 'Fleet Logistics Partner',
      distanceKm: Number(body.distanceKm) || 20,
      totalValue: Number(body.totalValue) || 0,
      status: body.status || 'Generated'
    });

    return NextResponse.json(newWaybill, { status: 201 });
  } catch (error: any) {
    console.error('Create E-Waybill Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate e-waybill' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ error: 'E-Waybill ID is required' }, { status: 400 });
    }

    const updated = await EWaybillModel.findByIdAndUpdate(_id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'E-Waybill not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update E-Waybill Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update e-waybill' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'E-Waybill ID is required' }, { status: 400 });
    }

    await EWaybillModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'E-Waybill deleted' });
  } catch (error: any) {
    console.error('Delete E-Waybill Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete e-waybill' }, { status: 500 });
  }
}
