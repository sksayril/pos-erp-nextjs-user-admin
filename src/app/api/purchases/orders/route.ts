import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { PurchaseOrderModel, PurchaseModel, ProductModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    let orders = await PurchaseOrderModel.find({}).sort({ createdAt: -1 });

    if (orders.length === 0) {
      const defaultOrders = [
        {
          orderNumber: 'PO-2026-001',
          date: '2026-03-22',
          expectedDeliveryDate: '2026-04-05',
          supplierId: 'sup-1',
          supplierName: 'Apple Authorized Distributor',
          warehouseName: 'Main Central Hub',
          items: [
            {
              productName: 'MacBook Pro M3 Max 16"',
              sku: 'MBP-M3-16-01',
              quantity: 8,
              unitCost: 280000,
              tax: 403200,
              total: 2643200
            }
          ],
          subtotal: 2240000,
          tax: 403200,
          totalAmount: 2643200,
          status: 'Confirmed',
          notes: 'Standard replenishment order. Expedited shipping requested.'
        },
        {
          orderNumber: 'PO-2026-002',
          date: '2026-03-26',
          expectedDeliveryDate: '2026-04-10',
          supplierId: 'sup-2',
          supplierName: 'Samsung Direct Logistics',
          warehouseName: 'Main Central Hub',
          items: [
            {
              productName: 'Samsung Galaxy S24 Ultra 512GB',
              sku: 'SM-S24U-512',
              quantity: 20,
              unitCost: 95000,
              tax: 342000,
              total: 2242000
            }
          ],
          subtotal: 1900000,
          tax: 342000,
          totalAmount: 2242000,
          status: 'Shipped',
          notes: 'Dispatched via Express Courier. Tracking ID: EXP-88912.'
        },
        {
          orderNumber: 'PO-2026-003',
          date: '2026-03-28',
          expectedDeliveryDate: '2026-04-15',
          supplierId: 'sup-3',
          supplierName: 'Dell Commercial Hardware',
          warehouseName: 'North Warehouse Annex',
          items: [
            {
              productName: 'Dell UltraSharp 27" 4K Monitor',
              sku: 'DEL-U2723QE',
              quantity: 12,
              unitCost: 42000,
              tax: 90720,
              total: 594720
            }
          ],
          subtotal: 504000,
          tax: 90720,
          totalAmount: 594720,
          status: 'Draft',
          notes: 'Draft awaiting final procurement department sign-off.'
        }
      ];
      await PurchaseOrderModel.insertMany(defaultOrders);
      orders = await PurchaseOrderModel.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Fetch Purchase Orders Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch purchase orders' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.orderNumber || !body.supplierName || !body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'Order number, supplier, and items are required' }, { status: 400 });
    }

    const existing = await PurchaseOrderModel.findOne({ orderNumber: body.orderNumber });
    if (existing) {
      return NextResponse.json({ error: `Order Number "${body.orderNumber}" already exists.` }, { status: 400 });
    }

    const newPO = await PurchaseOrderModel.create({
      ...body,
      subtotal: Number(body.subtotal) || 0,
      tax: Number(body.tax) || 0,
      totalAmount: Number(body.totalAmount) || 0,
      status: body.status || 'Draft'
    });

    return NextResponse.json(newPO, { status: 201 });
  } catch (error: any) {
    console.error('Create PO Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create purchase order' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ error: 'PO ID is required' }, { status: 400 });
    }

    // If status changed to Received, auto-increment product stocks and record as Purchase
    if (updateData.status === 'Received') {
      const existingPO = await PurchaseOrderModel.findById(_id);
      if (existingPO && existingPO.status !== 'Received') {
        for (const item of existingPO.items) {
          if (item.productId) {
            await ProductModel.findByIdAndUpdate(item.productId, { $inc: { openingStock: item.quantity } });
          } else if (item.sku) {
            await ProductModel.findOneAndUpdate({ sku: item.sku }, { $inc: { openingStock: item.quantity } });
          }
        }
      }
    }

    const updated = await PurchaseOrderModel.findByIdAndUpdate(_id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update PO Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update purchase order' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'PO ID is required' }, { status: 400 });
    }

    await PurchaseOrderModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Purchase order deleted successfully' });
  } catch (error: any) {
    console.error('Delete PO Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete purchase order' }, { status: 500 });
  }
}
