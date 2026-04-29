'use client';

import { useState } from 'react';
import { 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Download, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

export default function StudentFeesPage() {
  const payments = [
    { id: '1', month: 'April', year: 2026, amount: 500, status: 'PAID', date: '2026-04-05', method: 'UPI' },
    { id: '2', month: 'March', year: 2026, amount: 500, status: 'PAID', date: '2026-03-02', method: 'Cash' },
    { id: '3', month: 'February', year: 2026, amount: 500, status: 'PAID', date: '2026-02-08', method: 'UPI' },
    { id: '4', month: 'January', year: 2026, amount: 500, status: 'PAID', date: '2026-01-05', method: 'UPI' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Fee History</h2>
        <p className="text-muted-foreground">Detailed record of your payments and receipts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - History */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Click on a payment to download the receipt.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border bg-white group hover:border-primary transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-green-50 text-green-700 flex items-center justify-center font-bold border border-green-100">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm tracking-tight">{p.month} {p.year}</h4>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">{p.method} • {formatDate(p.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-black italic">{formatCurrency(p.amount)}</p>
                        <p className="text-[10px] text-green-600 font-bold uppercase">Success</p>
                      </div>
                      <Button variant="ghost" size="icon" className="group-hover:text-primary transition-colors">
                        <Download size={18} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Status/Action */}
        <div className="space-y-8">
          <Card className="border-none shadow-xl bg-primary text-primary-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
            <CardHeader>
              <CardTitle className="text-lg">Current Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <div>
                <p className="text-[10px] uppercase font-bold text-primary-foreground/60 mb-1">Billing Month</p>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold tracking-tight">May 2026</h3>
                  <span className="px-2 py-0.5 rounded bg-white text-primary text-[10px] font-bold uppercase">Upcoming</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-primary-foreground/60 mb-1">Amount Due</p>
                <h3 className="text-4xl font-black italic">{formatCurrency(500)}</h3>
              </div>
              <div className="space-y-2 pt-4 border-t border-white/20">
                <p className="text-xs font-medium text-white/80 flex items-center gap-2">
                  <Clock size={14} /> Due By: 10 May 2026
                </p>
                <p className="text-xs font-medium text-white/80 flex items-center gap-2">
                  <AlertCircle size={14} /> Late fee after: 15 May 2026
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-0 relative z-10">
              <Button size="lg" className="w-full bg-white text-primary hover:bg-white/90 font-bold group">
                Pay Now <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">UPI Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Scan and pay using any UPI app (PhonePe, GPay, Paytm). 
                Please send a screenshot of the payment to your teacher for verification.
              </p>
              <div className="p-4 rounded-xl bg-secondary/30 flex items-center justify-center border-2 border-dashed border-primary/20">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-24 h-24 bg-white border rounded-lg flex items-center justify-center text-muted-foreground italic text-[10px]">
                    QR CODE AREA
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">UPI: tution@bank</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
