import { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InviteCodeDisplayProps {
  code: string;
  batchName?: string;
  compact?: boolean;
}

export function InviteCodeDisplay({ code, batchName, compact = false }: InviteCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    const text = `Join my ${batchName ? `"${batchName}"` : ''} batch on TutionHut using code: ${code}`;
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Share text copied!');
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-secondary/30">
        <span className="font-mono font-bold tracking-widest text-base text-primary">{code}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-primary" onClick={copy}>
          {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Batch Invite Code</p>

      <div className="flex items-center gap-4">
        <div className="flex-1 flex items-center justify-center">
          {code.split('').map((char, i) => (
            <div key={i} className={cn(
              'w-10 h-12 border-2 rounded-xl flex items-center justify-center',
              'font-mono font-black text-xl text-primary border-primary/30 bg-white dark:bg-slate-900',
              'mx-0.5 shadow-sm'
            )}>
              {char}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 h-9" onClick={copy}>
          {copied ? <Check size={16} className="mr-2 text-green-600" /> : <Copy size={16} className="mr-2" />}
          {copied ? 'Copied!' : 'Copy Code'}
        </Button>
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={share}>
          <Share2 size={16} />
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Share this code with students to let them join this batch
      </p>
    </div>
  );
}
