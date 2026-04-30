import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type { ScheduleSlot } from '@/lib/types';
import { cn } from '@/lib/utils';

const DAYS: ScheduleSlot['day'][] = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

interface ScheduleBuilderProps {
  value: ScheduleSlot[];
  onChange: (slots: ScheduleSlot[]) => void;
}

export function ScheduleBuilder({ value, onChange }: ScheduleBuilderProps) {
  const add = () => onChange([...value, { day: 'Monday', startTime: '08:00', endTime: '09:30' }]);

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  const update = (i: number, field: keyof ScheduleSlot, val: string) => {
    const updated = [...value];
    updated[i] = { ...updated[i], [field]: val } as ScheduleSlot;
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {value.map((slot, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border bg-secondary/10 group">
          <select
            className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={slot.day}
            onChange={e => update(i, 'day', e.target.value)}
          >
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <div className="flex items-center gap-1.5 shrink-0">
            <Input
              type="time"
              className="w-28 h-9"
              value={slot.startTime}
              onChange={e => update(i, 'startTime', e.target.value)}
            />
            <span className="text-muted-foreground text-sm">–</span>
            <Input
              type="time"
              className="w-28 h-9"
              value={slot.endTime}
              onChange={e => update(i, 'endTime', e.target.value)}
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all shrink-0"
            onClick={() => remove(i)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" className="w-full" onClick={add}>
        <Plus size={16} className="mr-2" /> Add Schedule Slot
      </Button>
    </div>
  );
}
