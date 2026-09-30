import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { ProductModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    const products = await ProductModel.find({}).sort({ category: 1, name: 1 });

    const totalProductCount = products.length;
    let totalStockQuantity = 0;
    let totalStockCostValue = 0;
    let totalStockRetailValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const categorySummary: Record<string, { count: number; quantity: number; costValue: number; retailValue: number }> = {};

    const stockItems = products.map((p) => {
      const qty = Number(p.openingStock) || 0;
      const cost = Number(p.purchasePrice) || Number(p.costPrice) || 0;
      const retail = Number(p.sellingPrice) || 0;
      const minAlert = Number(p.minStockAlert) || Number(p.minStock) || 5;

      totalStockQuantity += qty;
      totalStockCostValue += qty * cost;
      totalStockRetailValue += qty * retail;

      if (qty <= 0) {
        outOfStockCount++;
      } else if (qty <= minAlert) {
        lowStockCount++;
      }

      const cat = p.category || 'General';
      if (!categorySummary[cat]) {
        categorySummary[cat] = { count: 0, quantity: 0, costValue: 0, retailValue: 0 };
      }
      categorySummary[cat].count += 1;
      categorySummary[cat].quantity += qty;
      categorySummary[cat].costValue += qty * cost;
      categorySummary[cat].retailValue += qty * retail;

      return {
        _id: p._id,
        name: p.name,
        sku: p.sku,
        category: cat,
        brand: p.brand || 'Generic',
        unit: p.unit || 'pcs',
        quantity: qty,
        costPrice: cost,
        sellingPrice: retail,
        minStockAlert: minAlert,
        totalCostValue: qty * cost,
        totalRetailValue: qty * retail,
        potentialProfit: (qty * retail) - (qty * cost),
        stockStatus: qty <= 0 ? 'Out of Stock' : qty <= minAlert ? 'Low Stock' : 'In Stock'
      };
    });

    const potentialTotalProfit = totalStockRetailValue - totalStockCostValue;

    return NextResponse.json({
      totalProductCount,
      totalStockQuantity,
      totalStockCostValue,
      totalStockRetailValue,
      potentialTotalProfit,
      lowStockCount,
      outOfStockCount,
      inStockCount: totalProductCount - lowStockCount - outOfStockCount,
      categorySummary,
      stockItems
    });
  } catch (error: any) {
    console.error('Stock Report API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch stock report' }, { status: 500 });
  }
}
