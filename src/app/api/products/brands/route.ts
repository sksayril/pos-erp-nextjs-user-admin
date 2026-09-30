import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { BrandModel } from '../../../../lib/models';

const DEFAULT_BRANDS = [
  { name: 'Dell Technologies', code: 'BRD-DELL', country: 'United States', description: 'Enterprise monitors, servers, workstations', status: 'Active' },
  { name: 'Logitech', code: 'BRD-LOGI', country: 'Switzerland', description: 'Mice, keyboards, webcams, headsets', status: 'Active' },
  { name: 'Samsung Electronics', code: 'BRD-SAMS', country: 'South Korea', description: 'Smart displays, NVMe SSD storage', status: 'Active' },
  { name: 'HP Inc', code: 'BRD-HP', country: 'United States', description: 'Laser printers, laptops, desktop units', status: 'Active' },
  { name: 'Sony', code: 'BRD-SONY', country: 'Japan', description: 'Audio equipment, cameras, visual sensors', status: 'Active' },
  { name: 'TP-Link', code: 'BRD-TPLINK', country: 'Singapore', description: 'Wi-Fi routers, enterprise network switches', status: 'Active' }
];

export async function GET() {
  try {
    await connectDB();
    let brands = await BrandModel.find().sort({ name: 1 });
    if (brands.length === 0) {
      await BrandModel.insertMany(DEFAULT_BRANDS);
      brands = await BrandModel.find().sort({ name: 1 });
    }
    return NextResponse.json(brands);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const newBrand = await BrandModel.create(body);
    return NextResponse.json(newBrand, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;
    const updated = await BrandModel.findByIdAndUpdate(_id, updateData, { new: true });
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
    await BrandModel.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Brand deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
