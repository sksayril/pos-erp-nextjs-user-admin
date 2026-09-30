import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { DeliveryChallanModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    let challans = await DeliveryChallanModel.find({}).sort({ createdAt: -1 });

    if (challans.length === 0) {
      const defaultChallans = [
        {
          challanNumber: 'DC-2026-001',
          invoiceNumber: 'INV-2026-001',
          date: '2026-03-28',
          customerName: 'Rahul Sharma',
          deliveryAddress: 'Flat 402, Sea Green Heights, Bandra West, Mumbai',
          driverName: 'Amit Verma',
          vehicleNumber: 'MH-01-XY-4421',
          items: [
            {
              productName: 'MacBook Pro M3 Max 16"',
              sku: 'MBP-M3-16-01',
              quantity: 1,
              unit: 'Pieces (pcs)'
            }
          ],
          status: 'Delivered',
          notes: 'Customer signed delivery receipt on delivery.'
        },
        {
          challanNumber: 'DC-2026-002',
          invoiceNumber: 'INV-2026-002',
          date: '2026-03-29',
          customerName: 'TechCorp Solutions Pvt Ltd',
          deliveryAddress: 'Plot 88, Tech Park Phase 2, Pune',
          driverName: 'Suresh Patil',
          vehicleNumber: 'MH-12-AB-9921',
          items: [
            {
              productName: 'Samsung Galaxy S24 Ultra 512GB',
              sku: 'SM-S24U-512',
              quantity: 2,
              unit: 'Pieces (pcs)'
            }
          ],
          status: 'Dispatched',
          notes: 'Expected delivery by today 6:00 PM.'
        }
      ];
      await DeliveryChallanModel.insertMany(defaultChallans);
      challans = await DeliveryChallanModel.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json(challans);
  } catch (error: any) {
    console.error('Fetch Delivery Challans Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch delivery challans' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.challanNumber || !body.customerName || !body.deliveryAddress) {
      return NextResponse.json({ error: 'Challan number, customer, and address are required' }, { status: 400 });
    }

    const existing = await DeliveryChallanModel.findOne({ challanNumber: body.challanNumber });
    if (existing) {
      return NextResponse.json({ error: 'Challan number already exists' }, { status: 400 });
    }

    const newChallan = await DeliveryChallanModel.create({
      challanNumber: body.challanNumber.toUpperCase(),
      invoiceNumber: body.invoiceNumber || 'INV-DIRECT',
      date: body.date || new Date().toISOString().split('T')[0],
      customerName: body.customerName,
      deliveryAddress: body.deliveryAddress,
      driverName: body.driverName || 'Fleet Driver',
      vehicleNumber: body.vehicleNumber || 'N/A',
      items: body.items || [],
      status: body.status || 'Dispatched',
      notes: body.notes || ''
    });

    return NextResponse.json(newChallan, { status: 201 });
  } catch (error: any) {
    console.error('Create Delivery Challan Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create delivery challan' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ error: 'Challan ID is required' }, { status: 400 });
    }

    const updated = await DeliveryChallanModel.findByIdAndUpdate(_id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Delivery Challan not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update Delivery Challan Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update delivery challan' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Challan ID is required' }, { status: 400 });
    }

    await DeliveryChallanModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Delivery Challan deleted' });
  } catch (error: any) {
    console.error('Delete Delivery Challan Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete delivery challan' }, { status: 500 });
  }
}
