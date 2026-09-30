import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { QuotationModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    const quotations = await QuotationModel.find({}).sort({ createdAt: -1 });

    const totalQuotedValue = quotations.reduce((acc, q) => acc + (Number(q.grandTotal) || 0), 0);
    const convertedValue = quotations.filter(q => q.status === 'Converted').reduce((acc, q) => acc + (Number(q.grandTotal) || 0), 0);
    const acceptedValue = quotations.filter(q => q.status === 'Accepted' || q.status === 'Converted').reduce((acc, q) => acc + (Number(q.grandTotal) || 0), 0);
    const totalCount = quotations.length;
    const convertedCount = quotations.filter(q => q.status === 'Converted').length;
    const conversionRate = totalCount > 0 ? Math.round((convertedCount / totalCount) * 100) : 0;

    const statusCounts = {
      Draft: quotations.filter(q => q.status === 'Draft').length,
      Sent: quotations.filter(q => q.status === 'Sent').length,
      Accepted: quotations.filter(q => q.status === 'Accepted').length,
      Declined: quotations.filter(q => q.status === 'Declined').length,
      Converted: convertedCount
    };

    return NextResponse.json({
      totalQuotedValue,
      convertedValue,
      acceptedValue,
      totalCount,
      convertedCount,
      conversionRate,
      statusCounts,
      history: quotations
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
