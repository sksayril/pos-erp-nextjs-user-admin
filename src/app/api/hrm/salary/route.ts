import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { SalarySheetModel, EmployeeModel } from '../../../../lib/models';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get('month');

    const currentMonth = monthParam || 'September 2026';
    let records = await SalarySheetModel.find(monthParam ? { month: monthParam } : {}).sort({ createdAt: -1 });

    // Auto-generate payroll records from active employees if none exist
    if (records.length === 0) {
      const employees = await EmployeeModel.find({ status: 'Active' });
      if (employees.length > 0) {
        const seedData = employees.map((emp, i) => {
          const basic = emp.salary || 35000;
          const allowance = Math.round(basic * 0.15);
          const deductions = Math.round(basic * 0.05);
          const tax = Math.round(basic * 0.08);
          const net = basic + allowance - deductions - tax;
          const isPaid = i % 2 === 0;

          return {
            payrollId: `PAY-202609-${100 + i}`,
            employeeId: emp.employeeId,
            employeeName: emp.name,
            department: emp.department,
            month: currentMonth,
            basicSalary: basic,
            allowance,
            deductions,
            tax,
            netSalary: net,
            paymentStatus: isPaid ? 'Paid' : 'Pending',
            paidDate: isPaid ? '2026-09-28' : undefined,
            paymentMethod: 'Bank Transfer',
            notes: 'Monthly standard salary payout'
          };
        });
        records = await SalarySheetModel.insertMany(seedData);
      }
    }

    return NextResponse.json(records);
  } catch (error: any) {
    console.error('HRM Salary GET Error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { employeeId, employeeName, department, month, basicSalary, allowance, deductions, tax, paymentMethod } = body;

    if (!employeeId || !basicSalary || !month) {
      return NextResponse.json({ error: 'Employee, Basic Salary, and Month are required' }, { status: 400 });
    }

    const basic = Number(basicSalary) || 0;
    const allow = Number(allowance) || 0;
    const deduct = Number(deductions) || 0;
    const tx = Number(tax) || 0;
    const netSalary = basic + allow - deduct - tx;

    const payrollId = `PAY-${Date.now().toString().slice(-6)}`;

    const newRecord = await SalarySheetModel.create({
      payrollId,
      employeeId,
      employeeName: employeeName || 'Employee',
      department: department || 'General',
      month,
      basicSalary: basic,
      allowance: allow,
      deductions: deduct,
      tax: tx,
      netSalary,
      paymentStatus: 'Pending',
      paymentMethod: paymentMethod || 'Bank Transfer',
      notes: body.notes || ''
    });

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error: any) {
    console.error('HRM Salary POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create payroll entry' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, payrollId, paymentStatus, paymentMethod, paidDate } = body;

    const updated = await SalarySheetModel.findOneAndUpdate(
      _id ? { _id } : { payrollId },
      {
        $set: {
          paymentStatus: paymentStatus || 'Paid',
          paymentMethod: paymentMethod || 'Bank Transfer',
          paidDate: paidDate || new Date().toISOString().split('T')[0]
        }
      },
      { new: true }
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('HRM Salary PUT Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update salary status' }, { status: 500 });
  }
}
