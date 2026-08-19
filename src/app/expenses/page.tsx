'use client';

import React from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PageContainer } from '../../components/layout/PageContainer';
import { DataTable } from '../../components/ui/DataTable';
import { mockExpenses } from '../../lib/mockData';

export default function ExpensesListPage() {
  const columns = [
    { header: 'Expense Category', accessor: 'category', sortable: true },
    { header: 'Paid Amount', accessor: 'amount', sortable: true, render: (row: any) => <span className="font-bold text-rose-500">Rs. ${row.amount.toFixed(2)}</span> },
    { header: 'Billing Date', accessor: 'date' },
    { header: 'Payment Method', accessor: 'paymentMethod' },
    { header: 'Description', accessor: 'description' }
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          title="Operating Expenses Ledger"
          data={mockExpenses}
          columns={columns}
          searchKey="category"
        />
      </PageContainer>
    </AppShell>
  );
}