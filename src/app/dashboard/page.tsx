'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/layout/AppShell';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuthStore, useToastStore } from '../../lib/store';
import { 
  mockProducts, mockSales, mockPurchases, mockExpenses, 
  mockCustomers, mockSuppliers, mockQuotations 
} from '../../lib/mockData';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Package, DollarSign, 
  ArrowUpRight, ArrowDownLeft, AlertCircle, ShoppingBag, 
  CreditCard, Calendar, Users 
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'month' | 'year'>('month');

  // Hardcoded financial totals for mock presentation matching POS ERP
  const kpis = {
    revenue: 48590.20,
    salesReturn: 1250.00,
    purchaseReturn: 850.00,
    profit: 18240.50,
    totalSales: 32400.00,
    totalPurchases: 24500.00,
    totalExpenses: 5420.00,
    receivable: 5450.50,
    payable: 4250.20,
    stockValue: 124800.00
  };

  // Recharts Chart Mock Data
  const cashFlowData = [
    { name: 'Sep', Received: 12000, Sent: 8000 },
    { name: 'Oct', Received: 15000, Sent: 9500 },
    { name: 'Nov', Received: 18000, Sent: 11000 },
    { name: 'Dec', Received: 24000, Sent: 14000 },
    { name: 'Jan', Received: 21000, Sent: 13000 },
    { name: 'Feb', Received: 27000, Sent: 16500 },
    { name: 'Mar', Received: 31000, Sent: 18000 },
  ];

  const profitTrendData = [
    { name: 'Sep', Profit: 4000 },
    { name: 'Oct', Profit: 5500 },
    { name: 'Nov', Profit: 7000 },
    { name: 'Dec', Profit: 10000 },
    { name: 'Jan', Profit: 8000 },
    { name: 'Feb', Profit: 10500 },
    { name: 'Mar', Profit: 13000 },
  ];

  const pieData = [
    { name: 'Sales Revenue', value: 32400 },
    { name: 'Purchase Cost', value: 24500 },
    { name: 'Expenses', value: 5420 },
  ];

  const COLORS = ['#7c3aed', '#ea580c', '#3b82f6'];

  const lowStock = mockProducts.filter(p => p.openingStock <= p.minStock);

  const dateFilterLabels = {
    today: 'Today',
    '7days': 'Last 7 Days',
    month: 'This Month',
    year: 'This Year'
  };

  const handleFilterChange = (filter: 'today' | '7days' | 'month' | 'year') => {
    setDateFilter(filter);
    addToast('info', 'Dashboard Refreshed', `Stats loaded for: ${dateFilterLabels[filter]}`);
  };

  return (
    <AppShell>
      <PageContainer>
        
        {/* Welcome Section & Date Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between select-none">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              WELCOME <span className="text-primary font-extrabold uppercase">{user?.name || 'ADMIN'}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              ERP Control Center — Role: <span className="font-semibold text-primary">{user?.role}</span>
            </p>
          </div>
          
          <div className="flex bg-card border border-border/80 rounded-lg p-1 text-xs self-start sm:self-auto shadow-xs">
            {(['today', '7days', 'month', 'year'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  dateFilter === filter 
                    ? 'bg-primary text-primary-foreground shadow-xs' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {dateFilterLabels[filter]}
              </button>
            ))}
          </div>
        </div>

        {/* Financial KPI Cards Grid */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 select-none">
          
          {/* Revenue */}
          <Card className="hover:border-primary/30 transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Revenue</p>
                <h3 className="text-lg sm:text-2xl font-extrabold text-foreground mt-1.5">
                  Rs. {kpis.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </CardContent>
          </Card>

          {/* Sales Return */}
          <Card className="hover:border-secondary/30 transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sales Return</p>
                <h3 className="text-lg sm:text-2xl font-extrabold text-foreground mt-1.5">
                  Rs. {kpis.salesReturn.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                <ArrowDownLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </CardContent>
          </Card>

          {/* Purchase Return */}
          <Card className="hover:border-info/30 transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Purchase Return</p>
                <h3 className="text-lg sm:text-2xl font-extrabold text-foreground mt-1.5">
                  Rs. {kpis.purchaseReturn.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-info/10 flex items-center justify-center text-info">
                <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </CardContent>
          </Card>

          {/* Net Profit */}
          <Card className="hover:border-success/30 transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Net Profit</p>
                <h3 className="text-lg sm:text-2xl font-extrabold text-foreground mt-1.5">
                  Rs. {kpis.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Small KPI Mini Grid */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 select-none">
          {[
            { label: 'Sales', val: kpis.totalSales, color: 'text-primary' },
            { label: 'Purchases', val: kpis.totalPurchases, color: 'text-zinc-700' },
            { label: 'Expenses', val: kpis.totalExpenses, color: 'text-rose-500' },
            { label: 'Receivables', val: kpis.receivable, color: 'text-blue-500' },
            { label: 'Payables', val: kpis.payable, color: 'text-orange-500' },
            { label: 'Stock Value', val: kpis.stockValue, color: 'text-emerald-500' },
          ].map((item, idx) => (
            <Card key={idx} className="bg-card/40 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.label}</span>
              <span className={`text-base font-extrabold mt-1 ${item.color}`}>
                Rs. {item.val.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </Card>
          ))}
        </div>

        {/* Graphs Section: Cash Flow and Pie Breakdown */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          
          {/* Cash Flow Line Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-bold">Cash Flow Overview</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '12px' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="Received" stroke="#7c3aed" strokeWidth={2} fillOpacity={1} fill="url(#colorRec)" name="Payment Received (Purple)" />
                  <Area type="monotone" dataKey="Sent" stroke="#ea580c" strokeWidth={2} fillOpacity={1} fill="url(#colorSent)" name="Payment Sent (Orange)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Allocation Donut Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">ERP Financial Allocation</CardTitle>
            </CardHeader>
            <CardContent className="h-80 flex flex-col items-center justify-between">
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `Rs. ${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 text-xs font-semibold select-none">
                {pieData.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                    <span className="text-muted-foreground">{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Extra Charts row: Profit Trend */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {/* Monthly Profit trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Monthly Net Profit Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <Tooltip formatter={(value) => `Rs. ${value}`} contentStyle={{ borderRadius: '8px' }} />
                  <Bar dataKey="Profit" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Net Profit (Rs.)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* System Notifications/Alerts widget */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
              <CardTitle className="text-base font-bold">Stock Alerts</CardTitle>
              {lowStock.length > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {lowStock.length} Alerts
                </Badge>
              )}
            </CardHeader>
            <CardContent className="h-72 overflow-y-auto pr-2 space-y-3">
              {lowStock.map((prod) => (
                <div key={prod.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-rose-600">
                      <AlertCircle className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground leading-snug">{prod.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">SKU: {prod.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-rose-600">{prod.openingStock} left</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">Min: {prod.minStock}</p>
                  </div>
                </div>
              ))}
              {lowStock.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs">
                  All products are adequately stocked.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Widgets section */}
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
          {/* Recent Sales Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold">Recent Invoices</CardTitle>
              <Link href="/sales">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-primary">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground font-semibold">
                    <th className="py-2.5">Invoice</th>
                    <th className="py-2.5">Customer</th>
                    <th className="py-2.5">Total</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mockSales.map((sale) => (
                    <tr key={sale.id} className="border-b border-border/40 hover:bg-muted/10">
                      <td className="py-3 font-semibold text-foreground">{sale.invoiceNumber}</td>
                      <td className="py-3 text-muted-foreground">{sale.customerName}</td>
                      <td className="py-3 font-extrabold text-foreground">${sale.grandTotal.toFixed(2)}</td>
                      <td className="py-3">
                        <Badge variant={sale.paymentStatus === 'Paid' ? 'success' : 'warning'}>
                          {sale.paymentStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Top Selling Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold">Top Selling Products</CardTitle>
              <Link href="/products">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-primary">
                  View Inventory
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4 select-none">
              {[
                { name: 'Logitech MX Master 3S', sales: 142, revenue: 14198.58, percent: 80 },
                { name: 'HP LaserJet Pro M404dn', sales: 88, revenue: 21999.12, percent: 55 },
                { name: 'Coca Cola 330ml Can', sales: 410, revenue: 615.00, percent: 35 }
              ].map((prod, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{prod.name}</span>
                    <span className="text-muted-foreground">{prod.sales} sold (${prod.revenue.toLocaleString()})</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${prod.percent}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </PageContainer>
    </AppShell>
  );
}
