import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { WarehouseModel } from '../../../../lib/models';

const DEFAULT_WAREHOUSES = [
  { code: 'WH-01', name: 'Main Central Hub', managerName: 'Amitava Sen', phone: '+91 98300 44211', email: 'warehouse1@apexretail.in', address: 'Plot 12, Industrial Area, Sector V', city: 'Kolkata', state: 'West Bengal', pincode: '700091', capacity: '100,000 Units', isDefault: true, status: 'Active' },
  { code: 'WH-02', name: 'West Regional Depot', managerName: 'Rohit Verma', phone: '+91 98200 88712', email: 'wh-west@apexretail.in', address: 'Warehouse Complex 4, Thane', city: 'Mumbai', state: 'Maharashtra', pincode: '400601', capacity: '60,000 Units', isDefault: false, status: 'Active' },
  { code: 'WH-03', name: 'North Distribution Center', managerName: 'Sanjay Malik', phone: '+91 98110 33499', email: 'wh-north@apexretail.in', address: 'Okhla Phase 3', city: 'New Delhi', state: 'Delhi', pincode: '110020', capacity: '75,000 Units', isDefault: false, status: 'Active' }
];

export async function GET() {
  try {
    await connectDB();
    let whs = await WarehouseModel.find();
    if (whs.length === 0) {
      await WarehouseModel.insertMany(DEFAULT_WAREHOUSES);
      whs = await WarehouseModel.find();
    }
    return NextResponse.json(whs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const newWh = await WarehouseModel.create(body);
    return NextResponse.json(newWh, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;
    const updated = await WarehouseModel.findByIdAndUpdate(_id, updateData, { new: true });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await WarehouseModel.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Warehouse deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
