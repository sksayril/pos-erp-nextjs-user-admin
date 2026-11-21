'use client';

import React, { useState, useEffect } from 'react';
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
  ShoppingCart, CreditCard, Calendar, Users 
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'month' | 'year'>('month');
  const [liveSales, setLiveSales] = useState<any[]>([]);
  const [livePurchases, setLivePurchases] = useState<any[]>([]);
  const [liveExpenses, setLiveExpenses] = useState<any[]>([]);
  const [liveProducts, setLiveProducts] = useState<any[]>([]);
  const [dummyDataCleared, setDummyDataCleared] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/system/clear-dummy-data').then(r => r.json()).catch(() => ({})),
      fetch('/api/sales').then(r => r.json()).catch(() => []),
      fetch('/api/purchases').then(r => r.json()).catch(() => []),
      fetch('/api/expenses').then(r => r.json()).catch(() => []),
      fetch('/api/products').then(r => r.json()).catch(() => [])
    ]).then(([sys, sales, purchases, expenses, products]) => {
      if (sys?.dummyDataCleared) {
        setDummyDataCleared(true);
      }
      if (Array.isArray(sales)) setLiveSales(sales);
      if (Array.isArray(purchases)) setLivePurchases(purchases);
      if (Array.isArray(expenses)) setLiveExpenses(expenses);
      if (Array.isArray(products)) setLiveProducts(products);
    });
  }, []);

  const totalSalesVal = liveSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const revenueVal = liveSales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const receivableVal = liveSales.reduce((sum, s) => sum + (s.dueAmount || 0), 0);
  const purchasesVal = livePurchases.reduce((sum, p) => sum + (p.grandTotal || 0), 0);
  const expensesVal = liveExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const stockVal = liveProducts.reduce((sum, pr) => sum + ((pr.costPrice || pr.purchasePrice || 0) * (pr.openingStock || 0)), 0);

  // Financial totals: live calculation when dummy data is cleared, else presentation mock
  const kpis = dummyDataCleared ? {
    revenue: revenueVal,
    salesReturn: 0,
    purchaseReturn: 0,
    profit: revenueVal - purchasesVal - expensesVal,
    totalSales: totalSalesVal,
    totalPurchases: purchasesVal,
    totalExpenses: expensesVal,
    receivable: receivableVal,
    payable: 0,
    stockValue: stockVal
  } : {
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

  const lowStock = dummyDataCleared 
    ? liveProducts.filter(p => (p.openingStock || 0) <= (p.minStock || 5))
    : mockProducts.filter(p => p.openingStock <= p.minStock);

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
              WELCOME <span className="text-primary font-extrabold uppercase" suppressHydrationWarning>{user?.name || 'ADMIN'}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              ERP Control Center — Role: <span className="font-semibold text-primary" suppressHydrationWarning>{user?.role || 'Super Admin'}</span>
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
          <Card className="hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl bg-card border border-border/80 shadow-xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Revenue</p>
                <h3 className="text-lg sm:text-2xl font-black text-foreground mt-1.5 tracking-tight">
                  Rs. {kpis.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </CardContent>
          </Card>

          {/* Sales Return */}
          <Card className="hover:border-sky-500/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl bg-card border border-border/80 shadow-xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sales Return</p>
                <h3 className="text-lg sm:text-2xl font-black text-foreground mt-1.5 tracking-tight">
                  Rs. {kpis.salesReturn.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 shadow-xs shrink-0">
                <ArrowDownLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </CardContent>
          </Card>

          {/* Purchase Return */}
          <Card className="hover:border-indigo-500/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl bg-card border border-border/80 shadow-xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Purchase Return</p>
                <h3 className="text-lg sm:text-2xl font-black text-foreground mt-1.5 tracking-tight">
                  Rs. {kpis.purchaseReturn.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 shadow-xs shrink-0">
                <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </CardContent>
          </Card>

          {/* Net Profit */}
          <Card className="hover:border-emerald-500/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl bg-card border border-border/80 shadow-xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Net Profit</p>
                <h3 className="text-lg sm:text-2xl font-black text-foreground mt-1.5 tracking-tight">
                  Rs. {kpis.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Small KPI Mini Grid */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 select-none">
          {[
            { label: 'Sales', val: kpis.totalSales, color: 'text-primary', badgeBg: 'bg-primary/10 text-primary border-primary/20', icon: ShoppingBag },
            { label: 'Purchases', val: kpis.totalPurchases, color: 'text-indigo-600', badgeBg: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', icon: ShoppingCart },
            { label: 'Expenses', val: kpis.totalExpenses, color: 'text-rose-600', badgeBg: 'bg-rose-500/10 text-rose-600 border-rose-500/20', icon: CreditCard },
            { label: 'Receivables', val: kpis.receivable, color: 'text-blue-600', badgeBg: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: ArrowDownLeft },
            { label: 'Payables', val: kpis.payable, color: 'text-amber-600', badgeBg: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: ArrowUpRight },
            { label: 'Stock Value', val: kpis.stockValue, color: 'text-emerald-600', badgeBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: Package },
          ].map((item, idx) => (
            <Card key={idx} className="bg-card border border-border/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</span>
                <div className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 ${item.badgeBg}`}>
                  <item.icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-3">
                <span className={`text-base sm:text-lg font-black tracking-tight ${item.color}`}>
                  Rs. {item.val.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </Card>
          ))}
        </div>

        {/* Graphs Section: Cash Flow and Pie Breakdown */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          
          {/* Cash Flow Line Chart */}
          <Card className="lg:col-span-2 rounded-2xl border border-border/80 shadow-xs">
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
          <Card className="rounded-2xl border border-border/80 shadow-xs">
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
          <Card className="rounded-2xl border border-border/80 shadow-xs">
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
          <Card className="rounded-2xl border border-border/80 shadow-xs">
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
          <Card className="rounded-2xl border border-border/80 shadow-xs">
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
          <Card className="rounded-2xl border border-border/80 shadow-xs">
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
