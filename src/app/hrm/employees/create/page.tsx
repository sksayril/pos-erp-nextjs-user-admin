'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageContainer } from '../../../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { useToastStore } from '../../../../lib/store';
import { 
  UserPlus, ArrowLeft, User, Mail, Phone, 
  Building2, Briefcase, DollarSign, Calendar, MapPin, 
  CreditCard, ShieldCheck, Check, Sparkles, AlertCircle 
} from 'lucide-react';

export default function AddEmployeePage() {
  const router = useRouter();
  const { addToast } = useToastStore();

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [error, setError] = useState('');

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Sales & Marketing');
  const [designation, setDesignation] = useState('Sales Representative');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [salary, setSalary] = useState('35000');
  const [salaryType, setSalaryType] = useState('Monthly');
  const [status, setStatus] = useState('Active');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [bankAccount, setBankAccount] = useState('');
  const [panGst, setPanGst] = useState('');

  // Load departments
  useEffect(() => {
    fetch('/api/hrm/departments')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDepartments(data);
          setDepartment(data[0].name);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Full name is required.'); return; }
    if (!email.trim()) { setError('Email address is required.'); return; }
    if (!phone.trim()) { setError('Phone number is required.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/hrm/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          department,
          designation,
          joinDate,
          salary: Number(salary) || 0,
          salaryType,
          status,
          address: address.trim() || undefined,
          emergencyContact: emergencyContact.trim() || undefined,
          bankName: bankName.trim() || undefined,
          bankAccount: bankAccount.trim() || undefined,
          panGst: panGst.trim() || undefined,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save employee');
      }

      addToast('success', 'Employee Created!', `${data.name} has been enrolled as ${data.employeeId} in MongoDB.`);
      router.push('/hrm/employees');
    } catch (err: any) {
      setError(err.message || 'Error saving employee.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <PageContainer>
        <div className="max-w-4xl mx-auto space-y-6 select-none">
          
          {/* Top Back Navigation */}
          <div className="flex items-center justify-between">
            <Link href="/hrm/employees" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Employee List</span>
            </Link>
            <div className="text-xs text-muted-foreground">
              Enterprise HRM Module
            </div>
          </div>

          <Card className="shadow-xl border-border/80">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-extrabold text-foreground">
                    Enroll New Employee
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Create employee profile, assign department, configure payroll salary and banking credentials.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. PERSONAL INFORMATION */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-1.5">
                    <User className="h-3.5 w-3.5" /> 1. Personal &amp; Contact Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(''); }}
                        placeholder="e.g. Aryan Sharma"
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Work Email Address *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        placeholder="e.g. aryan@business.com"
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Mobile Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); setError(''); }}
                        placeholder="+91 98765 43210"
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Emergency Contact Phone</label>
                      <input
                        type="tel"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="+91 91234 56789"
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Residential Address / City</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Sector 5, Salt Lake City, Kolkata, WB"
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                {/* 2. JOB & DEPARTMENT ASSIGNMENT */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-1.5">
                    <Briefcase className="h-3.5 w-3.5" /> 2. Job Role &amp; Designation
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Department</label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        {departments.length > 0 ? (
                          departments.map((dep) => (
                            <option key={dep._id || dep.departmentId} value={dep.name}>
                              {dep.name}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="Sales & Marketing">Sales &amp; Marketing</option>
                            <option value="Warehouse & Logistics">Warehouse &amp; Logistics</option>
                            <option value="Accounts & Finance">Accounts &amp; Finance</option>
                            <option value="Human Resources (HR)">Human Resources (HR)</option>
                            <option value="IT & Operations">IT &amp; Operations</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Job Designation</label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Cashier / Sales Lead"
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Joining Date</label>
                      <input
                        type="date"
                        value={joinDate}
                        onChange={(e) => setJoinDate(e.target.value)}
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. COMPENSATION & BANKING */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-1.5">
                    <DollarSign className="h-3.5 w-3.5" /> 3. Salary Structure &amp; Banking Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Basic Monthly Salary (₹) *</label>
                      <input
                        type="number"
                        required
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)}
                        placeholder="35000"
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Salary Type</label>
                      <select
                        value={salaryType}
                        onChange={(e) => setSalaryType(e.target.value)}
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <option value="Monthly">Monthly Fixed</option>
                        <option value="Hourly">Hourly Rate</option>
                        <option value="Weekly">Weekly Stipend</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Employment Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <option value="Active">Active (On Duty)</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Bank Name</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. HDFC Bank Ltd"
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Bank Account Number</label>
                      <input
                        type="text"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        placeholder="5010088776655"
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">PAN / Tax ID</label>
                      <input
                        type="text"
                        value={panGst}
                        onChange={(e) => setPanGst(e.target.value.toUpperCase())}
                        placeholder="ABCDE1234F"
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs uppercase font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Actions */}
                <div className="border-t border-border/60 pt-4 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/hrm/employees')}
                    className="h-11 px-5 rounded-xl font-bold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={loading}
                    className="h-11 px-6 rounded-xl font-extrabold gap-2 shadow-md hover:shadow-lg cursor-pointer"
                  >
                    {!loading && <Check className="h-4 w-4" />}
                    <span>Save &amp; Enroll Employee</span>
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>

        </div>
      </PageContainer>
    </AppShell>
  );
}