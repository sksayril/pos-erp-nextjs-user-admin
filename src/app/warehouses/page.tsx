'use client';

import React from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PageContainer } from '../../components/layout/PageContainer';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { mockWarehouses } from '../../lib/mockData';

export default function WarehousesPage() {
  const columns = [
    { header: 'Warehouse Name', accessor: 'name', sortable: true },
    { header: 'Branch Code', accessor: 'code', sortable: true },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Email Address', accessor: 'email' },
    { header: 'Status', accessor: 'status', render: (row: any) => <Badge variant={row.status === 'Active' ? 'success' : 'destructive'}>{row.status}</Badge> }
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          title="Warehouse Storage Sites"
          data={mockWarehouses}
          columns={columns}
          searchKey="name"
        />
      </PageContainer>
    </AppShell>
  );
}