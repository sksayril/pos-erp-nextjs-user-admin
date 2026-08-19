'use client';

import React from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export default function DocumentationPage() {
  return (
    <AppShell>
      <PageContainer>
        <Card className="max-w-3xl mx-auto shadow-md">
          <CardHeader>
            <CardTitle>POS ERP Documentation Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 select-none">
            <h3 className="font-bold text-foreground text-base">Getting Started</h3>
            <p>
              Welcome to the POS ERP frontend application! This system manages your point of sale registers,
              product catalog inventories, supplier orders, cash ledgers, accounting journals, and employee HRM attendances.
            </p>
            <h4 className="font-bold text-foreground text-sm mt-3">Simulation Capabilities</h4>
            <p>
              Use the top-right cashier avatar icon dropdown menu to switch roles. Different options let you view
              how screens present based on cashier vs super admin permissions.
            </p>
            <h4 className="font-bold text-foreground text-sm mt-3">POS Workflows</h4>
            <p>
              Head over to <strong>POS Billing</strong>. Add products, configure discount rates, scan simulated barcodes
              using the top panel scanner input, and trigger checkout modals.
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    </AppShell>
  );
}