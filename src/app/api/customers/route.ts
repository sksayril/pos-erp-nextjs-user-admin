import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { CustomerModel } from '../../../lib/models';
import { mockCustomers } from '../../../lib/mockData';

export async function GET() {
  try {
    await connectDB();
    let customers = await CustomerModel.find().sort({ createdAt: -1 });

    if (customers.length === 0) {
      // Seed default customers
      const defaultData = mockCustomers.map(c => ({
        name: c.name,
        phone: c.phone,
        email: c.email || '',
        address: c.address || '',
        creditLimit: c.creditLimit || 0,
        outstandingBalance: c.outstandingBalance || 0,
        status: 'Active'
      }));
      customers = await CustomerModel.insertMany(defaultData);
    }

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error('Customer GET API Error:', error);
    return NextResponse.json(mockCustomers);
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, phone, email, address, creditLimit } = body;

    const cleanPhone = (phone || '').trim();
    if (!cleanPhone && !name) {
      return NextResponse.json({ error: 'Customer name or mobile number is required.' }, { status: 400 });
    }

    const finalName = name?.trim() || (cleanPhone ? `Customer ${cleanPhone}` : 'Walk-In Customer');
    const finalPhone = cleanPhone || '0000000000';

    // Check if customer already exists with this phone number (excluding 0000000000)
    if (finalPhone !== '0000000000') {
      const existing = await CustomerModel.findOne({ phone: finalPhone });
      if (existing) {
        return NextResponse.json(existing, { status: 200 });
      }
    }

    const newCustomer = await CustomerModel.create({
      name: finalName,
      phone: finalPhone,
      email: email?.trim() || '',
      address: address?.trim() || '',
      creditLimit: Number(creditLimit) || 0,
      outstandingBalance: 0,
      status: 'Active'
    });

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error: any) {
    console.error('Customer POST API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create customer' }, { status: 500 });
  }
}
