'use client';

import { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Trash2, 
  MoreVertical, 
  Download, 
  Plus, 
  Loader2,
  FileIcon,
  Video,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function MaterialsPage() {
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState<'ALL' | 'NOTES' | 'LECTURES'>('ALL');

  const mockedMaterials = [
    { id: '1', title: 'Calculus Cheat Sheet', type: 'NOTES', format: 'PDF', size: '1.2 MB', batch: 'Class 12', date: '2026-04-20', downloads: 15 },
    { id: '2', title: 'Quadratic Equations (Lec 1)', type: 'LECTURES', format: 'MP4', size: '124 MB', batch: 'Class 10', date: '2026-04-18', downloads: 8 },
    { id: '3', title: 'Organic Chemistry Basics', type: 'NOTES', format: 'PDF', size: '4.5 MB', batch: 'Class 11', date: '2026-04-15', downloads: 22 },
  ];

  const filtered = mockedMaterials.filter(m => activeType === 'ALL' || m.type === activeType);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Study Materials</h2>
          <p className="text-muted-foreground">Upload and manage PDFs, notes, and video lectures.</p>
        </div>
        <Button size="lg" className="rounded-full shadow-lg">
          <Plus className="mr-2" size={20} /> Upload New Material
        </Button>
      </div>

      {/* Tabs / Filters */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex bg-white rounded-xl border p-1 shadow-sm w-fit shrink-0">
          {[
            { id: 'ALL', label: 'All Files', icon: FileIcon },
            { id: 'NOTES', label: 'Notes / PDFs', icon: FileText },
            { id: 'LECTURES', label: 'Video Lectures', icon: Video },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeType === tab.id ? 'default' : 'ghost'}
              size="sm"
              className="rounded-lg"
              onClick={() => setActiveType(tab.id as any)}
            >
              <tab.icon size={16} className="mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>
        
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="Search your materials..." className="pl-10 h-11 rounded-xl shadow-sm" />
        </div>
        
        <Button variant="outline" className="h-11 rounded-xl shadow-sm">
          <Filter className="mr-2" size={18} /> Filter by Batch
        </Button>
      </div>

      {/* Material Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((material) => (
          <Card key={material.id} className="group hover:border-primary transition-all overflow-hidden flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center border transition-colors",
                  material.type === 'NOTES' ? "bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-600 group-hover:text-white" : "bg-purple-50 text-purple-600 border-purple-100 group-hover:bg-purple-600 group-hover:text-white"
                )}>
                  {material.type === 'NOTES' ? <FileText size={24} /> : <Video size={24} />}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical size={16} /></Button>
              </div>
              <CardTitle className="mt-4 text-lg font-bold tracking-tight truncate">{material.title}</CardTitle>
              <CardDescription className="uppercase text-[10px] font-black tracking-widest text-muted-foreground/60">
                {material.batch} • {material.format} • {material.size}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><Clock size={12} /> {formatDate(material.date)}</div>
                <div className="flex items-center gap-1"><Download size={12} /> {material.downloads} downloads</div>
              </div>
            </CardContent>
            <div className="p-4 border-t bg-secondary/5 group-hover:bg-secondary/10 transition-colors flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 h-9 rounded-lg">Share Link</Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-red-500 hover:bg-red-50">
                <Trash2 size={16} />
              </Button>
            </div>
          </Card>
        ))}
        
        {/* Upload Placeholder Card */}
        <button className="border-2 border-dashed rounded-xl group hover:border-primary hover:bg-primary/5 transition-all p-8 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
            <Upload size={28} />
          </div>
          <div>
            <p className="font-bold text-sm">Add Material</p>
            <p className="text-xs">PDFs, Docs, or Videos</p>
          </div>
        </button>
      </div>
    </div>
  );
}
