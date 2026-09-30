import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { TaxRateModel } from '../../../../lib/models';

const DEFAULT_TAX_RATES = [
  { name: 'GST 0% (Exempt)', rate: 0, code: 'GST0', type: 'Exempt', isDefault: false, description: 'Exempted basic agricultural & essential supplies.' },
  { name: 'GST 5% (Essential Goods)', rate: 5, code: 'GST5', type: 'CGST+SGST', isDefault: false, description: 'CGST 2.5% + SGST 2.5% on food items & medicines.' },
  { name: 'GST 12% (Standard Low)', rate: 12, code: 'GST12', type: 'CGST+SGST', isDefault: false, description: 'CGST 6% + SGST 6% on apparel, processed food.' },
  { name: 'GST 18% (Standard High)', rate: 18, code: 'GST18', type: 'CGST+SGST', isDefault: true, description: 'CGST 9% + SGST 9% standard commercial electronics & services.' },
  { name: 'GST 28% (Luxury & Sin)', rate: 28, code: 'GST28', type: 'CGST+SGST', isDefault: false, description: 'CGST 14% + SGST 14% luxury vehicles & tobacco.' },
  { name: 'IGST 18% (Interstate)', rate: 18, code: 'IGST18', type: 'IGST', isDefault: false, description: 'Inter-state integrated sales tax 18%.' }
];

export async function GET() {
  try {
    await connectDB();
    let rates = await TaxRateModel.find().sort({ rate: 1 });
    if (rates.length === 0) {
      await TaxRateModel.insertMany(DEFAULT_TAX_RATES);
      rates = await TaxRateModel.find().sort({ rate: 1 });
    }
    return NextResponse.json(rates);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const newTax = await TaxRateModel.create(body);
    return NextResponse.json(newTax, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;
    const updated = await TaxRateModel.findByIdAndUpdate(_id, updateData, { new: true });
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
    await TaxRateModel.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Tax rate deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
