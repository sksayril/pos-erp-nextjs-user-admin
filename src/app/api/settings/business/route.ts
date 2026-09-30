import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { BusinessSettingsModel } from '../../../../lib/models';

const DEFAULT_BUSINESS = {
  companyName: 'Apex Enterprise POS & ERP',
  tradeName: 'Apex Retail Solutions Ltd',
  gstin: '19AAACA9928P1Z8',
  pan: 'AAACA9928P',
  email: 'contact@apexretail.in',
  phone: '+91 98300 12345',
  website: 'https://apexretail.in',
  address: '74/B Sector V, Salt Lake Electronics Complex',
  city: 'Kolkata',
  state: 'West Bengal',
  country: 'India',
  pincode: '700091',
  currency: 'INR (₹)',
  currencySymbol: '₹',
  timezone: 'Asia/Kolkata (GMT+5:30)',
  fiscalYearStart: 'April',
  logoUrl: '',
  tagline: 'Smart Retail & Enterprise ERP System'
};

export async function GET() {
  try {
    await connectDB();
    let settings = await BusinessSettingsModel.findOne();
    if (!settings) {
      settings = await BusinessSettingsModel.create(DEFAULT_BUSINESS);
    }
    return NextResponse.json(settings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    let settings = await BusinessSettingsModel.findOne();
    if (settings) {
      Object.assign(settings, body);
      await settings.save();
    } else {
      settings = await BusinessSettingsModel.create({ ...DEFAULT_BUSINESS, ...body });
    }
    return NextResponse.json(settings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
