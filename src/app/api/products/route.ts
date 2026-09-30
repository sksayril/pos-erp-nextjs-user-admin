import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { ProductModel } from '../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    let products = await ProductModel.find({}).sort({ createdAt: -1 });

    if (products.length === 0) {
      const initialProducts = [
        {
          name: 'MacBook Pro M3 Max 16"',
          sku: 'MBP-M3-16-01',
          barcode: '8901234567890',
          categoryId: 'cat-laptops',
          category: 'Computers & Laptops',
          brandId: 'brand-apple',
          brand: 'Apple',
          unitId: 'unit-pcs',
          unit: 'Pieces (pcs)',
          costPrice: 280000,
          purchasePrice: 280000,
          sellingPrice: 349900,
          taxRate: 18,
          openingStock: 24,
          minStock: 5,
          minStockAlert: 5,
          supplier: 'Apple Authorized Distributor',
          description: '16-inch Liquid Retina XDR display, 36GB Unified Memory, 1TB SSD storage',
          status: 'Active',
          image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60'
        },
        {
          name: 'Samsung Galaxy S24 Ultra 512GB',
          sku: 'SM-S24U-512',
          barcode: '8909876543211',
          categoryId: 'cat-mobiles',
          category: 'Mobile Phones',
          brandId: 'brand-samsung',
          brand: 'Samsung',
          unitId: 'unit-pcs',
          unit: 'Pieces (pcs)',
          costPrice: 95000,
          purchasePrice: 95000,
          sellingPrice: 129999,
          taxRate: 18,
          openingStock: 40,
          minStock: 8,
          minStockAlert: 8,
          supplier: 'Samsung Direct Logistics',
          description: 'Titanium Gray, 200MP Camera with Galaxy AI, S-Pen included',
          status: 'Active',
          image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=60'
        },
        {
          name: 'Sony WH-1000XM5 Wireless Headphones',
          sku: 'SNY-WH1000XM5',
          barcode: '8904561237894',
          categoryId: 'cat-audio',
          category: 'Audio & Accessories',
          brandId: 'brand-sony',
          brand: 'Sony',
          unitId: 'unit-pcs',
          unit: 'Pieces (pcs)',
          costPrice: 22000,
          purchasePrice: 22000,
          sellingPrice: 29990,
          taxRate: 18,
          openingStock: 65,
          minStock: 10,
          minStockAlert: 10,
          supplier: 'Sony Audio Importers',
          description: 'Industry-leading noise cancelling, crystal clear hands-free calling, 30hr battery',
          status: 'Active',
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60'
        },
        {
          name: 'Logitech MX Master 3S Wireless Mouse',
          sku: 'LOG-MX3S-BLK',
          barcode: '8907894561230',
          categoryId: 'cat-accessories',
          category: 'Audio & Accessories',
          brandId: 'brand-logitech',
          brand: 'Logitech',
          unitId: 'unit-pcs',
          unit: 'Pieces (pcs)',
          costPrice: 6500,
          purchasePrice: 6500,
          sellingPrice: 9495,
          taxRate: 18,
          openingStock: 80,
          minStock: 15,
          minStockAlert: 15,
          supplier: 'Logitech Trade Partner',
          description: 'Quiet Clicks, 8K DPI any-surface tracking, MagSpeed scrolling',
          status: 'Active',
          image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop&q=60'
        },
        {
          name: 'Dell UltraSharp 27" 4K USB-C Hub Monitor',
          sku: 'DEL-U2723QE',
          barcode: '8903216549870',
          categoryId: 'cat-monitors',
          category: 'Computers & Laptops',
          brandId: 'brand-dell',
          brand: 'Dell',
          unitId: 'unit-pcs',
          unit: 'Pieces (pcs)',
          costPrice: 42000,
          purchasePrice: 42000,
          sellingPrice: 56500,
          taxRate: 18,
          openingStock: 18,
          minStock: 4,
          minStockAlert: 4,
          supplier: 'Dell Commercial Hardware',
          description: 'IPS Black technology, 90W Power Delivery, RJ45 Ethernet',
          status: 'Active',
          image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60'
        }
      ];
      await ProductModel.insertMany(initialProducts);
      products = await ProductModel.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Fetch Products Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.name || !body.sku) {
      return NextResponse.json({ error: 'Product name and SKU are required' }, { status: 400 });
    }

    const existing = await ProductModel.findOne({ sku: body.sku });
    if (existing) {
      return NextResponse.json({ error: `Product with SKU "${body.sku}" already exists.` }, { status: 400 });
    }

    const newProduct = await ProductModel.create({
      ...body,
      costPrice: Number(body.costPrice) || 0,
      sellingPrice: Number(body.sellingPrice) || 0,
      openingStock: Number(body.openingStock) || 0,
      minStockAlert: Number(body.minStockAlert) || 5,
      taxRate: Number(body.taxRate) || 0,
      status: body.status || 'Active'
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error('Create Product Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ error: 'Product ID is required for update' }, { status: 400 });
    }

    const updated = await ProductModel.findByIdAndUpdate(_id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update Product Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    await ProductModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Delete Product Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete product' }, { status: 500 });
  }
}
