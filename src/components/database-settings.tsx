

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { PlusCircle, Edit, Trash2, Lock, RotateCw } from 'lucide-react';
import { useJournalStore } from '@/hooks/use-journal-store';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogAction } from './ui/alert-dialog';
import { quotes, tips, advice, defaultNotes } from '@/lib/data';

type EditableItem = {
    id?: string;
    [key: string]: any;
};

const PasswordDialog = ({ open, onOpenChange, onConfirm }: { open: boolean, onOpenChange: (open: boolean) => void, onConfirm: () => void }) => {
    const [password, setPassword] = useState('');
    const { toast } = useToast();

    const handleConfirm = () => {
        if (password === 'MDTedit') {
            onConfirm();
            onOpenChange(false);
            setPassword('');
        } else {
            toast({ title: "Incorrect Password", variant: "destructive" });
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Admin Authentication</AlertDialogTitle>
                    <AlertDialogDescription>
                        This is a default item. Please enter the admin password to edit.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-2">
                    <Input 
                        type="password"
                        placeholder="Enter password to confirm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setPassword('')}>Cancel</AlertDialogCancel>
                    <Button onClick={handleConfirm}>Confirm</Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};


const EditableItemCard = ({ 
    item, 
    fields, 
    onSave, 
    onDelete 
}: { 
    item: EditableItem; 
    fields: { key: string; label: string; type?: 'textarea' }[]; 
    onSave: (item: EditableItem) => void; 
    onDelete: (id: string) => void;
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editState, setEditState] = useState(item);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    
    const isDefaultItem = !item.id;

    const handleSave = () => {
        onSave(editState);
        setIsEditing(false);
    }

    const handleEditClick = () => {
        if (isDefaultItem) {
            setIsPasswordDialogOpen(true);
        } else {
            setIsEditing(true);
        }
    };

    const handlePasswordConfirm = () => {
        setIsEditing(true);
    };

    return (
        <>
            <div className="p-2 border rounded-md bg-muted/50 flex flex-col gap-2 text-sm">
                {isEditing ? (
                    <div className="flex-1 space-y-2">
                        {fields.map(field => (
                             field.type === 'textarea' ? (
                                <Textarea key={field.key} value={editState[field.key]} onChange={e => setEditState({...editState, [field.key]: e.target.value})} placeholder={field.label} className="text-xs" rows={3}/>
                             ) : (
                                <Input key={field.key} value={editState[field.key]} onChange={e => setEditState({...editState, [field.key]: e.target.value})} placeholder={field.label} className="h-7 text-xs"/>
                             )
                        ))}
                    </div>
                ) : (
                     <div className="flex-1 space-y-1">
                         {fields.map(field => (
                            <div key={field.key} className="text-xs">
                                <span className="font-semibold text-muted-foreground">{field.label}: </span>
                                <span className="line-clamp-2">{item[field.key]}</span>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex gap-1 self-end">
                    {isEditing ? (
                        <Button size="xs" onClick={handleSave}>Save</Button>
                    ) : (
                        <Button variant="ghost" size="xs" onClick={handleEditClick}><Edit className="mr-1 h-3 w-3"/> Edit</Button>
                    )}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="xs" className="text-destructive" disabled={isDefaultItem}><Trash2 className="h-3 w-3"/></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will permanently delete this item.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(item.id || '')}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
            <PasswordDialog
                open={isPasswordDialogOpen}
                onOpenChange={setIsPasswordDialogOpen}
                onConfirm={handlePasswordConfirm}
            />
        </>
    )
}

const DataSection = <T extends EditableItem>({ 
    title,
    description,
    items,
    fields,
    onItemsChange,
    onReset
} : {
    title: string;
    description: string;
    items: T[];
    fields: { key: string; label: string; type?: 'textarea' }[];
    onItemsChange: (newItems: T[]) => void;
    onReset: () => void;
}) => {
    const [newItem, setNewItem] = useState<Partial<T>>({});

    const handleAddItem = () => {
        const hasAllFields = fields.every(field => newItem[field.key]);
        if (!hasAllFields) {
            alert('All fields are required.');
            return;
        }
        const fullNewItem = { ...newItem, id: crypto.randomUUID() } as T;
        onItemsChange([...items, fullNewItem]);
        setNewItem({});
    }

    const handleSaveItem = (updatedItem: T) => {
        onItemsChange(items.map(item => item.id === updatedItem.id ? updatedItem : item));
    }

    const handleDeleteItem = (id: string) => {
        onItemsChange(items.filter(item => item.id !== id));
    }

    return (
        <Card className="glassmorphic">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="outline" size="sm"><RotateCw className="mr-2 h-4 w-4"/>Reset</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Reset {title}?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will reset the {title.toLowerCase()} to their original default values.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={onReset}>Reset</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-48 pr-4">
                    <div className="space-y-2">
                        {items.map((item, index) => (
                           <EditableItemCard key={item.id || index} item={item} fields={fields} onSave={handleSaveItem} onDelete={handleDeleteItem}/>
                        ))}
                    </div>
                </ScrollArea>
                <div className="mt-4 border-t pt-4 space-y-2">
                    <h4 className="font-semibold text-sm">Add New {title.slice(0, -1)}</h4>
                    {fields.map(field => (
                        field.type === 'textarea' ? (
                             <Textarea key={field.key} placeholder={`${field.label}...`} value={String(newItem[field.key] || '')} onChange={e => setNewItem({...newItem, [field.key]: e.target.value})} rows={3}/>
                        ) : (
                             <Input key={field.key} placeholder={`${field.label}...`} value={String(newItem[field.key] || '')} onChange={e => setNewItem({...newItem, [field.key]: e.target.value})}/>
                        )
                    ))}
                    <Button onClick={handleAddItem} size="sm">Add</Button>
                </div>
            </CardContent>
        </Card>
    )
}


const DatabaseSettings = () => {
  const { appSettings, updateAppSettings, resetDatabaseSettings, clearBackupFileHandle } = useJournalStore();
  const { toast } = useToast();
  
  const [editingPair, setEditingPair] = useState<{ id: string; pipSize: string; pipValue: string; spread: string; } | null>(null);
  const [newPair, setNewPair] = useState({ id: '', pipSize: '', pipValue: '', spread: '' });

  const handlePairSave = () => {
     if (editingPair) {
      if (!editingPair.id || !editingPair.pipSize || !editingPair.pipValue) {
        toast({ title: "Error", description: "Pair ID, Pip Size and Pip Value are required.", variant: "destructive"});
        return;
      }
      const updatedPairs = { ...appSettings.pairsConfig, [editingPair.id]: { pipSize: parseFloat(editingPair.pipSize), pipValue: parseFloat(editingPair.pipValue), spread: parseFloat(editingPair.spread || '0'), iconName: appSettings.pairsConfig[editingPair.id]?.iconName || 'Component' } };
      updateAppSettings({ pairsConfig: updatedPairs });
      setEditingPair(null);
    } else {
      if (!newPair.id || !newPair.pipSize || !newPair.pipValue) {
         toast({ title: "Error", description: "Pair ID, Pip Size and Pip Value are required.", variant: "destructive"});
        return;
      }
      const updatedPairs = { ...appSettings.pairsConfig, [newPair.id.toUpperCase()]: { pipSize: parseFloat(newPair.pipSize), pipValue: parseFloat(newPair.pipValue), spread: parseFloat(newPair.spread || '0'), iconName: 'Component' } };
      updateAppSettings({ pairsConfig: updatedPairs });
      setNewPair({ id: '', pipSize: '', pipValue: '', spread: '' });
    }
    toast({ title: "Success", description: "Pairs configuration updated."});
  };

  const handlePairDelete = (id: string) => {
    const newPairs = { ...appSettings.pairsConfig };
    delete newPairs[id];
    updateAppSettings({ pairsConfig: newPairs });
    toast({ title: "Success", description: `Pair ${id} removed.`});
  };
  
  const handleResetBackup = () => {
      clearBackupFileHandle();
      toast({ title: "Backup Location Reset", description: "You will be prompted to select a new backup location on the next save."});
  }
  
  if (!appSettings) {
      return null;
  }

  return (
    <div className="space-y-6">
      <Card className="glassmorphic">
        <CardHeader>
            <CardTitle className="text-lg">Automatic Local Backup</CardTitle>
            <CardDescription>Reset your saved auto-backup file location. The next time you create or import a journal, you will be prompted to select a new file for automatic backups.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button onClick={handleResetBackup}>Reset Auto-Backup Location</Button>
        </CardContent>
      </Card>
      
      <DataSection 
        title="Quotes"
        description="Manage the motivational quotes shown on the splash screen."
        items={appSettings.quotes || []}
        fields={[{key: 'quote', label: 'Quote', type: 'textarea'}, {key: 'author', label: 'Author'}]}
        onItemsChange={(newItems) => updateAppSettings({ quotes: newItems })}
        onReset={() => updateAppSettings({ quotes: quotes })}
      />
      <DataSection 
        title="Tips"
        description="Manage the helpful software tips shown in the header/footer."
        items={appSettings.tips || []}
        fields={[{key: 'text', label: 'Tip', type: 'textarea'}]}
        onItemsChange={(newItems) => updateAppSettings({ tips: newItems })}
        onReset={() => updateAppSettings({ tips: tips })}
      />
       <DataSection 
        title="Trading Advice"
        description="Manage the generic trading advice statements."
        items={appSettings.advice || []}
        fields={[{key: 'text', label: 'Advice', type: 'textarea'}]}
        onItemsChange={(newItems) => updateAppSettings({ advice: newItems })}
        onReset={() => updateAppSettings({ advice: advice })}
      />
      <DataSection 
        title="Default Notes"
        description="Manage the default note templates for new journals."
        items={appSettings.notes || []}
        fields={[{key: 'title', label: 'Title'}, {key: 'content', label: 'Content', type: 'textarea'}]}
        onItemsChange={(newItems) => updateAppSettings({ notes: newItems })}
        onReset={() => updateAppSettings({ notes: defaultNotes })}
      />
      
       <Card className="glassmorphic">
        <CardHeader>
             <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-lg">Pairs Database</CardTitle>
                    <CardDescription>Manage pair configurations for P/L and risk calculations.</CardDescription>
                </div>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="outline" size="sm"><RotateCw className="mr-2 h-4 w-4"/>Reset</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Reset Pairs Database?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will reset the pairs database to its original default values. Any custom pairs you've added will be lost.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => resetDatabaseSettings()}>Reset</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-48">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pair</TableHead>
                    <TableHead>Pip Size</TableHead>
                    <TableHead>Pip Value</TableHead>
                    <TableHead>Spread</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(appSettings.pairsConfig).map(([id, config]) => (
                    <TableRow key={id}>
                      {editingPair?.id === id && editingPair ? (
                        <>
                          <TableCell>{id}</TableCell>
                          <TableCell><Input value={editingPair.pipSize} onChange={e => setEditingPair({...editingPair, pipSize: e.target.value})} className="h-7 w-20 text-xs"/></TableCell>
                          <TableCell><Input value={editingPair.pipValue} onChange={e => setEditingPair({...editingPair, pipValue: e.target.value})} className="h-7 w-20 text-xs"/></TableCell>
                          <TableCell><Input value={editingPair.spread} onChange={e => setEditingPair({...editingPair, spread: e.target.value})} className="h-7 w-20 text-xs"/></TableCell>
                          <TableCell><Button size="sm" onClick={handlePairSave}>Save</Button></TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{id}</TableCell>
                          <TableCell>{config.pipSize}</TableCell>
                          <TableCell>{config.pipValue}</TableCell>
                          <TableCell>{config.spread}</TableCell>
                          <TableCell className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingPair({id, pipSize: String(config.pipSize), pipValue: String(config.pipValue), spread: String(config.spread || 0)})}><Edit className="h-3 w-3"/></Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3 w-3"/></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>This will delete the configuration for {id}.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handlePairDelete(id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <div className="mt-4 border-t pt-4 space-y-2">
                <h4 className="font-semibold text-sm">Add New Pair</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <Input placeholder="Pair (e.g. BTCUSD)" value={newPair.id} onChange={e => setNewPair({...newPair, id: e.target.value})} />
                    <Input placeholder="Pip Size" value={newPair.pipSize} onChange={e => setNewPair({...newPair, pipSize: e.target.value})} />
                    <Input placeholder="Pip Value" value={newPair.pipValue} onChange={e => setNewPair({...newPair, pipValue: e.target.value})} />
                    <Input placeholder="Spread" value={newPair.spread} onChange={e => setNewPair({...newPair, spread: e.target.value})} />
                    <Button onClick={handlePairSave}>Add Pair</Button>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseSettings;
