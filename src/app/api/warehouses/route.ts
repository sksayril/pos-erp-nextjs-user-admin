import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { WarehouseModel } from '../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    let warehouses = await WarehouseModel.find({}).sort({ createdAt: -1 });

    if (warehouses.length === 0) {
      // Seed default warehouse data
      const defaults = [
        {
          name: 'Central Godown (HQ)',
          code: 'WH-HQ-01',
          phone: '(555) 0199-8877',
          email: 'hq-godown@poserp.com',
          status: 'Active',
          address: 'G-12 Industrial Focal Point, Sector 4, Kolkata',
          managerName: 'Rajesh Sharma'
        },
        {
          name: 'Salt Lake Outlet Store',
          code: 'WH-SL-02',
          phone: '(555) 0122-3344',
          email: 'saltlake@poserp.com',
          status: 'Active',
          address: 'Block EP, Sector V, Salt Lake, Kolkata',
          managerName: 'Arpita Sen'
        },
        {
          name: 'Howrah Buffer Depot',
          code: 'WH-HW-03',
          phone: '(555) 0166-7788',
          email: 'howrah@poserp.com',
          status: 'Active',
          address: 'Kona Expressway Crossing, Howrah',
          managerName: 'Vikram Singh'
        }
      ];
      await WarehouseModel.insertMany(defaults);
      warehouses = await WarehouseModel.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json(warehouses);
  } catch (error: any) {
    console.error('Fetch Warehouses Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch warehouses' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const existing = await WarehouseModel.findOne({ code: body.code });
    if (existing) {
      return NextResponse.json({ error: `Warehouse with code "${body.code}" already exists.` }, { status: 400 });
    }

    const newWarehouse = await WarehouseModel.create(body);
    return NextResponse.json(newWarehouse, { status: 201 });
  } catch (error: any) {
    console.error('Create Warehouse Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create warehouse' }, { status: 500 });
  }
}
