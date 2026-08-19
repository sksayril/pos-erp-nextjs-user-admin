import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { WarehouseStockModel, ProductModel, WarehouseModel } from '../../../../lib/models';

export async function GET(req: Request) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const warehouseId = url.searchParams.get('warehouseId');

    let stocks = [];
    if (warehouseId) {
      stocks = await WarehouseStockModel.find({ warehouseId }).sort({ quantity: -1 });
    } else {
      stocks = await WarehouseStockModel.find({}).sort({ updatedAt: -1 });
    }

    if (stocks.length === 0) {
      // Bootstrap the Godown inventory by distributing products
      const products = await ProductModel.find({});
      const warehouses = await WarehouseModel.find({});

      if (products.length > 0 && warehouses.length > 0) {
        const seedStocks = [];
        for (const wh of warehouses) {
          for (const prod of products) {
            seedStocks.push({
              warehouseId: wh.code,
              productId: prod._id.toString(),
              productName: prod.name,
              sku: prod.sku,
              // Distribute varying quantities
              quantity: Math.floor(10 + Math.random() * 90)
            });
          }
        }
        await WarehouseStockModel.insertMany(seedStocks);
        stocks = warehouseId 
          ? await WarehouseStockModel.find({ warehouseId }).sort({ quantity: -1 })
          : await WarehouseStockModel.find({}).sort({ updatedAt: -1 });
      }
    }

    return NextResponse.json(stocks);
  } catch (error: any) {
    console.error('Fetch Warehouse Stock Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch warehouse stock' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const { warehouseId, productId, quantityChange } = await req.json();

    const product = await ProductModel.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    let stockItem = await WarehouseStockModel.findOne({ warehouseId, productId });
    if (!stockItem) {
      stockItem = await WarehouseStockModel.create({
        warehouseId,
        productId,
        productName: product.name,
        sku: product.sku,
        quantity: Math.max(0, quantityChange)
      });
    } else {
      stockItem.quantity = Math.max(0, stockItem.quantity + quantityChange);
      await stockItem.save();
    }

    return NextResponse.json(stockItem);
  } catch (error: any) {
    console.error('Update Stock Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update warehouse stock' }, { status: 500 });
  }
}
