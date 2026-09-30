import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { VariantModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    let variants = await VariantModel.find({}).sort({ createdAt: -1 });

    if (variants.length === 0) {
      const defaultVariants = [
        {
          attributeName: 'Size',
          code: 'VAR-SIZE',
          values: ['Small', 'Medium', 'Large', 'XL', 'XXL'],
          status: 'Active'
        },
        {
          attributeName: 'Color',
          code: 'VAR-COLOR',
          values: ['Space Gray', 'Silver', 'Midnight Black', 'Deep Navy', 'Gold'],
          status: 'Active'
        },
        {
          attributeName: 'Storage Capacity',
          code: 'VAR-STORAGE',
          values: ['128GB', '256GB', '512GB', '1TB', '2TB'],
          status: 'Active'
        },
        {
          attributeName: 'RAM Memory',
          code: 'VAR-RAM',
          values: ['8GB', '16GB', '24GB', '32GB', '64GB'],
          status: 'Active'
        },
        {
          attributeName: 'Material Finish',
          code: 'VAR-MATERIAL',
          values: ['Matte', 'Glossy', 'Metallic', 'Carbon Fiber', 'Brushed Aluminum'],
          status: 'Active'
        }
      ];
      await VariantModel.insertMany(defaultVariants);
      variants = await VariantModel.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json(variants);
  } catch (error: any) {
    console.error('Fetch Variants Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch variants' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.attributeName || !body.code) {
      return NextResponse.json({ error: 'Attribute name and code are required' }, { status: 400 });
    }

    const existing = await VariantModel.findOne({ code: body.code });
    if (existing) {
      return NextResponse.json({ error: 'Variant attribute code already exists' }, { status: 400 });
    }

    const newVariant = await VariantModel.create({
      attributeName: body.attributeName,
      code: body.code.toUpperCase(),
      values: Array.isArray(body.values) ? body.values : (body.values || '').split(',').map((v: string) => v.trim()).filter(Boolean),
      status: body.status || 'Active'
    });

    return NextResponse.json(newVariant, { status: 201 });
  } catch (error: any) {
    console.error('Create Variant Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create variant' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ error: 'Variant ID is required' }, { status: 400 });
    }

    if (updateData.values && typeof updateData.values === 'string') {
      updateData.values = updateData.values.split(',').map((v: string) => v.trim()).filter(Boolean);
    }

    const updated = await VariantModel.findByIdAndUpdate(_id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update Variant Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update variant' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Variant ID is required' }, { status: 400 });
    }

    await VariantModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Variant deleted successfully' });
  } catch (error: any) {
    console.error('Delete Variant Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete variant' }, { status: 500 });
  }
}
