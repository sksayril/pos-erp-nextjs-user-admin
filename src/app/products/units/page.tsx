'use client';

import React from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { mockUnits } from '../../../lib/mockData';

export default function UnitsPage() {
  const columns = [
    { header: 'Unit Name', accessor: 'name', sortable: true },
    { header: 'Symbol / Short Name', accessor: 'shortName', sortable: true },
    { header: 'Base Equivalent', accessor: 'baseUnit', render: (row: any) => <span>{row.baseUnit || 'Base Unit'}</span> },
    { header: 'Multiplier Operator', accessor: 'operator', render: (row: any) => <span>{row.operator || '1'}</span> },
    { header: 'Ratio Value', accessor: 'operationValue', render: (row: any) => <span>{row.operationValue || '1'}</span> }
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          title="Inventory Units of Measure"
          data={mockUnits}
          columns={columns}
          searchKey="name"
        />
      </PageContainer>
    </AppShell>
  );
}