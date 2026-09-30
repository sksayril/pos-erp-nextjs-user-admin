import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { UnitModel } from '../../../../lib/models';

const DEFAULT_UNITS = [
  { name: 'Piece', code: 'PCS', baseUnit: 'Piece', operator: '*', operationValue: 1, status: 'Active' },
  { name: 'Box (Pack of 10)', code: 'BOX-10', baseUnit: 'Piece', operator: '*', operationValue: 10, status: 'Active' },
  { name: 'Carton (Pack of 50)', code: 'CTN-50', baseUnit: 'Piece', operator: '*', operationValue: 50, status: 'Active' },
  { name: 'Kilogram', code: 'KG', baseUnit: 'Gram', operator: '*', operationValue: 1000, status: 'Active' },
  { name: 'Liter', code: 'LTR', baseUnit: 'Milliliter', operator: '*', operationValue: 1000, status: 'Active' },
  { name: 'Dozen', code: 'DZN', baseUnit: 'Piece', operator: '*', operationValue: 12, status: 'Active' },
  { name: 'Meter', code: 'MTR', baseUnit: 'Centimeter', operator: '*', operationValue: 100, status: 'Active' }
];

export async function GET() {
  try {
    await connectDB();
    let units = await UnitModel.find().sort({ name: 1 });
    if (units.length === 0) {
      await UnitModel.insertMany(DEFAULT_UNITS);
      units = await UnitModel.find().sort({ name: 1 });
    }
    return NextResponse.json(units);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const newUnit = await UnitModel.create(body);
    return NextResponse.json(newUnit, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;
    const updated = await UnitModel.findByIdAndUpdate(_id, updateData, { new: true });
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
    await UnitModel.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Unit deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
