'use client';

import React from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { mockAccounts } from '../../../lib/mockData';

export default function AccountsPage() {
  const columns = [
    { header: 'Account Title', accessor: 'name', sortable: true },
    { header: 'Classification Type', accessor: 'type', sortable: true },
    { header: 'Opening Balance', accessor: 'openingBalance', render: (row: any) => <span>Rs. ${row.openingBalance.toFixed(2)}</span> },
    { header: 'Current Balance', accessor: 'currentBalance', render: (row: any) => <span className="font-bold text-primary">Rs. ${row.currentBalance.toFixed(2)}</span> },
    { header: 'Status', accessor: 'status', render: (row: any) => <Badge variant={row.status === 'Active' ? 'success' : 'destructive'}>{row.status}</Badge> }
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          title="Chart of Accounts Ledger"
          data={mockAccounts}
          columns={columns}
          searchKey="name"
        />
      </PageContainer>
    </AppShell>
  );
}