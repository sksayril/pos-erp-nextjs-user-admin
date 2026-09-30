import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { SaleModel, PurchaseModel } from '../../../../lib/models';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let dateQuery: any = {};
    if (startDate && endDate) {
      dateQuery.date = { $gte: startDate, $lte: endDate };
    }

    const [sales, purchases] = await Promise.all([
      SaleModel.find(dateQuery).sort({ date: -1 }),
      PurchaseModel.find(dateQuery).sort({ date: -1 })
    ]);

    // Output Tax Collected (from Sales)
    const totalSalesTax = sales.reduce((acc, s) => acc + (Number(s.tax) || 0), 0);
    const totalTaxableSales = sales.reduce((acc, s) => acc + (Number(s.subtotal) || Number(s.grandTotal) || 0), 0);

    // Input Tax Credit (from Purchases)
    const totalPurchaseTax = purchases.reduce((acc, p) => acc + (Number(p.tax) || 0), 0);
    const totalTaxablePurchases = purchases.reduce((acc, p) => acc + (Number(p.subtotal) || Number(p.grandTotal) || 0), 0);

    // Net GST / Tax Payable
    const netTaxPayable = totalSalesTax - totalPurchaseTax;

    // Tax rate buckets from sales items
    const taxBuckets: Record<string, { taxableAmount: number; taxAmount: number }> = {
      'GST 0% / Exempt': { taxableAmount: 0, taxAmount: 0 },
      'GST 5%': { taxableAmount: 0, taxAmount: 0 },
      'GST 12%': { taxableAmount: 0, taxAmount: 0 },
      'GST 18%': { taxableAmount: 0, taxAmount: 0 },
      'GST 28%': { taxableAmount: 0, taxAmount: 0 }
    };

    sales.forEach(s => {
      const items = Array.isArray(s.items) ? s.items : [];
      if (items.length > 0) {
        items.forEach((item: any) => {
          const itemTax = Number(item.tax) || 0;
          const itemTotal = Number(item.total) || 0;
          if (itemTax === 0) {
            taxBuckets['GST 0% / Exempt'].taxableAmount += itemTotal;
          } else {
            const approximateRate = itemTotal > 0 ? (itemTax / (itemTotal - itemTax)) * 100 : 18;
            if (approximateRate <= 7) {
              taxBuckets['GST 5%'].taxableAmount += (itemTotal - itemTax);
              taxBuckets['GST 5%'].taxAmount += itemTax;
            } else if (approximateRate <= 15) {
              taxBuckets['GST 12%'].taxableAmount += (itemTotal - itemTax);
              taxBuckets['GST 12%'].taxAmount += itemTax;
            } else if (approximateRate <= 22) {
              taxBuckets['GST 18%'].taxableAmount += (itemTotal - itemTax);
              taxBuckets['GST 18%'].taxAmount += itemTax;
            } else {
              taxBuckets['GST 28%'].taxableAmount += (itemTotal - itemTax);
              taxBuckets['GST 28%'].taxAmount += itemTax;
            }
          }
        });
      } else {
        taxBuckets['GST 18%'].taxableAmount += (Number(s.subtotal) || Number(s.grandTotal) || 0);
        taxBuckets['GST 18%'].taxAmount += Number(s.tax) || 0;
      }
    });

    const taxAuditRegister = [
      ...sales.map(s => ({
        type: 'Sales (Output GST)',
        refNo: s.invoiceNumber,
        date: s.date,
        party: s.customerName,
        taxableAmount: Number(s.subtotal) || Number(s.grandTotal) || 0,
        taxAmount: Number(s.tax) || 0,
        totalAmount: Number(s.grandTotal) || 0
      })),
      ...purchases.map(p => ({
        type: 'Purchase (Input ITC)',
        refNo: p.purchaseNumber,
        date: p.date,
        party: p.supplierName,
        taxableAmount: Number(p.subtotal) || Number(p.grandTotal) || 0,
        taxAmount: Number(p.tax) || 0,
        totalAmount: Number(p.grandTotal) || 0
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      totalSalesTax,
      totalTaxableSales,
      totalPurchaseTax,
      totalTaxablePurchases,
      netTaxPayable,
      taxBuckets,
      taxAuditRegister
    });
  } catch (error: any) {
    console.error('Tax Report API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch tax report' }, { status: 500 });
  }
}
