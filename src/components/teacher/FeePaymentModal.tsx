import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { recordPayment } from '@/lib/api/fees';
import type { PaymentMethod, StudentProfile, Batch } from '@/lib/types';

interface FeePaymentModalProps {
  student: StudentProfile & { profile: { full_name: string } };
  batch: Batch;
  month: number;
  year: number;
  defaultAmount: number;
  onSuccess: () => void;
  onClose: () => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: '💵 Cash' },
  { value: 'UPI', label: '📱 UPI (PhonePe/GPay/Paytm)' },
  { value: 'BANK_TRANSFER', label: '🏦 Bank Transfer / NEFT' },
  { value: 'ONLINE', label: '💳 Online / Card' },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function FeePaymentModal({ student, batch, month, year, defaultAmount, onSuccess, onClose }: FeePaymentModalProps) {
  const [form, setForm] = useState({
    amount: String(defaultAmount),
    payment_method: 'CASH' as PaymentMethod,
    remark: '',
    month: month,
    year: year,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      await recordPayment({
        student_id: student.id,
        batch_id: batch.id,
        month: form.month,
        year: form.year,
        amount: Number(form.amount),
        payment_method: form.payment_method,
        remark: form.remark || undefined,
      });
      toast.success(`Payment of ₹${form.amount} recorded for ${student.profile.full_name}`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-5"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Record Fee Payment</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {student.profile.full_name} • {batch.name}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Month + Year */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Month</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.month}
                onChange={e => setForm(f => ({ ...f, month: Number(e.target.value) }))}
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Year</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.year}
                onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Amount (₹) *</label>
            <div className="relative">
              <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                className="pl-9"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required
                min={1}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, payment_method: m.value }))}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all text-left ${
                    form.payment_method === m.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Remark */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Remark (optional)</label>
            <Input
              placeholder="Any notes about this payment..."
              value={form.remark}
              onChange={e => setForm(f => ({ ...f, remark: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              Record Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
