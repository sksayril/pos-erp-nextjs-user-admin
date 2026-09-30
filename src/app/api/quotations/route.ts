import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { QuotationModel } from '../../../lib/models';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const query: any = {};
    if (status) query.status = status;

    let quotations = await QuotationModel.find(query).sort({ createdAt: -1 });

    if (quotations.length === 0 && Object.keys(query).length === 0) {
      const defaultQuotations = [
        {
          quotationNumber: 'QT-2026-001',
          date: '2026-03-20',
          validUntil: '2026-04-20',
          customerName: 'Reliance Digital Retail Ltd',
          customerPhone: '+91 98201 55432',
          customerEmail: 'procurement@reliancedigital.in',
          customerAddress: 'Bandra Kurla Complex, Mumbai, MH',
          warehouseName: 'Central Hub Warehouse',
          items: [
            {
              productId: 'prod1',
              productName: 'MacBook Pro M3 Max 16"',
              sku: 'MBP-M3-16-01',
              quantity: 5,
              unitPrice: 349900,
              discount: 50000,
              tax: 305910,
              total: 2005410
            },
            {
              productId: 'prod2',
              productName: 'Sony WH-1000XM5 Headphones',
              sku: 'SNY-WH-XM5',
              quantity: 10,
              unitPrice: 29990,
              discount: 10000,
              tax: 52182,
              total: 342082
            }
          ],
          subtotal: 2049400,
          discount: 60000,
          orderTax: 358092,
          shipping: 0,
          grandTotal: 2347492,
          status: 'Accepted',
          terms: 'Payment 50% advance upon PO, 50% upon delivery dispatch. 30 days price lock guarantee.',
          notes: 'Corporate bulk inquiry for Q1 engineering team rollout.',
          preparedBy: 'Senior Key Account Manager'
        },
        {
          quotationNumber: 'QT-2026-002',
          date: '2026-03-24',
          validUntil: '2026-04-10',
          customerName: 'Infosys Tech Hub',
          customerPhone: '+91 98450 11984',
          customerEmail: 'hardware.procure@infosys.com',
          customerAddress: 'Electronic City Phase 1, Bengaluru, KA',
          warehouseName: 'Central Hub Warehouse',
          items: [
            {
              productId: 'prod3',
              productName: 'Samsung Galaxy S24 Ultra 512GB',
              sku: 'SM-S24U-512',
              quantity: 8,
              unitPrice: 129999,
              discount: 24000,
              tax: 182878,
              total: 1198870
            }
          ],
          subtotal: 1039992,
          discount: 24000,
          orderTax: 182878,
          shipping: 1500,
          grandTotal: 1200370,
          status: 'Sent',
          terms: 'Standard net 30 credit term with GST invoice claiming input tax credit.',
          notes: 'Awaiting client technical committee purchase order signoff.',
          preparedBy: 'Enterprise Sales Executive'
        },
        {
          quotationNumber: 'QT-2026-003',
          date: '2026-03-27',
          validUntil: '2026-04-15',
          customerName: 'Tata Consultancy Services Corp',
          customerPhone: '+91 98112 77654',
          customerEmail: 'infra.buy@tcs.com',
          customerAddress: 'Nirlon Knowledge Park, Goregaon East, Mumbai, MH',
          warehouseName: 'East Distribution Center',
          items: [
            {
              productId: 'prod4',
              productName: 'Apple iPad Pro 12.9" M2 256GB',
              sku: 'IPD-PRO-12-256',
              quantity: 12,
              unitPrice: 112900,
              discount: 30000,
              tax: 238464,
              total: 1563264
            }
          ],
          subtotal: 1354800,
          discount: 30000,
          orderTax: 238464,
          shipping: 0,
          grandTotal: 1563264,
          status: 'Draft',
          terms: 'Valid for 15 days from quote generation. Free courier delivery included.',
          notes: 'Special educational and enterprise discount applied.',
          preparedBy: 'Sales Director'
        }
      ];

      quotations = await QuotationModel.insertMany(defaultQuotations);
    }

    return NextResponse.json(quotations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();

    if (!data.customerName || !data.items || data.items.length === 0) {
      return NextResponse.json({ error: 'Customer name and at least one item are required' }, { status: 400 });
    }

    // Auto-generate Quotation Number
    const count = await QuotationModel.countDocuments();
    const currentYear = new Date().getFullYear();
    const quotationNumber = data.quotationNumber || `QT-${currentYear}-${String(count + 1).padStart(3, '0')}`;

    // Calculate totals
    const processedItems = data.items.map((item: any) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const disc = Number(item.discount) || 0;
      const base = (qty * price) - disc;
      const tax = Number(item.tax) || (base * 0.18);
      const total = base + tax;
      return {
        productId: item.productId || `prod-${Date.now()}`,
        productName: item.productName || 'Product',
        sku: item.sku || '',
        quantity: qty,
        unitPrice: price,
        discount: disc,
        tax,
        total
      };
    });

    const subtotal = processedItems.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
    const itemDiscount = processedItems.reduce((acc: number, item: any) => acc + item.discount, 0);
    const totalTax = processedItems.reduce((acc: number, item: any) => acc + item.tax, 0);
    const shipping = Number(data.shipping) || 0;
    const additionalDiscount = Number(data.discount) || 0;
    const grandTotal = subtotal - itemDiscount - additionalDiscount + totalTax + shipping;

    const newQuotation = await QuotationModel.create({
      quotationNumber,
      date: data.date || new Date().toISOString().split('T')[0],
      validUntil: data.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customerId: data.customerId || '',
      customerName: data.customerName,
      customerPhone: data.customerPhone || '',
      customerEmail: data.customerEmail || '',
      customerAddress: data.customerAddress || '',
      warehouseName: data.warehouseName || 'Central Hub Warehouse',
      items: processedItems,
      subtotal,
      orderTax: totalTax,
      discount: itemDiscount + additionalDiscount,
      shipping,
      grandTotal,
      status: data.status || 'Sent',
      terms: data.terms || 'Quotation valid for 30 days. Prices are subject to availability.',
      notes: data.notes || '',
      preparedBy: data.preparedBy || 'Sales Executive'
    });

    return NextResponse.json(newQuotation, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
