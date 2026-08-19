import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { ProductModel } from '../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    const products = await ProductModel.find({}).sort({ createdAt: -1 });
    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Fetch Products Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // Verify SKU uniqueness
    const existing = await ProductModel.findOne({ sku: body.sku });
    if (existing) {
      return NextResponse.json({ error: `Product with SKU "${body.sku}" already exists.` }, { status: 400 });
    }

    const newProduct = await ProductModel.create(body);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error('Create Product Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 550 });
  }
}
