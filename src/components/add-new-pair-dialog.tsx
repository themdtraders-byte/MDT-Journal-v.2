
'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AddNewPairDialog = ({
    isOpen,
    onClose,
    onSave,
    pairName,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, config: { pipSize: string; pipValue: string; spread: string }) => void;
    pairName: string;
}) => {
    const [pipSize, setPipSize] = useState('');
    const [pipValue, setPipValue] = useState('');
    const [spread, setSpread] = useState('');

    const handleSave = () => {
        if (pipSize && pipValue) {
            onSave(pairName, { pipSize, pipValue, spread });
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glassmorphic">
                <DialogHeader>
                    <DialogTitle>Add New Pair: {pairName}</DialogTitle>
                    <DialogDescription>
                        Please provide the configuration for this new pair for accurate calculations.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>Pip Size</Label>
                            <Input value={pipSize} onChange={(e) => setPipSize(e.target.value)} placeholder="e.g., 0.0001" />
                        </div>
                        <div>
                            <Label>Pip Value ($)</Label>
                            <Input value={pipValue} onChange={(e) => setPipValue(e.target.value)} placeholder="e.g., 10" />
                        </div>
                        <div>
                            <Label>Spread (pips)</Label>
                            <Input value={spread} onChange={(e) => setSpread(e.target.value)} placeholder="e.g., 1.5" />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Pair</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AddNewPairDialog;
