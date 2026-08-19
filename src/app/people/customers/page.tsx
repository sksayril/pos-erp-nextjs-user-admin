'use client';

import React from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { mockCustomers } from '../../../lib/mockData';
import { useRouter } from 'next/navigation';

export default function CustomersPage() {
  const router = useRouter();

  const columns = [
    { header: 'Name', accessor: 'name', sortable: true },
    { header: 'Phone Number', accessor: 'phone' },
    { header: 'Credit Limit', accessor: 'creditLimit', render: (row: any) => <span>Rs. ${row.creditLimit.toFixed(2)}</span> },
    { header: 'Balance Receivable', accessor: 'outstandingBalance', render: (row: any) => <span className="font-bold text-red-500">Rs. ${row.outstandingBalance.toFixed(2)}</span> },
    { header: 'Status', accessor: 'status', render: (row: any) => <Badge variant={row.status === 'Active' ? 'success' : 'destructive'}>{row.status}</Badge> }
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          title="Customers Registry"
          data={mockCustomers}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search customers by name..."
        />
      </PageContainer>
    </AppShell>
  );
}