'use client';

import React from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { DataTable } from '../../../components/ui/DataTable';
import { mockSales } from '../../../lib/mockData';

export default function ProductsReportPage() {
  const columns = [
    { header: 'Reference', accessor: 'invoiceNumber', sortable: true },
    { header: 'Party / Client', accessor: 'customerName', sortable: true },
    { header: 'Transaction Date', accessor: 'date' },
    { header: 'Amount (Rs.)', accessor: 'grandTotal', render: (row: any) => <span className="font-bold">Rs. ${row.grandTotal.toFixed(2)}</span> }
  ];

  return (
    <AppShell>
      <PageContainer>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
          <Card className="p-4 bg-primary/5 border-primary/20">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Report Summary Total</span>
            <h3 className="text-xl font-extrabold text-primary mt-1">Rs. 45,230.12</h3>
          </Card>
          <Card className="p-4 bg-success/5 border-success/20">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Paid Volume</span>
            <h3 className="text-xl font-extrabold text-success mt-1">Rs. 43,980.12</h3>
          </Card>
          <Card className="p-4 bg-orange/5 border-orange/20">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Due Balance</span>
            <h3 className="text-xl font-extrabold text-orange-500 mt-1">Rs. 1,250.00</h3>
          </Card>
        </div>
        <DataTable
          title="Products Audit Trail"
          data={mockSales}
          columns={columns}
          searchKey="customerName"
          searchPlaceholder="Search audit trails..."
        />
      </PageContainer>
    </AppShell>
  );
}