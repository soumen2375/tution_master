import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Users,
  MapPin,
  Globe,
  Calendar,
  IndianRupee,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function BatchesPage() {
  const [batches, setBatches] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBatches() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: teacher } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacher) {
        const { data } = await supabase
          .from('batches')
          .select('*, enrollments(count)')
          .eq('teacher_id', teacher.id)
          .order('created_at', { ascending: false });

        setBatches(data || []);
      }
      setLoading(false);
    }
    fetchBatches();
  }, []);

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    toast.success('Invite code copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredBatches = batches.filter(b =>
    (b.name as string).toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.subject as string).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Your Batches</h2>
          <p className="text-muted-foreground">Manage your classes and invitation codes.</p>
        </div>
        <Link to="/teacher/batches/new">
          <Button><Plus className="mr-2" size={18} /> Create New Batch</Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search batches or subjects..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline"><Filter className="mr-2" size={18} /> Filter</Button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground italic">Loading your batches...</div>
      ) : filteredBatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.map((batch) => (
            <Card key={batch.id as string} className="group hover:border-primary transition-colors overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold">{batch.name as string}</CardTitle>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">{batch.subject as string}</p>
                  </div>
                  <Button variant="ghost" size="icon"><MoreVertical size={18} /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users size={16} />
                    <span>{(batch.enrollments as { count: number }[])[0]?.count || 0} / {batch.max_students as number} Students</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {batch.type === 'OFFLINE' ? <MapPin size={16} /> : <Globe size={16} />}
                    <span className="capitalize">{(batch.type as string).toLowerCase()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar size={16} />
                    <span>Active</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <IndianRupee size={16} />
                    <span>₹{batch.monthly_fee as number} / mo</span>
                  </div>
                </div>

                <div className="p-3 bg-secondary/30 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Invite Code</p>
                    <p className="font-mono font-bold tracking-widest text-lg">{batch.invite_code as string}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyInviteCode(batch.invite_code as string)}
                    className="hover:bg-primary/10 hover:text-primary"
                  >
                    {copiedId === batch.invite_code ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link to={`/teacher/batches/${batch.id as string}`} className="w-full">
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    Manage Batch
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 py-20 text-center bg-secondary/5">
          <CardContent className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-2">
              <Calendar size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold">No batches found</h3>
              <p className="text-muted-foreground">Start by creating your first tuition batch.</p>
            </div>
            <Link to="/teacher/batches/new">
              <Button>Create Batch Now</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
