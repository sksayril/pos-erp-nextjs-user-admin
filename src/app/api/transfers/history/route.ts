import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { TransferModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    const transfers = await TransferModel.find({}).sort({ createdAt: -1 });

    const totalTransfers = transfers.length;
    const totalTransferredCost = transfers.reduce((acc, t) => acc + (Number(t.totalCost) || 0), 0);
    const totalUnitsMoved = transfers.reduce((acc, t) => acc + (Number(t.totalQuantity) || 0), 0);
    const completedCount = transfers.filter(t => t.status === 'Completed').length;
    const inTransitCount = transfers.filter(t => t.status === 'In Transit').length;
    const pendingCount = transfers.filter(t => t.status === 'Pending').length;

    // Route breakdown (e.g. "HQ -> Salt Lake")
    const routeBreakdown: Record<string, { count: number; totalCost: number; totalUnits: number }> = {};
    transfers.forEach(t => {
      const routeKey = `${t.fromWarehouseName} ➔ ${t.toWarehouseName}`;
      if (!routeBreakdown[routeKey]) {
        routeBreakdown[routeKey] = { count: 0, totalCost: 0, totalUnits: 0 };
      }
      routeBreakdown[routeKey].count += 1;
      routeBreakdown[routeKey].totalCost += Number(t.totalCost) || 0;
      routeBreakdown[routeKey].totalUnits += Number(t.totalQuantity) || 0;
    });

    return NextResponse.json({
      totalTransfers,
      totalTransferredCost,
      totalUnitsMoved,
      completedCount,
      inTransitCount,
      pendingCount,
      routeBreakdown,
      history: transfers
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
