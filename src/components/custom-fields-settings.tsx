
'use client';

import { useState } from 'react';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { PlusCircle, Trash2, Edit } from 'lucide-react';
import type { CustomField } from '@/types';
import CustomFieldEditorDialog from './custom-field-editor-dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';

const CustomFieldsSettings = () => {
    const { appSettings, updateAppSettings } = useJournalStore();
    const { toast } = useToast();
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingField, setEditingField] = useState<CustomField | null>(null);

    const customFields = appSettings.customFields || [];
    
    const handleCreateNew = () => {
        setEditingField(null);
        setIsEditorOpen(true);
    };

    const handleEditField = (field: CustomField) => {
        setEditingField(field);
        setIsEditorOpen(true);
    };

    const handleDeleteField = (id: string) => {
        updateAppSettings({ customFields: customFields.filter(f => f.id !== id) });
        toast({ title: 'Field Deleted' });
    };

    const handleSave = (fieldData: CustomField) => {
        const isNew = !customFields.some(f => f.id === fieldData.id);
        let updatedFields;
        if (isNew) {
            updatedFields = [...customFields, fieldData];
        } else {
            updatedFields = customFields.map(f => f.id === fieldData.id ? fieldData : f);
        }
        updateAppSettings({ customFields: updatedFields });
    };

    return (
        <div className="space-y-6">
             <Card className="glassmorphic">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Manage Custom Fields</CardTitle>
                        <CardDescription>Create and manage your own data points to track for each trade.</CardDescription>
                    </div>
                    <Button onClick={handleCreateNew}>
                        <PlusCircle className="mr-2 h-4 w-4"/>Add Custom Field
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {customFields.length > 0 ? (
                        <div className="space-y-2">
                            {customFields.map(field => (
                                <Card key={field.id} className="p-3 bg-muted/50 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{field.title}</p>
                                        <Badge variant="outline" className="text-xs">{field.type}</Badge>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditField(field)}><Edit className="h-3 w-3"/></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteField(field.id)}><Trash2 className="h-3 w-3"/></Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">No custom fields created yet.</p>
                        </div>
                    )}
                </CardContent>
             </Card>
             {isEditorOpen && (
                 <CustomFieldEditorDialog
                    isOpen={isEditorOpen}
                    onClose={() => setIsEditorOpen(false)}
                    initialField={editingField}
                    onSave={handleSave}
                 />
             )}
        </div>
    )
}

export default CustomFieldsSettings;
