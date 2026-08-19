'use client';

import React from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PageContainer } from '../../components/layout/PageContainer';
import { DataTable } from '../../components/ui/DataTable';
import { mockSales } from '../../lib/mockData';

export default function QuotationsPage() {
  const columns = [
    { header: 'Reference', accessor: 'invoiceNumber', sortable: true },
    { header: 'Registered Name', accessor: 'customerName', sortable: true },
    { header: 'Date Created', accessor: 'date' },
    { header: 'Total Value (Rs.)', accessor: 'grandTotal', render: (row: any) => <span>Rs. ${row.grandTotal.toFixed(2)}</span> }
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          title="Quotations Module"
          data={mockSales}
          columns={columns}
          searchKey="customerName"
          searchPlaceholder="Search listings..."
        />
      </PageContainer>
    </AppShell>
  );
}