import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { PaymentMethodModel } from '../../../../lib/models';

const DEFAULT_METHODS = [
  { name: 'Cash', code: 'CASH', accountLinked: 'Main Cash in Hand', enabledForPOS: true, enabledForSales: true, processingFeePercent: 0, status: 'Active', icon: 'Banknote' },
  { name: 'UPI / QR Code', code: 'UPI', accountLinked: 'HDFC Corporate Current Account', enabledForPOS: true, enabledForSales: true, processingFeePercent: 0, status: 'Active', icon: 'QrCode' },
  { name: 'Debit / Credit Card', code: 'CARD', accountLinked: 'HDFC Corporate Current Account', enabledForPOS: true, enabledForSales: true, processingFeePercent: 1.5, status: 'Active', icon: 'CreditCard' },
  { name: 'Bank Wire / NEFT', code: 'BANK', accountLinked: 'SBI Business Account', enabledForPOS: false, enabledForSales: true, processingFeePercent: 0, status: 'Active', icon: 'Landmark' },
  { name: 'Cheque Deposit', code: 'CHEQUE', accountLinked: 'HDFC Corporate Current Account', enabledForPOS: false, enabledForSales: true, processingFeePercent: 0, status: 'Active', icon: 'FileCheck' }
];

export async function GET() {
  try {
    await connectDB();
    let methods = await PaymentMethodModel.find();
    if (methods.length === 0) {
      await PaymentMethodModel.insertMany(DEFAULT_METHODS);
      methods = await PaymentMethodModel.find();
    }
    return NextResponse.json(methods);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const newMethod = await PaymentMethodModel.create(body);
    return NextResponse.json(newMethod, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;
    const updated = await PaymentMethodModel.findByIdAndUpdate(_id, updateData, { new: true });
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
    await PaymentMethodModel.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Payment method deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
