import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import { QuotationModel, SaleModel } from '../../../../../lib/models';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const quote = await QuotationModel.findById(id);

    if (!quote) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    if (quote.status === 'Converted') {
      return NextResponse.json({ error: 'Quotation has already been converted to a sales order' }, { status: 400 });
    }

    // Generate Invoice Number
    const count = await SaleModel.countDocuments();
    const currentYear = new Date().getFullYear();
    const invoiceNumber = `INV-${currentYear}-${String(count + 1).padStart(4, '0')}`;

    // Create Sale record
    const newSale = await SaleModel.create({
      invoiceNumber,
      date: new Date().toISOString().split('T')[0],
      customerName: quote.customerName,
      customerPhone: quote.customerPhone || '',
      customerEmail: quote.customerEmail || '',
      customerAddress: quote.customerAddress || '',
      warehouseName: quote.warehouseName || 'Central Hub Warehouse',
      items: quote.items.map((i: any) => ({
        productId: i.productId,
        productName: i.productName,
        sku: i.sku || '',
        quantity: i.quantity,
        price: i.unitPrice,
        discount: i.discount,
        tax: i.tax,
        total: i.total
      })),
      subtotal: quote.subtotal,
      discount: quote.discount,
      tax: quote.orderTax,
      grandTotal: quote.grandTotal,
      paidAmount: 0,
      dueAmount: quote.grandTotal,
      paymentStatus: 'Unpaid',
      status: 'Completed',
      notes: `Converted from Quotation ${quote.quotationNumber}. ${quote.notes || ''}`
    });

    // Mark quote as Converted
    quote.status = 'Converted';
    quote.convertedToSaleId = newSale._id;
    await quote.save();

    return NextResponse.json({
      message: `Quotation ${quote.quotationNumber} successfully converted to Sale Invoice ${invoiceNumber}!`,
      sale: newSale
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
