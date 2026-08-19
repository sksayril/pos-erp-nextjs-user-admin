import { 
  User, Product, Category, Brand, Unit, Warehouse, Customer, Supplier, 
  Sale, Purchase, Return, Expense, Quotation, Transfer, Account, LedgerEntry, Employee 
} from './types';

export const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Electronics', code: 'ELEC', productCount: 4 },
  { id: 'cat-2', name: 'Beverages', code: 'BEV', productCount: 3 },
  { id: 'cat-3', name: 'Office Supplies', code: 'OFF', productCount: 2 },
  { id: 'cat-4', name: 'Snacks', code: 'SNA', productCount: 3 }
];

export const mockBrands: Brand[] = [
  { id: 'br-1', name: 'Logitech', code: 'LOGI' },
  { id: 'br-2', name: 'Coca Cola Company', code: 'COKE' },
  { id: 'br-3', name: 'HP', code: 'HP' },
  { id: 'br-4', name: 'Lays', code: 'LAYS' }
];

export const mockUnits: Unit[] = [
  { id: 'un-1', name: 'Pieces', shortName: 'pcs' },
  { id: 'un-2', name: 'Box (12 pcs)', shortName: 'box', baseUnit: 'pcs', operator: '*', operationValue: 12 },
  { id: 'un-3', name: 'Kilograms', shortName: 'kg' }
];

export const mockWarehouses: Warehouse[] = [
  { id: 'wh-1', name: 'Main Warehouse', code: 'MW-01', phone: '0123456789', email: 'main@erp.com', address: '12 Main St, Tech City', status: 'Active' },
  { id: 'wh-2', name: 'Downtown Store', code: 'DS-02', phone: '0987654321', email: 'downtown@erp.com', address: '45 Retail Ave, Commercial Zone', status: 'Active' }
];

export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Logitech MX Master 3S',
    sku: 'LOG-MX3S-W',
    barcode: '978020137962',
    categoryId: 'cat-1',
    brandId: 'br-1',
    unitId: 'un-1',
    purchasePrice: 70.00,
    sellingPrice: 99.99,
    wholesalePrice: 85.00,
    mrp: 119.99,
    taxRate: 18,
    taxType: 'Exclusive',
    openingStock: 50,
    minStock: 10,
    maxStock: 200,
    status: 'Active',
    rack: 'A-3',
    hasBatch: false,
    hasSerial: true
  },
  {
    id: 'prod-2',
    name: 'Coca Cola 330ml Can',
    sku: 'COKE-330-CAN',
    barcode: '5449000000996',
    categoryId: 'cat-2',
    brandId: 'br-2',
    unitId: 'un-1',
    purchasePrice: 0.50,
    sellingPrice: 1.50,
    wholesalePrice: 1.00,
    mrp: 2.00,
    taxRate: 5,
    taxType: 'Inclusive',
    openingStock: 500,
    minStock: 100,
    maxStock: 2000,
    status: 'Active',
    rack: 'B-1',
    hasBatch: true,
    hasSerial: false
  },
  {
    id: 'prod-3',
    name: 'HP LaserJet Pro M404dn',
    sku: 'HP-LJ-M404',
    barcode: '190781258679',
    categoryId: 'cat-1',
    brandId: 'br-3',
    unitId: 'un-1',
    purchasePrice: 180.00,
    sellingPrice: 249.99,
    wholesalePrice: 210.00,
    mrp: 299.99,
    taxRate: 18,
    taxType: 'Exclusive',
    openingStock: 15,
    minStock: 3,
    maxStock: 50,
    status: 'Active',
    rack: 'A-1',
    hasBatch: false,
    hasSerial: true
  },
  {
    id: 'prod-4',
    name: 'Classic Salted Lays',
    sku: 'LAYS-CS-50G',
    barcode: '8901491101830',
    categoryId: 'cat-4',
    brandId: 'br-4',
    unitId: 'un-1',
    purchasePrice: 0.40,
    sellingPrice: 1.00,
    wholesalePrice: 0.75,
    mrp: 1.20,
    taxRate: 12,
    taxType: 'Inclusive',
    openingStock: 200,
    minStock: 20,
    maxStock: 1000,
    status: 'Active',
    rack: 'B-2',
    hasBatch: true,
    hasSerial: false
  },
  {
    id: 'prod-5',
    name: 'Wireless Mechanical Keyboard',
    sku: 'MECH-KEY-BL',
    barcode: '4897093820982',
    categoryId: 'cat-1',
    brandId: 'br-1',
    unitId: 'un-1',
    purchasePrice: 45.00,
    sellingPrice: 69.99,
    wholesalePrice: 55.00,
    mrp: 79.99,
    taxRate: 18,
    taxType: 'Exclusive',
    openingStock: 5, // Low stock indicator
    minStock: 8,
    maxStock: 100,
    status: 'Active',
    rack: 'A-2',
    hasBatch: false,
    hasSerial: false
  }
];

export const mockCustomers: Customer[] = [
  { id: 'cust-1', name: 'Walk-In Customer', phone: '0000000000', creditLimit: 0, outstandingBalance: 0, status: 'Active' },
  { id: 'cust-2', name: 'Apex Retailers', phone: '9888877777', email: 'apex@retail.com', address: '78 Commercial Loop, NY', creditLimit: 5000, outstandingBalance: 1250.00, status: 'Active' },
  { id: 'cust-3', name: 'John Doe Enterprise', phone: '9777766666', email: 'john@doe.com', address: '4 Pine Rd, SF', creditLimit: 2000, outstandingBalance: 0.00, status: 'Active' },
  { id: 'cust-4', name: 'Smart Stores Ltd', phone: '9666655555', email: 'smart@stores.com', address: '99 Boulevard Plaza, LA', creditLimit: 10000, outstandingBalance: 4200.50, status: 'Active' }
];

export const mockSuppliers: Supplier[] = [
  { id: 'supp-1', name: 'Global Tech Distributors', phone: '8888899999', email: 'sales@globaltech.com', address: '300 Silicon Valley Dr, CA', outstandingPayable: 3400.00, status: 'Active' },
  { id: 'supp-2', name: 'Beverage King Co.', phone: '8777788888', email: 'orders@bevking.com', address: '12 Bottler Row, GA', outstandingPayable: 0.00, status: 'Active' },
  { id: 'supp-3', name: 'Office Depot Solutions', phone: '8666677777', email: 'solutions@officedepot.com', address: '50 Office Way, FL', outstandingPayable: 850.20, status: 'Active' }
];

export const mockSales: Sale[] = [
  {
    id: 'sale-1',
    invoiceNumber: 'INV-2026-0001',
    date: '2026-08-19',
    customerId: 'cust-2',
    customerName: 'Apex Retailers',
    warehouseId: 'wh-1',
    items: [
      { id: 'sitem-1', productId: 'prod-1', productName: 'Logitech MX Master 3S', sku: 'LOG-MX3S-W', quantity: 10, price: 99.99, discount: 5.00, tax: 17.10, total: 1120.90 }
    ],
    subtotal: 999.90,
    discount: 50.00,
    tax: 171.00,
    grandTotal: 1120.90,
    paidAmount: 1120.90,
    dueAmount: 0.00,
    paymentStatus: 'Paid',
    status: 'Completed',
    paymentMethod: 'UPI'
  },
  {
    id: 'sale-2',
    invoiceNumber: 'INV-2026-0002',
    date: '2026-08-20',
    customerId: 'cust-4',
    customerName: 'Smart Stores Ltd',
    warehouseId: 'wh-1',
    items: [
      { id: 'sitem-2', productId: 'prod-3', productName: 'HP LaserJet Pro M404dn', sku: 'HP-LJ-M404', quantity: 5, price: 249.99, discount: 0, tax: 224.99, total: 1474.94 },
      { id: 'sitem-3', productId: 'prod-4', productName: 'Classic Salted Lays', sku: 'LAYS-CS-50G', quantity: 100, price: 1.00, discount: 0.10, tax: 10.80, total: 100.80 }
    ],
    subtotal: 1349.95,
    discount: 10.00,
    tax: 235.79,
    grandTotal: 1575.74,
    paidAmount: 500.00,
    dueAmount: 1075.74,
    paymentStatus: 'Partial',
    status: 'Completed',
    paymentMethod: 'Split'
  }
];

export const mockPurchases: Purchase[] = [
  {
    id: 'pur-1',
    purchaseNumber: 'PUR-2026-0001',
    invoiceNumber: 'GTD-998822',
    date: '2026-08-15',
    supplierId: 'supp-1',
    supplierName: 'Global Tech Distributors',
    warehouseId: 'wh-1',
    items: [
      { id: 'pitem-1', productId: 'prod-1', productName: 'Logitech MX Master 3S', sku: 'LOG-MX3S-W', quantity: 50, price: 70.00, discount: 0, tax: 630.00, total: 4130.00 }
    ],
    subtotal: 3500.00,
    discount: 0.00,
    tax: 630.00,
    grandTotal: 4130.00,
    paidAmount: 4130.00,
    dueAmount: 0.00,
    paymentStatus: 'Paid',
    status: 'Received',
    paymentMethod: 'Bank Transfer'
  }
];

export const mockExpenses: Expense[] = [
  { id: 'exp-1', category: 'Electricity', amount: 320.00, date: '2026-08-10', paymentMethod: 'Bank Transfer', reference: 'ELEC-AUG-26', description: 'Office electricity bill August' },
  { id: 'exp-2', category: 'Office Supplies', amount: 85.50, date: '2026-08-12', paymentMethod: 'Cash', description: 'Printer paper & folders' }
];

export const mockQuotations: Quotation[] = [
  {
    id: 'quot-1',
    quotationNumber: 'QTN-2026-0001',
    date: '2026-08-18',
    expiryDate: '2026-08-25',
    customerId: 'cust-3',
    customerName: 'John Doe Enterprise',
    items: [
      { id: 'qitem-1', productId: 'prod-1', productName: 'Logitech MX Master 3S', sku: 'LOG-MX3S-W', quantity: 5, price: 99.99, discount: 10.00, tax: 81.00, total: 530.95 }
    ],
    subtotal: 499.95,
    discount: 50.00,
    tax: 81.00,
    grandTotal: 530.95,
    status: 'Sent'
  }
];

export const mockAccounts: Account[] = [
  { id: 'acc-1', name: 'Main Cash Register', type: 'Cash', openingBalance: 1000.00, currentBalance: 2150.00, status: 'Active' },
  { id: 'acc-2', name: 'Silicon Valley Bank Checking', type: 'Bank', openingBalance: 50000.00, currentBalance: 48920.50, status: 'Active' },
  { id: 'acc-3', name: 'Customer Receivables Ledger', type: 'Receivable', openingBalance: 3000.00, currentBalance: 5450.50, status: 'Active' },
  { id: 'acc-4', name: 'Accounts Payable Ledger', type: 'Payable', openingBalance: 1500.00, currentBalance: 4250.20, status: 'Active' }
];

export const mockEmployees: Employee[] = [
  { id: 'emp-1', employeeId: 'EMP-001', name: 'Sarah Connor', phone: '9999900001', email: 'sarah@erp.com', department: 'Sales', designation: 'Sales Representative', joiningDate: '2025-01-10', salary: 3500, status: 'Active' },
  { id: 'emp-2', employeeId: 'EMP-002', name: 'David Bowman', phone: '9999900002', email: 'david@erp.com', department: 'Warehouse', designation: 'Warehouse Executive', joiningDate: '2025-05-15', salary: 2800, status: 'Active' },
  { id: 'emp-3', employeeId: 'EMP-003', name: 'Hal Nine', phone: '9999900003', email: 'hal@erp.com', department: 'Management', designation: 'ERP Manager', joiningDate: '2024-08-01', salary: 6000, status: 'Active' }
];

export const mockTransfers: Transfer[] = [
  {
    id: 'trans-1',
    reference: 'TR-0001',
    fromWarehouseId: 'wh-1',
    toWarehouseId: 'wh-2',
    date: '2026-08-17',
    items: [
      { productId: 'prod-2', productName: 'Coca Cola 330ml Can', quantity: 120 }
    ],
    status: 'Completed',
    notes: 'Restocking the downtown storefront shelf.'
  }
];

export const mockLedgerEntries: LedgerEntry[] = [
  { id: 'ledg-1', accountId: 'acc-1', date: '2026-08-19', reference: 'INV-2026-0001', description: 'Payment received for sale', debit: 1120.90, credit: 0, balance: 2120.90 },
  { id: 'ledg-2', accountId: 'acc-2', date: '2026-08-15', reference: 'PUR-2026-0001', description: 'Payment to Global Tech Distributors', debit: 0, credit: 4130.00, balance: 45870.00 }
];
