
'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const AddNewAnalysisOptionDialog = ({ 
    isOpen, 
    onClose, 
    onSave, 
    category 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (name: string, saveGlobally: boolean) => void; 
    category: string 
}) => {
    const [name, setName] = useState('');
    const [saveGlobally, setSaveGlobally] = useState(true);

    useEffect(() => {
        if(isOpen) {
            setName('');
            setSaveGlobally(true);
        }
    }, [isOpen]);

    const handleSave = () => {
        if (name.trim()) {
            onSave(name.trim(), saveGlobally);
            onClose();
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glassmorphic">
                <DialogHeader>
                    <DialogTitle>Add New Item to "{category}"</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-1">
                        <Label>New Option Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSave()}/>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="save-globally" checked={saveGlobally} onCheckedChange={setSaveGlobally} />
                        <Label htmlFor="save-globally">Save for future use in all strategies</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default AddNewAnalysisOptionDialog;
