import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { SupplierModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    let suppliers = await SupplierModel.find({}).sort({ createdAt: -1 });

    if (suppliers.length === 0) {
      const defaultSuppliers = [
        {
          name: 'Apple Authorized Distributor',
          phone: '+91 98765 43210',
          email: 'distribution@apple-partner.com',
          address: 'Plot 42, Tech Logistics Zone, Mumbai',
          outstandingPayable: 0,
          status: 'Active'
        },
        {
          name: 'Samsung Direct Logistics',
          phone: '+91 98112 33445',
          email: 'enterprise@samsung-supply.in',
          address: 'Building 12, Cyber City Hub, Gurugram',
          outstandingPayable: 622500,
          status: 'Active'
        },
        {
          name: 'Sony Audio Importers',
          phone: '+91 99001 22334',
          email: 'sales@sonyaudioimporters.com',
          address: 'Commercial Street, Bangalore',
          outstandingPayable: 0,
          status: 'Active'
        },
        {
          name: 'Dell Commercial Hardware',
          phone: '+91 98450 11223',
          email: 'b2b@dellhardware.co.in',
          address: 'Electronics Complex, Chennai',
          outstandingPayable: 125000,
          status: 'Active'
        },
        {
          name: 'Logitech Trade Partner',
          phone: '+91 97110 55667',
          email: 'trade@logitechpartners.in',
          address: 'Ring Road Industrial Area, New Delhi',
          outstandingPayable: 0,
          status: 'Active'
        }
      ];
      await SupplierModel.insertMany(defaultSuppliers);
      suppliers = await SupplierModel.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json(suppliers);
  } catch (error: any) {
    console.error('Fetch Suppliers Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.name || !body.phone) {
      return NextResponse.json({ error: 'Supplier name and phone are required' }, { status: 400 });
    }

    const newSupplier = await SupplierModel.create({
      name: body.name,
      phone: body.phone,
      email: body.email || '',
      address: body.address || '',
      outstandingPayable: Number(body.outstandingPayable) || 0,
      status: body.status || 'Active'
    });

    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error: any) {
    console.error('Create Supplier Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create supplier' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }

    const updated = await SupplierModel.findByIdAndUpdate(_id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update Supplier Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update supplier' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }

    await SupplierModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error: any) {
    console.error('Delete Supplier Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete supplier' }, { status: 500 });
  }
}
