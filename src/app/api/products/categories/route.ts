import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { CategoryModel } from '../../../../lib/models';

const DEFAULT_CATEGORIES = [
  { name: 'Electronics & Computers', code: 'CAT-ELEC', parentCategory: 'None', description: 'Monitors, peripherals, computing hardware', status: 'Active' },
  { name: 'Accessories & Cables', code: 'CAT-ACC', parentCategory: 'Electronics & Computers', description: 'Cables, converters, hubs, chargers', status: 'Active' },
  { name: 'Office Supplies & Stationery', code: 'CAT-OFFICE', parentCategory: 'None', description: 'Paper, notebooks, desk accessories', status: 'Active' },
  { name: 'Networking & Telecom', code: 'CAT-NET', parentCategory: 'Electronics & Computers', description: 'Routers, switches, patch cords', status: 'Active' },
  { name: 'Audio & Acoustics', code: 'CAT-AUDIO', parentCategory: 'Electronics & Computers', description: 'Headsets, speakers, microphones', status: 'Active' },
  { name: 'Storage & Memory', code: 'CAT-STORAGE', parentCategory: 'Electronics & Computers', description: 'SSDs, NVMe drives, USB flash drives', status: 'Active' }
];

export async function GET() {
  try {
    await connectDB();
    let categories = await CategoryModel.find().sort({ name: 1 });
    if (categories.length === 0) {
      await CategoryModel.insertMany(DEFAULT_CATEGORIES);
      categories = await CategoryModel.find().sort({ name: 1 });
    }
    return NextResponse.json(categories);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const newCat = await CategoryModel.create(body);
    return NextResponse.json(newCat, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;
    const updated = await CategoryModel.findByIdAndUpdate(_id, updateData, { new: true });
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
    await CategoryModel.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Category deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
