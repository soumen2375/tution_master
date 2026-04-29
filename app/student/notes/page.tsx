'use client';

import { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  BookOpen, 
  Clock,
  Video,
  FileIcon,
  ExternalLink,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn, formatDate } from '@/lib/utils';

export default function StudentNotesPage() {
  const [activeType, setActiveType] = useState<'ALL' | 'NOTES' | 'LECTURES'>('ALL');

  const notes = [
    { id: '1', title: 'Trigonometry Formula Sheet', batch: 'Class 10 Math', type: 'NOTES', size: '1.2 MB', date: 'Yesterday' },
    { id: '2', title: 'Physics Numerical - Chapter 5', batch: 'Class 10 Science', type: 'NOTES', size: '3.4 MB', date: '3 days ago' },
    { id: '3', title: 'Quadratic Equations Explanation', batch: 'Class 10 Math', type: 'LECTURES', size: '45 MB', date: '1 week ago' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Study Materials</h2>
        <p className="text-muted-foreground">Your centralized library of notes and lectures from all your teachers.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="Search materials..." className="pl-10 h-12 rounded-xl" />
        </div>
        <div className="flex bg-white rounded-xl border p-1 shadow-sm shrink-0">
          {[
            { id: 'ALL', label: 'All', icon: FileIcon },
            { id: 'NOTES', label: 'Notes', icon: FileText },
            { id: 'LECTURES', label: 'Videos', icon: Video },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeType === tab.id ? 'default' : 'ghost'}
              size="sm"
              className="rounded-lg h-10"
              onClick={() => setActiveType(tab.id as any)}
            >
              <tab.icon size={16} className="mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.filter(n => activeType === 'ALL' || n.type === activeType).map((note) => (
          <Card key={note.id} className="group hover:border-primary transition-all overflow-hidden border-2 shadow-sm flex flex-col">
            <CardHeader className="relative pb-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center border border-primary/10 shadow-inner group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300",
                note.type === 'NOTES' ? "bg-amber-50 text-amber-600" : "bg-purple-50 text-purple-600"
              )}>
                {note.type === 'NOTES' ? <FileText size={24} /> : <Video size={24} />}
              </div>
              <div className="mt-4">
                <CardTitle className="text-lg font-bold truncate leading-tight">{note.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 tracking-wider">
                    <Tag size={10} /> {note.batch}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pb-6">
              <div className="flex flex-col gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Clock size={14} /> Uploaded {note.date}</div>
                <div className="flex items-center gap-2"><BookOpen size={14} /> {note.size} • PDF Format</div>
              </div>
            </CardContent>
            <CardFooter className="p-0 border-t bg-secondary/10 flex divide-x">
              <Button variant="ghost" className="flex-1 h-12 rounded-none hover:bg-primary/10 hover:text-primary font-bold text-xs uppercase tracking-widest gap-2">
                <Download size={16} /> Download
              </Button>
              <Button variant="ghost" className="flex-1 h-12 rounded-none hover:bg-primary/10 hover:text-primary font-bold text-xs uppercase tracking-widest gap-2">
                <ExternalLink size={16} /> Preview
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Empty State Illustration */}
      {notes.length === 0 && (
        <div className="py-24 text-center">
          <BookOpen className="mx-auto text-muted-foreground mb-4 opacity-20" size={64} />
          <h3 className="text-xl font-bold">Your library is empty</h3>
          <p className="text-muted-foreground mt-2">Study materials shared by your teachers will appear here.</p>
        </div>
      )}
    </div>
  );
}
