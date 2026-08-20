import { 
  LayoutDashboard, ShoppingCart, Package, ShoppingBag, 
  CreditCard, FileText, ArrowLeftRight, Settings, Users, 
  BarChart3, FileQuestion, UsersRound, CalendarDays, Wallet, ShieldCheck, Truck
} from 'lucide-react';
import React from 'react';

export interface NavSubItem {
  name: string;
  href: string;
  permission?: string;
}

export interface NavItem {
  name: string;
  href?: string; // If it's a leaf node
  icon: any; // Lucide icon
  permission?: string;
  subItems?: NavSubItem[];
}

export const navigationConfig: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'POS',
    href: '/pos',
    icon: ShoppingCart,
  },
  {
    name: 'Product',
    icon: Package,
    subItems: [
      { name: 'Products List', href: '/products' },
      { name: 'Create Product', href: '/products/create' },
      { name: 'Categories', href: '/products/categories' },
      { name: 'Brands', href: '/products/brands' },
      { name: 'Units', href: '/products/units' },
      { name: 'Variants', href: '/products/variants' },
      { name: 'Price Lists', href: '/products/prices' },
      { name: 'Barcode Generator', href: '/products/barcode' },
      { name: 'Batches', href: '/products/batches' },
      { name: 'Stock Inventory', href: '/products/stock' },
      { name: 'Stock Adjustment', href: '/products/adjustment' },
    ]
  },
  {
    name: 'Purchase',
    icon: ShoppingBag,
    subItems: [
      { name: 'Purchases List', href: '/purchases' },
      { name: 'Create Purchase', href: '/purchases/create' },
      { name: 'Purchase Orders', href: '/purchases/orders' },
      { name: 'Purchase Payments', href: '/purchases/payments' },
      { name: 'Purchase History', href: '/purchases/history' },
    ]
  },
  {
    name: 'Sale',
    icon: CreditCard,
    subItems: [
      { name: 'Sales List', href: '/sales' },
      { name: 'Create Sale', href: '/sales/create' },
      { name: 'Invoices', href: '/sales/invoices' },
      { name: 'E-Waybills', href: '/sales/waybill' },
      { name: 'Delivery Challans', href: '/sales/delivery' },
      { name: 'Sales Payments', href: '/sales/payments' },
      { name: 'Sales History', href: '/sales/history' },
    ]
  },
  {
    name: 'E-Waybill',
    href: '/sales/waybill',
    icon: Truck,
  },
  {
    name: 'Expense',
    icon: Wallet,
    subItems: [
      { name: 'Expenses List', href: '/expenses' },
      { name: 'Create Expense', href: '/expenses/create' },
      { name: 'Categories', href: '/expenses/categories' },
      { name: 'Expense History', href: '/expenses/history' },
    ]
  },
  {
    name: 'Quotation',
    icon: FileText,
    subItems: [
      { name: 'Quotations List', href: '/quotations' },
      { name: 'Create Quotation', href: '/quotations/create' },
      { name: 'Quotation History', href: '/quotations/history' },
    ]
  },
  {
    name: 'Transfer',
    icon: ArrowLeftRight,
    subItems: [
      { name: 'Transfers List', href: '/transfers' },
      { name: 'Create Transfer', href: '/transfers/create' },
      { name: 'Transfer History', href: '/transfers/history' },
      { name: 'Warehouses', href: '/warehouses' },
    ]
  },
  {
    name: 'Return',
    icon: ArrowLeftRight,
    subItems: [
      { name: 'Sales Return', href: '/returns/sales' },
      { name: 'Purchase Return', href: '/returns/purchases' },
      { name: 'Credit Notes', href: '/returns/credit-notes' },
      { name: 'Debit Notes', href: '/returns/debit-notes' },
      { name: 'Return History', href: '/returns/history' },
    ]
  },
  {
    name: 'Accounting',
    icon: Wallet,
    subItems: [
      { name: 'Accounts List', href: '/accounting/accounts' },
      { name: 'Cash Journal', href: '/accounting/cash' },
      { name: 'Bank Journal', href: '/accounting/bank' },
      { name: 'Receivables Ledger', href: '/accounting/receivables' },
      { name: 'Payables Ledger', href: '/accounting/payables' },
      { name: 'General Ledger', href: '/accounting/ledger' },
      { name: 'Journal Entries', href: '/accounting/journal' },
      { name: 'Payments History', href: '/accounting/payments' },
      { name: 'Day Book', href: '/accounting/day-book' },
    ]
  },
  {
    name: 'HRM',
    icon: CalendarDays,
    subItems: [
      { name: 'Employees List', href: '/hrm/employees' },
      { name: 'Add Employee', href: '/hrm/employees/create' },
      { name: 'Attendance Panel', href: '/hrm/attendance' },
      { name: 'Salary Sheets', href: '/hrm/salary' },
      { name: 'Leave Tracker', href: '/hrm/leave' },
      { name: 'Departments', href: '/hrm/departments' },
    ]
  },
  {
    name: 'People',
    icon: UsersRound,
    subItems: [
      { name: 'Customers List', href: '/people/customers' },
      { name: 'Create Customer', href: '/people/customers/create' },
      { name: 'Suppliers List', href: '/people/suppliers' },
      { name: 'Create Supplier', href: '/people/suppliers/create' },
      { name: 'Users List', href: '/people/users' },
    ]
  },
  {
    name: 'Reports',
    icon: BarChart3,
    subItems: [
      { name: 'Sales Report', href: '/reports/sales' },
      { name: 'Purchase Report', href: '/reports/purchases' },
      { name: 'Profit & Loss', href: '/reports/profit-loss' },
      { name: 'Stock Report', href: '/reports/stock' },
      { name: 'Tax Summary', href: '/reports/tax' },
      { name: 'Expense Report', href: '/reports/expenses' },
      { name: 'Customer Ledger', href: '/reports/customers' },
      { name: 'Supplier Ledger', href: '/reports/suppliers' },
      { name: 'Payments Audit', href: '/reports/payments' },
      { name: 'Product Performance', href: '/reports/products' },
    ]
  },
  {
    name: 'Settings',
    icon: Settings,
    subItems: [
      { name: 'Business Settings', href: '/settings/business' },
      { name: 'Invoice Config', href: '/settings/invoice' },
      { name: 'Tax Rates', href: '/settings/tax' },
      { name: 'Payment Methods', href: '/settings/payment-methods' },
      { name: 'Users List', href: '/settings/users' },
      { name: 'Roles & Groups', href: '/settings/roles' },
      { name: 'Permissions Matrix', href: '/settings/permissions' },
      { name: 'Warehouses Settings', href: '/settings/warehouse' },
      { name: 'Printers Setup', href: '/settings/printer' },
      { name: 'Backup Database', href: '/settings/backup' },
      { name: 'System Settings', href: '/settings/system' },
    ]
  },
  {
    name: 'Users',
    icon: ShieldCheck,
    permission: 'users',
    subItems: [
      { name: 'Users List', href: '/settings/users' },
      { name: 'Roles & Groups', href: '/settings/roles' },
      { name: 'Permissions Matrix', href: '/settings/permissions' },
    ]
  },
  {
    name: 'Distributor Users',
    href: '/distributor-users',
    icon: Users,
  },
  {
    name: 'Documentation',
    href: '/documentation',
    icon: FileQuestion,
  }
];

// Helper to expand parent menu active subroute mapping
export const getActiveParentName = (pathname: string): string => {
  for (const item of navigationConfig) {
    if (item.href === pathname) return item.name;
    if (item.subItems) {
      const match = item.subItems.some((sub) => pathname.startsWith(sub.href));
      if (match) return item.name;
    }
  }
  return '';
};
