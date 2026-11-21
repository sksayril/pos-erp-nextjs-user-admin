import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import {
  ProductModel,
  CustomerModel,
  SaleModel,
  PurchaseModel,
  SupplierModel,
  ExpenseModel,
  QuotationModel,
  TransferModel,
  SalesReturnModel,
  PurchaseReturnModel,
  CreditNoteModel,
  DebitNoteModel,
  WarehouseStockModel,
  EmployeeModel,
  AttendanceModel,
  SalarySheetModel,
  LeaveRequestModel,
  JournalEntryModel,
  AccountTransactionModel,
  VariantModel,
  PriceListModel,
  BatchModel,
  StockAdjustmentModel,
  PurchaseOrderModel,
  PurchasePaymentModel,
  EWaybillModel,
  DeliveryChallanModel,
  SalesPaymentModel,
  UserAccountModel,
  SystemSettingsModel
} from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    const sys = await SystemSettingsModel.findOne();
    return NextResponse.json({
      dummyDataCleared: Boolean(sys?.dummyDataCleared),
      clearedAt: sys?.dummyDataClearedAt || null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to check status' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const userEmail = (body.userEmail || '').trim().toLowerCase();

    // 1. Mark system flag: dummyDataCleared = true
    await SystemSettingsModel.findOneAndUpdate(
      {},
      { dummyDataCleared: true, dummyDataClearedAt: new Date() },
      { upsert: true, new: true }
    );

    // 2. Clear dummy catalog, stock, and inventory
    await Promise.allSettled([
      ProductModel.deleteMany({}),
      StockAdjustmentModel.deleteMany({}),
      BatchModel.deleteMany({}),
      VariantModel.deleteMany({}),
      PriceListModel.deleteMany({}),
      WarehouseStockModel.deleteMany({}),
    ]);

    // 3. Clear sales transactions, invoices, deliveries, and challans
    await Promise.allSettled([
      SaleModel.deleteMany({}),
      SalesPaymentModel.deleteMany({}),
      DeliveryChallanModel.deleteMany({}),
      EWaybillModel.deleteMany({}),
      SalesReturnModel.deleteMany({}),
    ]);

    // 4. Clear purchases, orders, payments, and returns
    await Promise.allSettled([
      PurchaseModel.deleteMany({}),
      PurchaseOrderModel.deleteMany({}),
      PurchasePaymentModel.deleteMany({}),
      PurchaseReturnModel.deleteMany({}),
    ]);

    // 5. Clear expenses & quotations & stock transfers
    await Promise.allSettled([
      ExpenseModel.deleteMany({}),
      QuotationModel.deleteMany({}),
      TransferModel.deleteMany({}),
    ]);

    // 6. Reset Customers: Clear dummy customers, preserve or re-create default Walk-In customer
    await CustomerModel.deleteMany({});
    await CustomerModel.create({
      name: 'Walk-In Customer',
      phone: '0000000000',
      email: 'walkin@erp.com',
      address: 'Main Store Counter',
      creditLimit: 0,
      outstandingBalance: 0,
      status: 'Active'
    });

    // 7. Clear dummy suppliers
    await SupplierModel.deleteMany({});

    // 8. Clear financial notes & ledgers
    await Promise.allSettled([
      CreditNoteModel.deleteMany({}),
      DebitNoteModel.deleteMany({}),
      JournalEntryModel.deleteMany({}),
      AccountTransactionModel.deleteMany({}),
    ]);

    // 9. Clear dummy HRM records
    await Promise.allSettled([
      AttendanceModel.deleteMany({}),
      LeaveRequestModel.deleteMany({}),
      SalarySheetModel.deleteMany({}),
      EmployeeModel.deleteMany({}),
    ]);

    // 10. Clear demo mock users, strictly PRESERVING the current user and active Super Admin
    const demoUserEmails = [
      'aryan@erp.com', 'priya@erp.com', 'rahul@erp.com', 'sneha@erp.com',
      'karan@erp.com', 'ananya@erp.com', 'vikram@erp.com', 'pooja@erp.com',
      'rohan@erp.com', 'meena@erp.com'
    ];

    if (userEmail) {
      // Don't delete if current user is using one of the demo emails
      const emailsToDelete = demoUserEmails.filter(e => e !== userEmail);
      await UserAccountModel.deleteMany({ email: { $in: emailsToDelete } });
    } else {
      await UserAccountModel.deleteMany({ email: { $in: demoUserEmails } });
    }

    return NextResponse.json({
      success: true,
      message: 'All dummy and demo data cleared successfully. System is now fresh and ready for production.',
      clearedAt: new Date()
    });
  } catch (error: any) {
    console.error('Clear Dummy Data Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to clear dummy data' }, { status: 500 });
  }
}
