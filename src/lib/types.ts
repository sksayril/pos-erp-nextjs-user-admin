// POS ERP System Types

export type UserRole = 
  | 'Super Admin' 
  | 'Admin' 
  | 'Manager' 
  | 'Cashier' 
  | 'Accountant' 
  | 'Purchase Manager' 
  | 'Sales Manager' 
  | 'HR Manager' 
  | 'Warehouse Manager' 
  | 'Distributor'
  | string; // allow custom roles created in DB

export interface Permission {
  id: string;
  name: string; // e.g. "products.view"
  description: string;
}

export interface Role {
  id: string;
  name: UserRole;
  permissions: string[]; // List of permission names
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  avatar?: string;
  warehouseId?: string; // Assigned warehouse
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  productCount: number;
}

export interface Brand {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Unit {
  id: string;
  name: string;
  shortName: string;
  baseUnit?: string;
  operator?: string;
  operationValue?: number;
}

export interface Variant {
  id: string;
  name: string;
  values: string[]; // e.g., ["Red", "Blue"] or ["S", "M", "L"]
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  phone?: string;
  email?: string;
  address?: string;
  status: 'Active' | 'Inactive';
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  brandId?: string;
  unitId: string;
  purchasePrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  mrp?: number;
  taxRate: number; // in percent, e.g. 18
  taxType: 'Exclusive' | 'Inclusive';
  openingStock: number;
  minStock: number;
  maxStock: number;
  description?: string;
  status: 'Active' | 'Inactive';
  image?: string;
  rack?: string;
  hasBatch?: boolean;
  hasSerial?: boolean;
  isVariant?: boolean;
}

export interface Stock {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
}

export interface Batch {
  id: string;
  productId: string;
  batchNumber: string;
  expiryDate: string;
  warehouseId: string;
  quantity: number;
  status: 'Active' | 'Expired';
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  creditLimit: number;
  outstandingBalance: number;
  status: 'Active' | 'Inactive';
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  outstandingPayable: number;
  status: 'Active' | 'Inactive';
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  discount: number; // flat amount per unit
  tax: number; // tax amount per unit
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  warehouseId: string;
  items: SaleItem[];
  subtotal: number;
  discount: number; // total discount
  tax: number; // total tax
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: 'Paid' | 'Partial' | 'Due';
  status: 'Completed' | 'Pending' | 'Cancelled';
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Split' | 'Credit';
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  invoiceNumber?: string;
  date: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: 'Paid' | 'Partial' | 'Due';
  status: 'Received' | 'Pending' | 'Ordered';
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer';
}

export interface Return {
  id: string;
  returnNumber: string;
  referenceNumber: string; // Invoice / Purchase ID
  date: string;
  type: 'Sale Return' | 'Purchase Return';
  partyName: string; // Customer / Supplier Name
  warehouseId: string;
  subtotal: number;
  tax: number;
  grandTotal: number;
  reason: string;
  status: 'Completed' | 'Pending';
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: string;
  reference?: string;
  description?: string;
  attachment?: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  date: string;
  expiryDate: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  status: 'Sent' | 'Accepted' | 'Expired';
  notes?: string;
}

export interface Transfer {
  id: string;
  reference: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  date: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
  }[];
  status: 'Draft' | 'Pending' | 'Approved' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface Payment {
  id: string;
  date: string;
  referenceNumber: string;
  type: 'Received' | 'Paid';
  partyName: string;
  amount: number;
  paymentMethod: string;
  accountId: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'Cash' | 'Bank' | 'Receivable' | 'Payable' | 'Equity' | 'Expense' | 'Revenue';
  openingBalance: number;
  currentBalance: number;
  status: 'Active' | 'Inactive';
}

export interface LedgerEntry {
  id: string;
  accountId: string;
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  phone: string;
  email: string;
  department: string;
  designation: string;
  joiningDate: string;
  salary: number;
  status: 'Active' | 'Inactive';
}
