'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  IndianRupee, 
  Search, 
  Calendar, 
  Filter, 
  Download, 
  Plus, 
  Clock,
  AlertCircle,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function FeesPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalExpected: 12500,
    totalCollected: 8500,
    totalPending: 4000,
  });

  useEffect(() => {
    async function fetchFees() {
      // In a real app, this would be a complex query joining students, batches, and fee_payments
      // For demo, I'll mock some data but structured in a way that shows the UI potential
      setLoading(false);
    }
    fetchFees();
  }, []);

  const mockedStudents = [
    { id: '1', name: 'Rahul Sharma', batch: 'Class 10 Math', amount: 500, status: 'PAID', date: '2026-04-10' },
    { id: '2', name: 'Priya Verma', batch: 'Class 10 Math', amount: 500, status: 'PENDING', date: '-' },
    { id: '3', name: 'Amit Singh', batch: 'JEE Main Batch', amount: 1500, status: 'PAID', date: '2026-04-05' },
    { id: '4', name: 'Sneha Patel', batch: 'Class 9 Science', amount: 400, status: 'OVERDUE', date: '-' },
    { id: '5', name: 'Vikram Das', batch: 'Class 12 Physics', amount: 800, status: 'PARTIAL', date: '2026-04-15' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fee Management</h2>
          <p className="text-muted-foreground">Track collections, send reminders, and manage payments.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline"><Download className="mr-2" size={18} /> Export</Button>
          <Button><Plus className="mr-2" size={18} /> Record Payment</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Expected Revenue', value: summary.totalExpected, icon: IndianRupee, color: 'text-primary' },
          { label: 'Collected So Far', value: summary.totalCollected, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Remaining Balance', value: summary.totalPending, icon: Clock, color: 'text-orange-600' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-background">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                  <h3 className={cn("text-3xl font-bold mt-1 tracking-tight", stat.color)}>{formatCurrency(stat.value)}</h3>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50">
                  <stat.icon size={24} className={stat.color} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payments Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex-1 max-w-sm relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input placeholder="Search student name..." className="pl-10" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon"><Calendar size={20} /></Button>
              <Button variant="ghost" size="icon"><Filter size={20} /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="pb-3 text-left">Student / Batch</th>
                    <th className="pb-3 text-center">Amount</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-center">Paid Date</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {mockedStudents.map((s) => (
                    <tr key={s.id} className="group hover:bg-secondary/20 transition-colors">
                      <td className="py-4">
                        <div>
                          <p className="font-bold text-sm tracking-tight">{s.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{s.batch}</p>
                        </div>
                      </td>
                      <td className="py-4 text-center font-mono font-bold text-sm italic">
                        {formatCurrency(s.amount)}
                      </td>
                      <td className="py-4 text-center">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                          s.status === 'PAID' && "bg-green-100 text-green-700",
                          s.status === 'PENDING' && "bg-orange-100 text-orange-700",
                          s.status === 'OVERDUE' && "bg-red-100 text-red-700",
                          s.status === 'PARTIAL' && "bg-blue-100 text-blue-700",
                        )}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-4 text-center text-xs text-muted-foreground font-mono">
                        {s.date === '-' ? '-' : formatDate(s.date)}
                      </td>
                      <td className="py-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical size={16} /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          <Card className="border-l-4 border-l-red-500 bg-red-50/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle size={18} />
                <CardTitle className="text-lg">Critical Overdue</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                The following students have not paid for over 15 days past the due date.
              </p>
              <div className="space-y-3">
                {[
                  { name: 'Sneha Patel', amount: 400, days: 18 },
                  { name: 'Rohan Gupta', amount: 500, days: 16 }
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white border border-red-100">
                    <div>
                      <p className="text-sm font-bold">{s.name}</p>
                      <p className="text-[10px] text-red-500 font-bold uppercase">{s.days} days overdue</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 text-[10px] border-red-200 text-red-600 font-bold uppercase">
                      Notify
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fee Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/20 transition-colors cursor-pointer">
                <div>
                  <p className="text-sm font-semibold">Automatic Generation</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Create bills on 1st of month</p>
                </div>
                <div className="w-10 h-5 bg-primary rounded-full relative">
                  <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/20 transition-colors cursor-pointer">
                <div>
                  <p className="text-sm font-semibold">Late Fee Policy</p>
                  <p className="text-[10px] text-muted-foreground uppercase">₹50 after 10th of month</p>
                </div>
                <div className="w-10 h-5 bg-border rounded-full relative">
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
