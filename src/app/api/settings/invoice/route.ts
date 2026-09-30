import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { InvoiceConfigModel } from '../../../../lib/models';

const DEFAULT_INVOICE = {
  invoicePrefix: 'INV-2026-',
  invoiceSuffix: '',
  startingNumber: 1001,
  paperSize: 'A4',
  themeColor: '#7c3aed',
  showLogo: true,
  showQrCode: true,
  showTaxBreakup: true,
  showBankDetails: true,
  bankName: 'HDFC Corporate Current Account',
  bankAccountNumber: '50200088992211',
  bankIfsc: 'HDFC0000123',
  upiId: 'apexretail@hdfcbank',
  termsAndConditions: '1. Goods once sold will only be returned within 7 days with valid bill.\n2. Interest @ 18% p.a. will be charged for delayed payments after 30 days.',
  footerNote: 'Thank you for your business! For support call +91 98300 12345'
};

export async function GET() {
  try {
    await connectDB();
    let config = await InvoiceConfigModel.findOne();
    if (!config) {
      config = await InvoiceConfigModel.create(DEFAULT_INVOICE);
    }
    return NextResponse.json(config);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    let config = await InvoiceConfigModel.findOne();
    if (config) {
      Object.assign(config, body);
      await config.save();
    } else {
      config = await InvoiceConfigModel.create({ ...DEFAULT_INVOICE, ...body });
    }
    return NextResponse.json(config);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
