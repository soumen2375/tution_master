import { useState, useCallback } from 'react';
import { Upload, File, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  accept?: string;
  maxMb?: number;
  onFile: (file: File) => void;
  label?: string;
  hint?: string;
}

export function FileUploader({ accept = '.pdf,.docx,.pptx,.jpg,.png', maxMb = 20, onFile, label, hint }: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    const maxBytes = maxMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File too large. Maximum size is ${maxMb}MB.`);
      return;
    }
    setError(null);
    setSelected(file);
    onFile(file);
  }, [maxMb, onFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-semibold">{label}</label>}

      <div
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer text-center',
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-secondary/20',
          selected && 'border-green-500 bg-green-50 dark:bg-green-950/20'
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept={accept}
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        {selected ? (
          <div className="flex items-center gap-4 justify-center">
            <CheckCircle2 size={32} className="text-green-600 shrink-0" />
            <div className="text-left">
              <p className="font-bold text-sm text-green-700 dark:text-green-300 truncate max-w-[200px]">{selected.name}</p>
              <p className="text-xs text-green-600">{(selected.size / 1024).toFixed(0)} KB</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto text-muted-foreground hover:text-red-500"
              onClick={(e) => { e.stopPropagation(); setSelected(null); }}
            >
              <X size={16} />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center">
              {dragOver ? <Upload size={28} className="text-primary animate-bounce" /> : <File size={28} className="text-muted-foreground" />}
            </div>
            <div>
              <p className="font-semibold text-sm">
                <span className="text-primary">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hint ?? `${accept} up to ${maxMb}MB`}
              </p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
