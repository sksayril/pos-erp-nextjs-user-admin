import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { ProductModel, SaleModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    const [products, sales] = await Promise.all([
      ProductModel.find({}).sort({ name: 1 }),
      SaleModel.find({})
    ]);

    // Aggregate product sales from sales items
    const productStats: Record<string, {
      name: string;
      sku: string;
      category: string;
      unitsSold: number;
      revenue: number;
      currentStock: number;
      costPrice: number;
      sellingPrice: number;
      totalCost: number;
      totalProfit: number;
    }> = {};

    products.forEach(p => {
      productStats[p._id.toString()] = {
        name: p.name,
        sku: p.sku,
        category: p.category || 'General',
        unitsSold: 0,
        revenue: 0,
        currentStock: Number(p.openingStock) || 0,
        costPrice: Number(p.purchasePrice) || Number(p.costPrice) || 0,
        sellingPrice: Number(p.sellingPrice) || 0,
        totalCost: 0,
        totalProfit: 0
      };
    });

    sales.forEach(s => {
      const items = Array.isArray(s.items) ? s.items : [];
      items.forEach((item: any) => {
        const pId = item.productId;
        const qty = Number(item.quantity) || 0;
        const total = Number(item.total) || ((Number(item.price) || 0) * qty);

        if (productStats[pId]) {
          productStats[pId].unitsSold += qty;
          productStats[pId].revenue += total;
          productStats[pId].totalCost += (productStats[pId].costPrice * qty);
          productStats[pId].totalProfit += (total - (productStats[pId].costPrice * qty));
        } else {
          // If product removed or custom item
          const name = item.productName || item.name || 'Unlisted Item';
          if (!productStats[name]) {
            productStats[name] = {
              name,
              sku: item.sku || 'N/A',
              category: 'General',
              unitsSold: 0,
              revenue: 0,
              currentStock: 0,
              costPrice: 0,
              sellingPrice: Number(item.price) || 0,
              totalCost: 0,
              totalProfit: 0
            };
          }
          productStats[name].unitsSold += qty;
          productStats[name].revenue += total;
        }
      });
    });

    const performanceList = Object.values(productStats).map(p => ({
      ...p,
      marginPercent: p.revenue > 0 ? ((p.totalProfit / p.revenue) * 100) : 0,
      velocity: p.unitsSold > 20 ? 'Fast Mover' : p.unitsSold > 5 ? 'Steady Mover' : 'Slow Mover'
    }));

    // Top Selling by Revenue
    const topRevenue = [...performanceList].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    // Top Selling by Units
    const topUnits = [...performanceList].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 10);
    // Slow Moving / Dead Stock (0 units sold)
    const deadStock = performanceList.filter(p => p.unitsSold === 0 && p.currentStock > 0);

    const totalSoldUnits = performanceList.reduce((acc, p) => acc + p.unitsSold, 0);
    const totalProductRevenue = performanceList.reduce((acc, p) => acc + p.revenue, 0);
    const totalProductProfit = performanceList.reduce((acc, p) => acc + p.totalProfit, 0);

    return NextResponse.json({
      totalSoldUnits,
      totalProductRevenue,
      totalProductProfit,
      topRevenue,
      topUnits,
      deadStockCount: deadStock.length,
      performanceList
    });
  } catch (error: any) {
    console.error('Product Performance API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch product performance report' }, { status: 500 });
  }
}
