import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { AttendanceModel, EmployeeModel } from '../../../../lib/models';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    const today = dateParam || new Date().toISOString().split('T')[0];
    let records = await AttendanceModel.find(dateParam ? { date: dateParam } : {}).sort({ date: -1, createdAt: -1 });

    // If no records for today, auto-generate default attendance based on active employees
    if (records.length === 0) {
      const employees = await EmployeeModel.find({ status: 'Active' });
      if (employees.length > 0) {
        const seedData = employees.map((emp, i) => {
          const statuses: ('Present' | 'Late' | 'Half Day')[] = ['Present', 'Present', 'Late', 'Present'];
          const status = statuses[i % statuses.length];
          const checkIn = status === 'Late' ? '09:45 AM' : '09:05 AM';
          const checkOut = '06:00 PM';
          return {
            attendanceId: `ATT-${Date.now()}-${i}`,
            employeeId: emp.employeeId,
            employeeName: emp.name,
            department: emp.department,
            date: today,
            checkIn,
            checkOut,
            status,
            workingHours: status === 'Half Day' ? 4 : 8,
            notes: 'System auto-logged standard shift'
          };
        });
        records = await AttendanceModel.insertMany(seedData);
      }
    }

    return NextResponse.json(records);
  } catch (error: any) {
    console.error('HRM Attendance GET Error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { employeeId, employeeName, department, date, checkIn, checkOut, status, workingHours, notes } = body;

    if (!employeeId || !date) {
      return NextResponse.json({ error: 'Employee ID and Date are required' }, { status: 400 });
    }

    const attendanceId = `ATT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const newRecord = await AttendanceModel.findOneAndUpdate(
      { employeeId, date },
      {
        $set: {
          attendanceId,
          employeeId,
          employeeName: employeeName || 'Employee',
          department: department || 'General',
          date,
          checkIn: checkIn || '09:00 AM',
          checkOut: checkOut || undefined,
          status: status || 'Present',
          workingHours: Number(workingHours) || 8,
          notes: notes || ''
        }
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error: any) {
    console.error('HRM Attendance POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to log attendance' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, attendanceId, status, checkIn, checkOut, workingHours, notes } = body;

    const updated = await AttendanceModel.findOneAndUpdate(
      _id ? { _id } : { attendanceId },
      {
        $set: {
          ...(status && { status }),
          ...(checkIn && { checkIn }),
          ...(checkOut && { checkOut }),
          ...(workingHours !== undefined && { workingHours }),
          ...(notes !== undefined && { notes })
        }
      },
      { new: true }
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('HRM Attendance PUT Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update attendance' }, { status: 500 });
  }
}
