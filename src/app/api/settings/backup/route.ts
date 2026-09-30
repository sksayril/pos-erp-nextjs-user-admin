import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { 
  BackupHistoryModel, ProductModel, CustomerModel, 
  SaleModel, PurchaseModel, UserAccountModel, AccountModel, 
  AccountTransactionModel, JournalEntryModel, ExpenseModel 
} from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    const [
      productsCount,
      customersCount,
      salesCount,
      purchasesCount,
      usersCount,
      accountsCount,
      transactionsCount,
      history
    ] = await Promise.all([
      ProductModel.countDocuments(),
      CustomerModel.countDocuments(),
      SaleModel.countDocuments(),
      PurchaseModel.countDocuments(),
      UserAccountModel.countDocuments(),
      AccountModel.countDocuments(),
      AccountTransactionModel.countDocuments(),
      BackupHistoryModel.find().sort({ createdAt: -1 }).limit(10)
    ]);

    const totalRecords = productsCount + customersCount + salesCount + purchasesCount + usersCount + accountsCount + transactionsCount;
    const estimatedSizeMb = ((totalRecords * 1.5) / 1024).toFixed(2);

    return NextResponse.json({
      databaseStats: {
        totalRecords,
        estimatedSize: `${estimatedSizeMb} MB`,
        productsCount,
        customersCount,
        salesCount,
        purchasesCount,
        usersCount,
        accountsCount,
        transactionsCount
      },
      history
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const [
      products,
      customers,
      sales,
      purchases,
      users,
      accounts,
      transactions
    ] = await Promise.all([
      ProductModel.find(),
      CustomerModel.find(),
      SaleModel.find(),
      PurchaseModel.find(),
      UserAccountModel.find().select('-password'),
      AccountModel.find(),
      AccountTransactionModel.find()
    ]);

    const totalRecords = products.length + customers.length + sales.length + purchases.length + users.length + accounts.length + transactions.length;
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '2026.1-PRO-ERP',
      totalRecords,
      collections: {
        products,
        customers,
        sales,
        purchases,
        users,
        accounts,
        transactions
      }
    };

    const sizeInBytes = JSON.stringify(backupData).length;
    const sizeStr = `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;

    const newBackup = await BackupHistoryModel.create({
      backupId: `BKP-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      size: sizeStr,
      type: 'Manual Full Export',
      status: 'Success',
      recordsCount: totalRecords
    });

    return NextResponse.json({
      success: true,
      backup: newBackup,
      backupData
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
