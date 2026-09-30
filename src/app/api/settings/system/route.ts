import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { SystemSettingsModel } from '../../../../lib/models';

const DEFAULT_SYSTEM = {
  lowStockThreshold: 10,
  enableSoundAlerts: true,
  enableBarcodeScanner: true,
  enableNegativeStockSale: false,
  enableCreditSales: true,
  taxInclusivePricing: false,
  defaultWarehouse: 'Main Central Hub',
  defaultPaymentMethod: 'Cash',
  sessionTimeoutMinutes: 60,
  maintenanceMode: false
};

export async function GET() {
  try {
    await connectDB();
    let sys = await SystemSettingsModel.findOne();
    if (!sys) {
      sys = await SystemSettingsModel.create(DEFAULT_SYSTEM);
    }
    return NextResponse.json(sys);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    let sys = await SystemSettingsModel.findOne();
    if (sys) {
      Object.assign(sys, body);
      await sys.save();
    } else {
      sys = await SystemSettingsModel.create({ ...DEFAULT_SYSTEM, ...body });
    }
    return NextResponse.json(sys);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
