import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { TransferModel, shouldSeedData } from '../../../lib/models';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const fromWarehouse = searchParams.get('fromWarehouse');
    const toWarehouse = searchParams.get('toWarehouse');

    const query: any = {};
    if (status) query.status = status;
    if (fromWarehouse) query.fromWarehouseName = fromWarehouse;
    if (toWarehouse) query.toWarehouseName = toWarehouse;

    let transfers = await TransferModel.find(query).sort({ createdAt: -1 });

    if (transfers.length === 0 && Object.keys(query).length === 0 && (await shouldSeedData())) {
      const defaultTransfers = [
        {
          transferNumber: 'TR-2026-001',
          date: '2026-03-22',
          fromWarehouseName: 'Central Godown (HQ)',
          toWarehouseName: 'Salt Lake Outlet Store',
          items: [
            {
              productId: 'prod1',
              productName: 'MacBook Pro M3 Max 16"',
              sku: 'MBP-M3-16-01',
              quantity: 8,
              unitCost: 280000,
              subtotal: 2240000
            },
            {
              productId: 'prod2',
              productName: 'Sony WH-1000XM5 Headphones',
              sku: 'SNY-WH-XM5',
              quantity: 15,
              unitCost: 21500,
              subtotal: 322500
            }
          ],
          totalQuantity: 23,
          totalCost: 2562500,
          shippingCharge: 1200,
          vehicleNumber: 'WB-02-AB-4455',
          driverName: 'Ramesh Mukherjee',
          driverPhone: '+91 98300 44556',
          trackingNumber: 'TRK-SL-9901',
          status: 'Completed',
          notes: 'Regular retail store weekly replenishment.',
          initiatedBy: 'HQ Logistics Lead',
          receivedBy: 'Arpita Sen',
          receivedDate: '2026-03-22'
        },
        {
          transferNumber: 'TR-2026-002',
          date: '2026-03-26',
          fromWarehouseName: 'Central Godown (HQ)',
          toWarehouseName: 'Howrah Buffer Depot',
          items: [
            {
              productId: 'prod3',
              productName: 'Samsung Galaxy S24 Ultra 512GB',
              sku: 'SM-S24U-512',
              quantity: 12,
              unitCost: 95000,
              subtotal: 1140000
            },
            {
              productId: 'prod4',
              productName: 'Apple iPad Pro 12.9" M2 256GB',
              sku: 'IPD-PRO-12-256',
              quantity: 10,
              unitCost: 89000,
              subtotal: 890000
            }
          ],
          totalQuantity: 22,
          totalCost: 2030000,
          shippingCharge: 1800,
          vehicleNumber: 'WB-19-DF-8812',
          driverName: 'Sanjay Yadav',
          driverPhone: '+91 98311 22998',
          trackingNumber: 'TRK-HW-3321',
          status: 'In Transit',
          notes: 'High demand buffer stock allocation for upcoming festive sale.',
          initiatedBy: 'Supply Chain Executive'
        },
        {
          transferNumber: 'TR-2026-003',
          date: '2026-03-28',
          fromWarehouseName: 'Howrah Buffer Depot',
          toWarehouseName: 'Salt Lake Outlet Store',
          items: [
            {
              productId: 'prod5',
              productName: 'Dell XPS 15 9530 Core i9',
              sku: 'DELL-XPS15-I9',
              quantity: 5,
              unitCost: 195000,
              subtotal: 975000
            }
          ],
          totalQuantity: 5,
          totalCost: 975000,
          shippingCharge: 800,
          vehicleNumber: 'WB-04-E-1190',
          driverName: 'Manoj Mondal',
          driverPhone: '+91 98322 77112',
          trackingNumber: 'TRK-INT-5501',
          status: 'Pending',
          notes: 'Inter-branch stock equalization for urgent customer backorders.',
          initiatedBy: 'Store Coordinator'
        }
      ];

      transfers = await TransferModel.insertMany(defaultTransfers);
    }

    return NextResponse.json(transfers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();

    if (!data.fromWarehouseName || !data.toWarehouseName || !data.items || data.items.length === 0) {
      return NextResponse.json({ error: 'Origin warehouse, destination warehouse, and at least 1 item are required' }, { status: 400 });
    }

    if (data.fromWarehouseName === data.toWarehouseName) {
      return NextResponse.json({ error: 'Origin and Destination warehouses cannot be identical.' }, { status: 400 });
    }

    // Auto-generate Transfer Number
    const count = await TransferModel.countDocuments();
    const currentYear = new Date().getFullYear();
    const transferNumber = data.transferNumber || `TR-${currentYear}-${String(count + 1).padStart(3, '0')}`;

    const processedItems = data.items.map((i: any) => {
      const qty = Number(i.quantity) || 1;
      const cost = Number(i.unitCost) || 0;
      return {
        productId: i.productId || `prod-${Date.now()}`,
        productName: i.productName,
        sku: i.sku || '',
        quantity: qty,
        unitCost: cost,
        subtotal: qty * cost
      };
    });

    const totalQuantity = processedItems.reduce((acc: number, i: any) => acc + i.quantity, 0);
    const totalCost = processedItems.reduce((acc: number, i: any) => acc + i.subtotal, 0);

    const newTransfer = await TransferModel.create({
      transferNumber,
      date: data.date || new Date().toISOString().split('T')[0],
      fromWarehouseId: data.fromWarehouseId || '',
      fromWarehouseName: data.fromWarehouseName,
      toWarehouseId: data.toWarehouseId || '',
      toWarehouseName: data.toWarehouseName,
      items: processedItems,
      totalQuantity,
      totalCost,
      shippingCharge: Number(data.shippingCharge) || 0,
      vehicleNumber: data.vehicleNumber || '',
      driverName: data.driverName || '',
      driverPhone: data.driverPhone || '',
      trackingNumber: data.trackingNumber || `TRK-${Math.floor(1000 + Math.random() * 9000)}`,
      status: data.status || 'In Transit',
      notes: data.notes || '',
      initiatedBy: data.initiatedBy || 'Inventory Controller'
    });

    return NextResponse.json(newTransfer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
