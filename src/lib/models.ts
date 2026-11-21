import mongoose, { Schema } from 'mongoose';
import crypto from 'crypto';

// --- PRODUCT SCHEMA ---
const ProductSchema = new Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  barcode: { type: String, default: '' },
  categoryId: { type: String, default: 'cat-general' },
  category: { type: String, default: 'General' },
  brandId: { type: String },
  brand: { type: String, default: 'Generic' },
  unitId: { type: String },
  unit: { type: String, default: 'Pieces (pcs)' },
  costPrice: { type: Number, default: 0 },
  purchasePrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, required: true, default: 0 },
  wholesalePrice: { type: Number, default: 0 },
  mrp: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  taxType: { type: String, enum: ['Exclusive', 'Inclusive'], default: 'Exclusive' },
  openingStock: { type: Number, default: 0 },
  minStock: { type: Number, default: 5 },
  minStockAlert: { type: Number, default: 5 },
  maxStock: { type: Number, default: 1000 },
  supplier: { type: String },
  description: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  image: { type: String }, // AWS S3 Image URL or HTTPS CDN URL
  rack: { type: String }
}, { timestamps: true });

// --- CUSTOMER SCHEMA ---
const CustomerSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  creditLimit: { type: Number, default: 0 },
  outstandingBalance: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

// --- SALE ITEM SUB-SCHEMA ---
const SaleItemSchema = new Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true }
});

// --- SALE SCHEMA ---
const SaleSchema = new Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  customerId: { type: String, required: true },
  customerName: { type: String, required: true },
  warehouseId: { type: String, default: 'wh-1' },
  items: [SaleItemSchema],
  subtotal: { type: Number, required: true, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true, default: 0 },
  paidAmount: { type: Number, required: true, default: 0 },
  dueAmount: { type: Number, required: true, default: 0 },
  paymentStatus: { type: String, enum: ['Paid', 'Partial', 'Due'], default: 'Paid' },
  status: { type: String, enum: ['Completed', 'Pending', 'Cancelled'], default: 'Completed' },
  paymentMethod: { type: String, required: true }
}, { timestamps: true });

// --- PURCHASE ITEM SUB-SCHEMA ---
const PurchaseItemSchema = new Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true }
});

// --- PURCHASE SCHEMA ---
const PurchaseSchema = new Schema({
  purchaseNumber: { type: String, required: true, unique: true },
  invoiceNumber: { type: String },
  date: { type: String, required: true },
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  warehouseId: { type: String, default: 'wh-1' },
  items: [PurchaseItemSchema],
  subtotal: { type: Number, required: true, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true, default: 0 },
  paidAmount: { type: Number, required: true, default: 0 },
  dueAmount: { type: Number, required: true, default: 0 },
  paymentStatus: { type: String, enum: ['Paid', 'Partial', 'Due'], default: 'Paid' },
  status: { type: String, enum: ['Received', 'Pending', 'Ordered'], default: 'Received' },
  paymentMethod: { type: String, required: true }
}, { timestamps: true });

// Export compiled mongoose models, reuse existing models if cached
export const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export const CustomerModel = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
export const SaleModel = mongoose.models.Sale || mongoose.model('Sale', SaleSchema);
export const PurchaseModel = mongoose.models.Purchase || mongoose.model('Purchase', PurchaseSchema);
export const SupplierModel = mongoose.models.Supplier || mongoose.model('Supplier', new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  outstandingPayable: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true }));
// --- EXPENSE CATEGORY SCHEMA ---
const ExpenseCategorySchema = new Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true },
  budgetLimit: { type: Number, default: 0 },
  description: { type: String },
  color: { type: String, default: 'blue' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

export const ExpenseCategoryModel = mongoose.models.ExpenseCategory || mongoose.model('ExpenseCategory', ExpenseCategorySchema);

// --- EXPENSE SCHEMA ---
const ExpenseSchema = new Schema({
  expenseNumber: { type: String, required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'ExpenseCategory' },
  amount: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  date: { type: String, required: true },
  paymentMethod: { type: String, default: 'Cash' },
  paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Approved', 'Rejected'], default: 'Paid' },
  paidBy: { type: String },
  vendor: { type: String },
  reference: { type: String },
  receiptUrl: { type: String },
  warehouseId: { type: String },
  warehouseName: { type: String },
  description: { type: String },
  approvedBy: { type: String }
}, { timestamps: true });

export const ExpenseModel = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);

// --- QUOTATION SCHEMA ---
const QuotationSchema = new Schema({
  quotationNumber: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  validUntil: { type: String, required: true },
  customerId: { type: String },
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  customerEmail: { type: String },
  customerAddress: { type: String },
  warehouseId: { type: String },
  warehouseName: { type: String, default: 'Central Hub Warehouse' },
  items: [{
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    sku: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  orderTax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Draft', 'Sent', 'Accepted', 'Declined', 'Converted'], 
    default: 'Sent' 
  },
  convertedToSaleId: { type: String },
  terms: { type: String },
  notes: { type: String },
  preparedBy: { type: String, default: 'Sales Executive' }
}, { timestamps: true });

export const QuotationModel = mongoose.models.Quotation || mongoose.model('Quotation', QuotationSchema);

// --- STOCK TRANSFER SCHEMA ---
const TransferSchema = new Schema({
  transferNumber: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  fromWarehouseId: { type: String },
  fromWarehouseName: { type: String, required: true },
  toWarehouseId: { type: String },
  toWarehouseName: { type: String, required: true },
  items: [{
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    sku: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, default: 0 },
    subtotal: { type: Number, required: true }
  }],
  totalQuantity: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  shippingCharge: { type: Number, default: 0 },
  vehicleNumber: { type: String },
  driverName: { type: String },
  driverPhone: { type: String },
  trackingNumber: { type: String },
  status: { 
    type: String, 
    enum: ['Draft', 'Pending', 'In Transit', 'Completed', 'Cancelled'], 
    default: 'In Transit' 
  },
  notes: { type: String },
  initiatedBy: { type: String, default: 'Inventory Controller' },
  receivedBy: { type: String },
  receivedDate: { type: String }
}, { timestamps: true });

export const TransferModel = mongoose.models.Transfer || mongoose.model('Transfer', TransferSchema);

export const PermissionModel = mongoose.models.Permission || mongoose.model('Permission', new Schema({
  role: { type: String, required: true, unique: true },
  modules: {
    dashboard: { type: Boolean, default: false },
    pos: { type: Boolean, default: false },
    products: { type: Boolean, default: false },
    purchases: { type: Boolean, default: false },
    sales: { type: Boolean, default: false },
    expenses: { type: Boolean, default: false },
    quotations: { type: Boolean, default: false },
    transfers: { type: Boolean, default: false },
    returns: { type: Boolean, default: false },
    accounting: { type: Boolean, default: false },
    hrm: { type: Boolean, default: false },
    people: { type: Boolean, default: false },
    reports: { type: Boolean, default: false },
    settings: { type: Boolean, default: false },
    distributorUsers: { type: Boolean, default: false },
    documentation: { type: Boolean, default: false },
    users: { type: Boolean, default: false },
  }
}, { timestamps: true }));

// --- USER ACCOUNT SCHEMA (for login authentication & dynamic staff database) ---
const UserAccountSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  passwordHash: { type: String },
  role: { type: String, required: true, default: 'Cashier' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  warehouseId: { type: String, default: 'wh-1' },
  phone: { type: String },
  avatar: { type: String },
  businessName: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  postalCode: { type: String },
  subscriptionKey: { type: String },
  subscriptionPlan: { type: String, default: '1-Year Full ERP License' },
  subscriptionExpiry: { type: String },
  lastLogin: { type: Date },
  createdBy: { type: String }, // ID of the superadmin who created this user
}, { timestamps: true });

// Helper functions for password hashing
export const hashPassword = (plain: string): string => {
  return crypto.createHash('sha256').update(plain + 'erp_salt_2026').digest('hex');
};

export const verifyPassword = (plain: string, hash: string): boolean => {
  const computed = crypto.createHash('sha256').update(plain + 'erp_salt_2026').digest('hex');
  return computed === hash;
};

export const UserAccountModel = mongoose.models.UserAccount || mongoose.model('UserAccount', UserAccountSchema);

// --- SUBSCRIPTION SCHEMA (live MongoDB records for activations & licenses) ---
const SubscriptionSchema = new Schema({
  userEmail: { type: String, required: true, lowercase: true, trim: true },
  businessName: { type: String },
  activationKey: { type: String, required: true, unique: true },
  planName: { type: String, default: '1-Year ERP Full License' },
  amount: { type: Number, default: 5999 },
  status: { type: String, enum: ['Active', 'Expired', 'Cancelled'], default: 'Active' },
  expiryDate: { type: String, required: true },
  activatedAt: { type: String, required: true },
  paymentMethod: { type: String, default: 'Online / Activation Code' }
}, { timestamps: true });

export const SubscriptionModel = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);

// --- ROLE SCHEMA (custom roles created by superadmin) ---
const RoleSchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  isSystem: { type: Boolean, default: false }, // System roles cannot be deleted
  createdBy: { type: String },
}, { timestamps: true });

export const RoleModel = mongoose.models.Role || mongoose.model('Role', RoleSchema);

// --- WAYBILL SCHEMA ---
const WaybillSchema = new Schema({
  ewayBillNo: { type: String, required: true, unique: true },
  invoiceNo: { type: String, required: true },
  customerName: { type: String, required: true },
  transporterName: { type: String, required: true },
  vehicleNo: { type: String, required: true },
  distance: { type: Number, default: 0 },
  status: { type: String, enum: ['Generated', 'Active', 'Expired', 'Cancelled'], default: 'Generated' },
  date: { type: String, required: true }
}, { timestamps: true });

// --- DELIVERY CHALLAN SCHEMA ---
const DeliverySchema = new Schema({
  challanNo: { type: String, required: true, unique: true },
  invoiceNo: { type: String, required: true },
  customerName: { type: String, required: true },
  deliveryDate: { type: String, required: true },
  status: { type: String, enum: ['Shipped', 'Delivered', 'Cancelled', 'Returned'], default: 'Shipped' },
  shippingAddress: { type: String, required: true },
  courierName: { type: String }
}, { timestamps: true });

// --- SALES RETURN SCHEMA ---
const SalesReturnSchema = new Schema({
  returnNumber: { type: String, required: true, unique: true },
  invoiceNumber: { type: String, required: true },
  date: { type: String, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  warehouseName: { type: String, default: 'Central Godown (HQ)' },
  items: [{
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    sku: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  refundAmount: { type: Number, default: 0 },
  refundStatus: { type: String, enum: ['Pending', 'Refunded', 'Credit Issued'], default: 'Credit Issued' },
  reason: { type: String },
  status: { type: String, enum: ['Received', 'Inspected', 'Restocked', 'Scrapped'], default: 'Received' },
  creditNoteNo: { type: String },
  notes: { type: String },
  receivedBy: { type: String, default: 'Customer Support Lead' }
}, { timestamps: true });

// --- PURCHASE RETURN SCHEMA ---
const PurchaseReturnSchema = new Schema({
  returnNumber: { type: String, required: true, unique: true },
  purchaseNumber: { type: String, required: true },
  date: { type: String, required: true },
  supplierName: { type: String, required: true },
  supplierPhone: { type: String },
  warehouseName: { type: String, default: 'Central Godown (HQ)' },
  items: [{
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    sku: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, default: 0 },
    subtotal: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  debitAmount: { type: Number, default: 0 },
  claimStatus: { type: String, enum: ['Pending', 'Debit Issued', 'Adjusted in Next Bill'], default: 'Debit Issued' },
  reason: { type: String },
  status: { type: String, enum: ['Dispatched', 'Supplier Acknowledged', 'Settled'], default: 'Dispatched' },
  debitNoteNo: { type: String },
  notes: { type: String },
  initiatedBy: { type: String, default: 'QC & Procurement Officer' }
}, { timestamps: true });

// --- CREDIT NOTE SCHEMA ---
const CreditNoteSchema = new Schema({
  noteNo: { type: String, required: true, unique: true },
  invoiceNo: { type: String, required: true },
  customerName: { type: String, required: true },
  refundAmount: { type: Number, required: true, default: 0 },
  date: { type: String, required: true },
  reason: { type: String },
  status: { type: String, enum: ['Issued', 'Refunded', 'Cancelled'], default: 'Issued' }
}, { timestamps: true });

// --- DEBIT NOTE SCHEMA ---
const DebitNoteSchema = new Schema({
  noteNo: { type: String, required: true, unique: true },
  purchaseNo: { type: String, required: true },
  supplierName: { type: String, required: true },
  debitAmount: { type: Number, required: true, default: 0 },
  date: { type: String, required: true },
  reason: { type: String },
  status: { type: String, enum: ['Issued', 'Adjusted', 'Cancelled'], default: 'Issued' }
}, { timestamps: true });

// --- WAREHOUSE (GODOWN) SCHEMA ---
const WarehouseSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  phone: { type: String },
  email: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  address: { type: String },
  managerName: { type: String }
}, { timestamps: true });

// --- WAREHOUSE STOCK (GODOWN INVENTORY) SCHEMA ---
const WarehouseStockSchema = new Schema({
  warehouseId: { type: String, required: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0 }
}, { timestamps: true });

export const WaybillModel = mongoose.models.Waybill || mongoose.model('Waybill', WaybillSchema);
export const DeliveryModel = mongoose.models.Delivery || mongoose.model('Delivery', DeliverySchema);
export const SalesReturnModel = mongoose.models.SalesReturn || mongoose.model('SalesReturn', SalesReturnSchema);
export const PurchaseReturnModel = mongoose.models.PurchaseReturn || mongoose.model('PurchaseReturn', PurchaseReturnSchema);
export const CreditNoteModel = mongoose.models.CreditNote || mongoose.model('CreditNote', CreditNoteSchema);
export const DebitNoteModel = mongoose.models.DebitNote || mongoose.model('DebitNote', DebitNoteSchema);
export const WarehouseModel = mongoose.models.Warehouse || mongoose.model('Warehouse', WarehouseSchema);
export const WarehouseStockModel = mongoose.models.WarehouseStock || mongoose.model('WarehouseStock', WarehouseStockSchema);

// ============================================================================
// HRM (HUMAN RESOURCE MANAGEMENT) SCHEMAS
// ============================================================================

// --- EMPLOYEE SCHEMA ---
const EmployeeSchema = new Schema({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  department: { type: String, required: true, default: 'General' },
  designation: { type: String, required: true, default: 'Staff' },
  joinDate: { type: String, required: true },
  salary: { type: Number, required: true, default: 0 },
  salaryType: { type: String, enum: ['Monthly', 'Hourly', 'Weekly'], default: 'Monthly' },
  status: { type: String, enum: ['Active', 'On Leave', 'Terminated'], default: 'Active' },
  avatar: { type: String },
  address: { type: String },
  emergencyContact: { type: String },
  bankName: { type: String },
  bankAccount: { type: String },
  panGst: { type: String },
}, { timestamps: true });

export const EmployeeModel = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);

// --- ATTENDANCE SCHEMA ---
const AttendanceSchema = new Schema({
  attendanceId: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  department: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  checkIn: { type: String }, // e.g. "09:05 AM"
  checkOut: { type: String }, // e.g. "06:15 PM"
  status: { type: String, enum: ['Present', 'Late', 'Absent', 'Half Day', 'On Leave'], default: 'Present' },
  workingHours: { type: Number, default: 8 },
  notes: { type: String }
}, { timestamps: true });

export const AttendanceModel = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);

// --- SALARY SHEET (PAYROLL) SCHEMA ---
const SalarySheetSchema = new Schema({
  payrollId: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  department: { type: String, required: true },
  month: { type: String, required: true }, // e.g. "September 2026"
  basicSalary: { type: Number, required: true, default: 0 },
  allowance: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  netSalary: { type: Number, required: true, default: 0 },
  paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Processing'], default: 'Pending' },
  paidDate: { type: String },
  paymentMethod: { type: String, enum: ['Bank Transfer', 'Cash', 'Cheque', 'UPI'], default: 'Bank Transfer' },
  notes: { type: String }
}, { timestamps: true });

export const SalarySheetModel = mongoose.models.SalarySheet || mongoose.model('SalarySheet', SalarySheetSchema);

// --- LEAVE REQUEST SCHEMA ---
const LeaveRequestSchema = new Schema({
  leaveId: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  department: { type: String, required: true },
  leaveType: { 
    type: String, 
    enum: ['Casual Leave', 'Sick Leave', 'Annual Paid Leave', 'Maternity/Paternity Leave', 'Emergency Leave'], 
    default: 'Casual Leave' 
  },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  totalDays: { type: Number, required: true, default: 1 },
  reason: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  approvedBy: { type: String },
  appliedOn: { type: String, required: true }
}, { timestamps: true });

export const LeaveRequestModel = mongoose.models.LeaveRequest || mongoose.model('LeaveRequest', LeaveRequestSchema);

// --- DEPARTMENT SCHEMA ---
const DepartmentSchema = new Schema({
  departmentId: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  headOfDepartment: { type: String, default: 'Unassigned' },
  employeeCount: { type: Number, default: 0 },
  budget: { type: Number, default: 0 },
  description: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

export const DepartmentModel = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);

// ============================================================================
// ACCOUNTING & FINANCIAL SCHEMAS
// ============================================================================

// --- CHART OF ACCOUNTS SCHEMA ---
const AccountSchema = new Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'], required: true },
  subtype: { type: String, required: true, default: 'General' },
  openingBalance: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  bankName: { type: String },
  accountNumber: { type: String },
  ifscCode: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  description: { type: String }
}, { timestamps: true });

export const AccountModel = mongoose.models.Account || mongoose.model('Account', AccountSchema);

// --- JOURNAL ENTRY ITEM SUB-SCHEMA ---
const JournalLineSchema = new Schema({
  accountId: { type: String, required: true },
  accountCode: { type: String },
  accountName: { type: String, required: true },
  debit: { type: Number, default: 0 },
  credit: { type: Number, default: 0 },
  notes: { type: String }
});

// --- GENERAL JOURNAL ENTRY SCHEMA ---
const JournalEntrySchema = new Schema({
  entryNumber: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  reference: { type: String },
  description: { type: String, required: true },
  lines: [JournalLineSchema],
  totalDebit: { type: Number, required: true, default: 0 },
  totalCredit: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['Posted', 'Draft', 'Reversed'], default: 'Posted' },
  createdBy: { type: String, default: 'Super Admin' }
}, { timestamps: true });

export const JournalEntryModel = mongoose.models.JournalEntry || mongoose.model('JournalEntry', JournalEntrySchema);

// --- ACCOUNT TRANSACTION REGISTER (Cash, Bank, Receipts, Payments, Day-Book) ---
const AccountTransactionSchema = new Schema({
  transactionNumber: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  accountType: { type: String, enum: ['Cash', 'Bank', 'Receivable', 'Payable', 'Expense', 'Journal'], required: true },
  accountId: { type: String },
  accountName: { type: String, required: true },
  type: { type: String, enum: ['Debit', 'Credit', 'Inflow', 'Outflow'], required: true },
  amount: { type: Number, required: true, default: 0 },
  category: { type: String, required: true, default: 'General' },
  partyName: { type: String }, // Customer, Vendor, Employee
  partyType: { type: String, enum: ['Customer', 'Supplier', 'Employee', 'Self', 'Other'], default: 'Other' },
  paymentMethod: { type: String, enum: ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Card'], default: 'Cash' },
  reference: { type: String }, // Invoice / Bill / Cheque number
  balanceAfter: { type: Number, default: 0 },
  status: { type: String, enum: ['Completed', 'Pending', 'Cancelled'], default: 'Completed' },
  description: { type: String }
}, { timestamps: true });

export const AccountTransactionModel = mongoose.models.AccountTransaction || mongoose.model('AccountTransaction', AccountTransactionSchema);

// --- BUSINESS SETTINGS SCHEMA ---
const BusinessSettingsSchema = new Schema({
  companyName: { type: String, required: true, default: 'Apex Enterprise POS & ERP' },
  tradeName: { type: String, default: 'Apex Retail Solutions Ltd' },
  gstin: { type: String, default: '19AAACA9928P1Z8' },
  pan: { type: String, default: 'AAACA9928P' },
  email: { type: String, default: 'accounts@apexretail.in' },
  phone: { type: String, default: '+91 98300 12345' },
  website: { type: String, default: 'https://apexretail.in' },
  address: { type: String, default: '74/B Sector V, Salt Lake' },
  city: { type: String, default: 'Kolkata' },
  state: { type: String, default: 'West Bengal' },
  country: { type: String, default: 'India' },
  pincode: { type: String, default: '700091' },
  currency: { type: String, default: 'INR (₹)' },
  currencySymbol: { type: String, default: '₹' },
  timezone: { type: String, default: 'Asia/Kolkata (GMT+5:30)' },
  fiscalYearStart: { type: String, default: 'April' },
  logoUrl: { type: String },
  tagline: { type: String, default: 'Smart Retail & Enterprise ERP System' }
}, { timestamps: true });

export const BusinessSettingsModel = mongoose.models.BusinessSettings || mongoose.model('BusinessSettings', BusinessSettingsSchema);

// --- INVOICE CONFIG SCHEMA ---
const InvoiceConfigSchema = new Schema({
  invoicePrefix: { type: String, default: 'INV-2026-' },
  invoiceSuffix: { type: String, default: '' },
  startingNumber: { type: Number, default: 1001 },
  paperSize: { type: String, enum: ['A4', 'A5', 'Thermal 80mm', 'Thermal 58mm'], default: 'A4' },
  themeColor: { type: String, default: '#7c3aed' },
  showLogo: { type: Boolean, default: true },
  showQrCode: { type: Boolean, default: true },
  showTaxBreakup: { type: Boolean, default: true },
  showBankDetails: { type: Boolean, default: true },
  bankName: { type: String, default: 'HDFC Corporate Current Account' },
  bankAccountNumber: { type: String, default: '50200088992211' },
  bankIfsc: { type: String, default: 'HDFC0000123' },
  upiId: { type: String, default: 'apexretail@hdfcbank' },
  termsAndConditions: { type: String, default: '1. Goods once sold will only be returned within 7 days with valid bill.\n2. Interest @ 18% p.a. will be charged for delayed payments after 30 days.' },
  footerNote: { type: String, default: 'Thank you for your business! For support call +91 98300 12345' }
}, { timestamps: true });

export const InvoiceConfigModel = mongoose.models.InvoiceConfig || mongoose.model('InvoiceConfig', InvoiceConfigSchema);

// --- TAX RATE SCHEMA ---
const TaxRateSchema = new Schema({
  name: { type: String, required: true },
  rate: { type: Number, required: true, default: 0 },
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['CGST+SGST', 'IGST', 'Flat', 'Exempt'], default: 'CGST+SGST' },
  isDefault: { type: Boolean, default: false },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  description: { type: String }
}, { timestamps: true });

export const TaxRateModel = mongoose.models.TaxRate || mongoose.model('TaxRate', TaxRateSchema);

// --- PAYMENT METHOD SCHEMA ---
const PaymentMethodSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  accountLinked: { type: String, default: 'Main Cash in Hand' },
  enabledForPOS: { type: Boolean, default: true },
  enabledForSales: { type: Boolean, default: true },
  processingFeePercent: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  icon: { type: String, default: 'CreditCard' }
}, { timestamps: true });

export const PaymentMethodModel = mongoose.models.PaymentMethod || mongoose.model('PaymentMethod', PaymentMethodSchema);


// --- PRINTER CONFIG SCHEMA ---
const PrinterConfigSchema = new Schema({
  printerName: { type: String, required: true },
  type: { type: String, enum: ['Thermal POS 80mm', 'Thermal POS 58mm', 'A4 Laser / Inkjet', 'Barcode Label Printer'], default: 'Thermal POS 80mm' },
  connectionType: { type: String, enum: ['USB / Direct', 'Network IP / Wi-Fi', 'Bluetooth', 'Browser Print Dialog'], default: 'Browser Print Dialog' },
  ipAddress: { type: String },
  port: { type: Number, default: 9100 },
  isDefault: { type: Boolean, default: true },
  autoPrintOnSale: { type: Boolean, default: true },
  openCashDrawerOnSale: { type: Boolean, default: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

export const PrinterConfigModel = mongoose.models.PrinterConfig || mongoose.model('PrinterConfig', PrinterConfigSchema);

// --- SYSTEM SETTINGS SCHEMA ---
const SystemSettingsSchema = new Schema({
  lowStockThreshold: { type: Number, default: 10 },
  enableSoundAlerts: { type: Boolean, default: true },
  enableBarcodeScanner: { type: Boolean, default: true },
  enableNegativeStockSale: { type: Boolean, default: false },
  enableCreditSales: { type: Boolean, default: true },
  taxInclusivePricing: { type: Boolean, default: false },
  defaultWarehouse: { type: String, default: 'Main Central Warehouse' },
  defaultPaymentMethod: { type: String, default: 'Cash' },
  sessionTimeoutMinutes: { type: Number, default: 60 },
  maintenanceMode: { type: Boolean, default: false },
  dummyDataCleared: { type: Boolean, default: false },
  dummyDataClearedAt: { type: Date }
}, { timestamps: true });

export const SystemSettingsModel = mongoose.models.SystemSettings || mongoose.model('SystemSettings', SystemSettingsSchema);

export async function shouldSeedData(): Promise<boolean> {
  try {
    const sys = await SystemSettingsModel.findOne();
    if (sys && sys.dummyDataCleared) {
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

// --- BACKUP HISTORY SCHEMA ---
const BackupHistorySchema = new Schema({
  backupId: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  size: { type: String, default: '2.4 MB' },
  type: { type: String, enum: ['Manual Full Export', 'Scheduled Snapshot'], default: 'Manual Full Export' },
  status: { type: String, enum: ['Success', 'Failed'], default: 'Success' },
  recordsCount: { type: Number, default: 0 }
}, { timestamps: true });

export const BackupHistoryModel = mongoose.models.BackupHistory || mongoose.model('BackupHistory', BackupHistorySchema);

// --- CATEGORY SCHEMA ---
const CategorySchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  parentCategory: { type: String, default: 'None' },
  image: { type: String },
  description: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

export const CategoryModel = mongoose.models.Category || mongoose.model('Category', CategorySchema);

// --- BRAND SCHEMA ---
const BrandSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  country: { type: String, default: 'India' },
  logoUrl: { type: String },
  description: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

export const BrandModel = mongoose.models.Brand || mongoose.model('Brand', BrandSchema);

// --- UNIT SCHEMA ---
const UnitSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  baseUnit: { type: String, default: 'Piece' },
  operator: { type: String, enum: ['*', '/'], default: '*' },
  operationValue: { type: Number, default: 1 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

export const UnitModel = mongoose.models.Unit || mongoose.model('Unit', UnitSchema);

// --- VARIANT ATTRIBUTE SCHEMA ---
const VariantSchema = new Schema({
  attributeName: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  values: [{ type: String }],
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

export const VariantModel = mongoose.models.Variant || mongoose.model('Variant', VariantSchema);

// --- PRICE LIST SCHEMA ---
const PriceListSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['Percentage Discount', 'Fixed Price', 'Markup Margin'], default: 'Percentage Discount' },
  value: { type: Number, required: true, default: 0 },
  applicableFor: { type: String, enum: ['All Products', 'Specific Category', 'B2B Customers', 'Wholesalers'], default: 'All Products' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

export const PriceListModel = mongoose.models.PriceList || mongoose.model('PriceList', PriceListSchema);

// --- BATCH & EXPIRY SCHEMA ---
const BatchSchema = new Schema({
  batchNumber: { type: String, required: true, unique: true },
  productId: { type: String },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  mfgDate: { type: String, required: true },
  expDate: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0 },
  remainingQuantity: { type: Number, required: true, default: 0 },
  costPrice: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Expiring Soon', 'Expired'], default: 'Active' }
}, { timestamps: true });

export const BatchModel = mongoose.models.Batch || mongoose.model('Batch', BatchSchema);

// --- STOCK ADJUSTMENT SCHEMA ---
const StockAdjustmentSchema = new Schema({
  adjustmentNumber: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  warehouseName: { type: String, required: true, default: 'Main Central Hub' },
  productId: { type: String },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  type: { type: String, enum: ['Addition', 'Subtraction'], required: true },
  quantity: { type: Number, required: true, default: 1 },
  reason: { type: String, enum: ['Damaged Goods', 'Theft / Loss', 'Physical Count Surplus', 'Physical Count Shortage', 'Expired Goods', 'Returned / Restocked', 'Other'], default: 'Physical Count Surplus' },
  adjustedBy: { type: String, default: 'Super Admin' },
  notes: { type: String }
}, { timestamps: true });

export const StockAdjustmentModel = mongoose.models.StockAdjustment || mongoose.model('StockAdjustment', StockAdjustmentSchema);

// --- PURCHASE ORDER SCHEMA ---
const PurchaseOrderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  expectedDeliveryDate: { type: String },
  supplierId: { type: String },
  supplierName: { type: String, required: true },
  warehouseName: { type: String, default: 'Main Warehouse' },
  items: [{
    productId: { type: String },
    productName: { type: String, required: true },
    sku: { type: String },
    quantity: { type: Number, required: true, default: 1 },
    unitCost: { type: Number, required: true, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 }
  }],
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['Draft', 'Confirmed', 'Shipped', 'Received', 'Cancelled'], default: 'Draft' },
  notes: { type: String }
}, { timestamps: true });

export const PurchaseOrderModel = mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', PurchaseOrderSchema);

// --- PURCHASE PAYMENT SCHEMA ---
const PurchasePaymentSchema = new Schema({
  paymentNumber: { type: String, required: true, unique: true },
  purchaseNumber: { type: String, required: true },
  supplierName: { type: String, required: true },
  date: { type: String, required: true },
  amount: { type: Number, required: true, default: 0 },
  paymentMethod: { type: String, enum: ['Bank Transfer', 'Cash', 'Cheque', 'UPI', 'Credit Card'], default: 'Bank Transfer' },
  referenceNumber: { type: String },
  status: { type: String, enum: ['Success', 'Pending', 'Failed'], default: 'Success' },
  notes: { type: String }
}, { timestamps: true });

export const PurchasePaymentModel = mongoose.models.PurchasePayment || mongoose.model('PurchasePayment', PurchasePaymentSchema);

// --- E-WAYBILL SCHEMA ---
const EWaybillSchema = new Schema({
  ewaybillNumber: { type: String, required: true, unique: true },
  invoiceNumber: { type: String, required: true },
  date: { type: String, required: true },
  validUntil: { type: String, required: true },
  customerName: { type: String, required: true },
  dispatchFrom: { type: String, default: 'Main Warehouse Central' },
  shipTo: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  transporterName: { type: String, default: 'FastTrack Logistics' },
  distanceKm: { type: Number, default: 25 },
  totalValue: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['Generated', 'In Transit', 'Delivered', 'Cancelled'], default: 'Generated' }
}, { timestamps: true });

export const EWaybillModel = mongoose.models.EWaybill || mongoose.model('EWaybill', EWaybillSchema);

// --- DELIVERY CHALLAN SCHEMA ---
const DeliveryChallanSchema = new Schema({
  challanNumber: { type: String, required: true, unique: true },
  invoiceNumber: { type: String, required: true },
  date: { type: String, required: true },
  customerName: { type: String, required: true },
  deliveryAddress: { type: String, required: true },
  driverName: { type: String, default: 'Logistics Fleet Driver' },
  vehicleNumber: { type: String, required: true },
  items: [{
    productName: { type: String, required: true },
    sku: { type: String },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, default: 'Pieces (pcs)' }
  }],
  status: { type: String, enum: ['Dispatched', 'Delivered', 'Returned', 'Draft'], default: 'Dispatched' },
  notes: { type: String }
}, { timestamps: true });

export const DeliveryChallanModel = mongoose.models.DeliveryChallan || mongoose.model('DeliveryChallan', DeliveryChallanSchema);

// --- SALES PAYMENT SCHEMA ---
const SalesPaymentSchema = new Schema({
  paymentNumber: { type: String, required: true, unique: true },
  invoiceNumber: { type: String, required: true },
  customerName: { type: String, required: true },
  date: { type: String, required: true },
  amount: { type: Number, required: true, default: 0 },
  paymentMethod: { type: String, enum: ['Cash', 'Bank Transfer', 'UPI', 'Credit Card', 'Cheque'], default: 'Cash' },
  referenceNumber: { type: String },
  status: { type: String, enum: ['Success', 'Pending', 'Refunded'], default: 'Success' },
  notes: { type: String }
}, { timestamps: true });

export const SalesPaymentModel = mongoose.models.SalesPayment || mongoose.model('SalesPayment', SalesPaymentSchema);
