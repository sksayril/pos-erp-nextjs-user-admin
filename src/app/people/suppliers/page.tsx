'use client';

import React from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { mockSuppliers } from '../../../lib/mockData';

export default function SuppliersPage() {
  const columns = [
    { header: 'Name', accessor: 'name', sortable: true },
    { header: 'Phone Number', accessor: 'phone' },
    { header: 'Balance Payable', accessor: 'outstandingPayable', render: (row: any) => <span className="font-bold text-orange-500">Rs. ${row.outstandingPayable.toFixed(2)}</span> },
    { header: 'Status', accessor: 'status', render: (row: any) => <Badge variant={row.status === 'Active' ? 'success' : 'destructive'}>{row.status}</Badge> }
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          title="Suppliers Directory"
          data={mockSuppliers}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search suppliers..."
        />
      </PageContainer>
    </AppShell>
  );
}