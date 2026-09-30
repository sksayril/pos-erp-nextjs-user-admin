import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { PriceListModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    let priceLists = await PriceListModel.find({}).sort({ createdAt: -1 });

    if (priceLists.length === 0) {
      const defaultPriceLists = [
        {
          name: 'Wholesale Standard',
          code: 'PL-WHOLESALE',
          type: 'Percentage Discount',
          value: 15,
          applicableFor: 'Wholesale B2B Clients',
          status: 'Active'
        },
        {
          name: 'VIP Corporate Partner',
          code: 'PL-VIP-CORP',
          type: 'Percentage Discount',
          value: 20,
          applicableFor: 'Selected Enterprise Buyers',
          status: 'Active'
        },
        {
          name: 'Festive Flash Sale Discount',
          code: 'PL-FESTIVE-10',
          type: 'Percentage Discount',
          value: 10,
          applicableFor: 'All Registered Customers',
          status: 'Active'
        },
        {
          name: 'Distributor Cost Plus Margin',
          code: 'PL-DISTRIB-COST',
          type: 'Markup',
          value: 12,
          applicableFor: 'Regional Key Distributors',
          status: 'Active'
        }
      ];
      await PriceListModel.insertMany(defaultPriceLists);
      priceLists = await PriceListModel.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json(priceLists);
  } catch (error: any) {
    console.error('Fetch Price Lists Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch price lists' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.name || !body.code) {
      return NextResponse.json({ error: 'Price list name and code are required' }, { status: 400 });
    }

    const existing = await PriceListModel.findOne({ code: body.code });
    if (existing) {
      return NextResponse.json({ error: 'Price list code already exists' }, { status: 400 });
    }

    const newPriceList = await PriceListModel.create({
      name: body.name,
      code: body.code.toUpperCase(),
      type: body.type || 'Percentage Discount',
      value: Number(body.value) || 0,
      applicableFor: body.applicableFor || 'All Customers',
      status: body.status || 'Active'
    });

    return NextResponse.json(newPriceList, { status: 201 });
  } catch (error: any) {
    console.error('Create Price List Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create price list' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ error: 'Price List ID is required' }, { status: 400 });
    }

    if (updateData.value) {
      updateData.value = Number(updateData.value);
    }

    const updated = await PriceListModel.findByIdAndUpdate(_id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Price list not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update Price List Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update price list' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Price List ID is required' }, { status: 400 });
    }

    await PriceListModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Price list deleted successfully' });
  } catch (error: any) {
    console.error('Delete Price List Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete price list' }, { status: 500 });
  }
}
