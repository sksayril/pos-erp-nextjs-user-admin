import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { DeliveryModel } from '../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    let deliveries = await DeliveryModel.find({}).sort({ createdAt: -1 });

    if (deliveries.length === 0) {
      // Seed default delivery data
      const defaults = [
        {
          challanNo: 'CHAL-2026-0091',
          invoiceNo: 'INV-2026-9041',
          customerName: 'Acme Corporates',
          deliveryDate: '2026-08-19',
          status: 'Shipped',
          shippingAddress: 'Plot 45, Salt Lake Sector V, Kolkata, WB',
          courierName: 'DHL Express'
        },
        {
          challanNo: 'CHAL-2026-0042',
          invoiceNo: 'INV-2026-8812',
          customerName: 'Retail Trader Corp',
          deliveryDate: '2026-08-15',
          status: 'Delivered',
          shippingAddress: 'Gariahat Market Complex, Kolkata, WB',
          courierName: 'Professional Couriers'
        }
      ];
      await DeliveryModel.insertMany(defaults);
      deliveries = await DeliveryModel.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json(deliveries);
  } catch (error: any) {
    console.error('Fetch Deliveries Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch deliveries' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const existing = await DeliveryModel.findOne({ challanNo: body.challanNo });
    if (existing) {
      return NextResponse.json({ error: `Challan No "${body.challanNo}" already exists.` }, { status: 400 });
    }

    const newDelivery = await DeliveryModel.create(body);
    return NextResponse.json(newDelivery, { status: 201 });
  } catch (error: any) {
    console.error('Create Delivery Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create delivery challan' }, { status: 500 });
  }
}
