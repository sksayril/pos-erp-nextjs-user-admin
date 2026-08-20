import mongoose, { Schema } from 'mongoose';
import crypto from 'crypto';

// --- PRODUCT SCHEMA ---
const ProductSchema = new Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  barcode: { type: String, required: true },
  categoryId: { type: String, required: true },
  brandId: { type: String },
  unitId: { type: String },
  purchasePrice: { type: Number, required: true, default: 0 },
  sellingPrice: { type: Number, required: true, default: 0 },
  wholesalePrice: { type: Number, default: 0 },
  mrp: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  taxType: { type: String, enum: ['Exclusive', 'Inclusive'], default: 'Exclusive' },
  openingStock: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 },
  maxStock: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  image: { type: String }, // AWS S3 Image URL
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
export const ExpenseModel = mongoose.models.Expense || mongoose.model('Expense', new Schema({
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  reference: { type: String },
  description: { type: String }
}, { timestamps: true }));

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

// --- USER ACCOUNT SCHEMA (for login authentication) ---
const UserAccountSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, default: 'Cashier' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  warehouseId: { type: String, default: 'wh-1' },
  phone: { type: String },
  avatar: { type: String },
  lastLogin: { type: Date },
  createdBy: { type: String }, // ID of the superadmin who created this user
}, { timestamps: true });

// Helper static methods for password hashing (using Node crypto — no extra deps)
UserAccountSchema.statics.hashPassword = function(plain: string): string {
  return crypto.createHash('sha256').update(plain + 'erp_salt_2026').digest('hex');
};
UserAccountSchema.statics.verifyPassword = function(plain: string, hash: string): boolean {
  const computed = crypto.createHash('sha256').update(plain + 'erp_salt_2026').digest('hex');
  return computed === hash;
};

export const UserAccountModel = mongoose.models.UserAccount || mongoose.model('UserAccount', UserAccountSchema);

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
export const CreditNoteModel = mongoose.models.CreditNote || mongoose.model('CreditNote', CreditNoteSchema);
export const DebitNoteModel = mongoose.models.DebitNote || mongoose.model('DebitNote', DebitNoteSchema);
export const WarehouseModel = mongoose.models.Warehouse || mongoose.model('Warehouse', WarehouseSchema);
export const WarehouseStockModel = mongoose.models.WarehouseStock || mongoose.model('WarehouseStock', WarehouseStockSchema);
