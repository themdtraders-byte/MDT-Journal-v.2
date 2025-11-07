'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import type { MarketLink } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface MarketLinkEditorDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  link: MarketLink | null;
  onSave: (link: Omit<MarketLink, 'id'> | MarketLink) => void;
}

export default function MarketLinkEditorDialog({ isOpen, setIsOpen, link, onSave }: MarketLinkEditorDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (link) {
      setName(link.name);
      setDescription(link.description);
      setUrl(link.url);
    } else {
      setName('');
      setDescription('');
      setUrl('');
    }
  }, [link, isOpen]);

  const handleSave = () => {
    if (!name.trim() || !url.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a name and a URL for the link.',
        variant: 'destructive',
      });
      return;
    }

    try {
        new URL(url);
    } catch (_) {
        toast({
            title: 'Invalid URL',
            description: 'Please enter a valid URL (e.g., https://example.com).',
            variant: 'destructive',
        });
        return;
    }

    const linkData = { name, description, url };

    if (link) {
      onSave({ ...link, ...linkData });
    } else {
      onSave(linkData);
    }
    
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="glassmorphic sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{link ? 'Edit Link' : 'Create New Link'}</DialogTitle>
           <DialogDescription>
            Add a custom launcher card to your Market Hub.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSave}>Save Link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
