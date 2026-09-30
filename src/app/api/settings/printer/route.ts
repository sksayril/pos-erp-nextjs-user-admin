import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { PrinterConfigModel } from '../../../../lib/models';

const DEFAULT_PRINTERS = [
  { printerName: 'Main Counter Thermal 80mm', type: 'Thermal POS 80mm', connectionType: 'Browser Print Dialog', isDefault: true, autoPrintOnSale: true, openCashDrawerOnSale: true, status: 'Active' },
  { printerName: 'Office Laser A4 Invoice Printer', type: 'A4 Laser / Inkjet', connectionType: 'Browser Print Dialog', isDefault: false, autoPrintOnSale: false, openCashDrawerOnSale: false, status: 'Active' },
  { printerName: 'Warehouse Barcode Sticker Printer', type: 'Barcode Label Printer', connectionType: 'USB / Direct', isDefault: false, autoPrintOnSale: false, openCashDrawerOnSale: false, status: 'Active' }
];

export async function GET() {
  try {
    await connectDB();
    let printers = await PrinterConfigModel.find();
    if (printers.length === 0) {
      await PrinterConfigModel.insertMany(DEFAULT_PRINTERS);
      printers = await PrinterConfigModel.find();
    }
    return NextResponse.json(printers);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const newPrinter = await PrinterConfigModel.create(body);
    return NextResponse.json(newPrinter, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;
    const updated = await PrinterConfigModel.findByIdAndUpdate(_id, updateData, { new: true });
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
    await PrinterConfigModel.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Printer deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
