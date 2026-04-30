import { useState, useEffect } from 'react';
import { Play, Clock, BookOpen, Search, Filter, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { getStudentLectures } from '@/lib/api/lectures';
import { toYoutubeEmbed } from '@/lib/api/lectures';
import type { VideoLecture } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function StudentLecturesPage() {
  const [lectures, setLectures] = useState<(VideoLecture & { batch?: { name: string; subject: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<VideoLecture | null>(null);

  useEffect(() => {
    getStudentLectures()
      .then(setLectures)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = lectures.filter(l =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.topic?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Video Lectures</h2>
        <p className="text-muted-foreground">Watch your teacher's recorded lessons</p>
      </div>

      {/* Active Video Player */}
      {active && (
        <div className="rounded-2xl overflow-hidden border shadow-2xl shadow-black/10"
          style={{ borderColor: 'var(--card-border)' }}>
          <div className="aspect-video bg-black">
            <iframe
              src={toYoutubeEmbed(active.video_url)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={active.title}
            />
          </div>
          <div className="p-5"
            style={{ backgroundColor: 'var(--card-bg)' }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">{active.title}</h3>
                {active.topic && <p className="text-sm text-muted-foreground mt-0.5">Topic: {active.topic}</p>}
                {active.description && <p className="text-sm text-muted-foreground mt-2">{active.description}</p>}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActive(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="Search lectures..." className="pl-10"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border overflow-hidden animate-pulse"
              style={{ borderColor: 'var(--card-border)' }}>
              <div className="aspect-video bg-secondary" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-secondary rounded w-3/4" />
                <div className="h-3 bg-secondary rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(lecture => (
            <button
              key={lecture.id}
              onClick={() => setActive(lecture)}
              className={cn(
                'group rounded-2xl border overflow-hidden text-left transition-all hover:shadow-xl hover:-translate-y-1 hover:border-primary/40',
                active?.id === lecture.id && 'border-primary ring-2 ring-primary/30'
              )}
              style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-slate-800 overflow-hidden">
                {lecture.thumbnail_url ? (
                  <img
                    src={lecture.thumbnail_url}
                    alt={lecture.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen size={40} className="text-slate-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play size={24} className="text-rose-600 ml-1" fill="currentColor" />
                  </div>
                </div>
                {lecture.duration_sec && (
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded">
                    {Math.floor(lecture.duration_sec / 60)}:{String(lecture.duration_sec % 60).padStart(2, '0')}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-sm leading-snug mb-1 line-clamp-2">{lecture.title}</h3>
                {lecture.topic && (
                  <p className="text-xs text-muted-foreground mb-2">{lecture.topic}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {(lecture.batch as { name: string } | undefined)?.name ?? 'Batch'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(lecture.created_at).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 py-20 text-center">
          <CardContent className="flex flex-col items-center gap-4">
            <Play size={48} className="text-muted-foreground opacity-30" />
            <div>
              <h3 className="text-xl font-bold">No lectures yet</h3>
              <p className="text-muted-foreground mt-1">Your teacher hasn't uploaded any video lectures yet.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
