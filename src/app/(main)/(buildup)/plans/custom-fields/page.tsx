
'use client';

import { useState } from 'react';
import CustomFieldsSettings from "@/components/custom-fields-settings";
import ValidationListSettings from '@/components/validation-list-settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, CheckSquare, Tag } from 'lucide-react';

const CustomFieldsPage = () => {
    return (
         <div className="h-full">
            <Tabs defaultValue="custom-fields" orientation="vertical" className="h-full grid grid-cols-[180px_1fr] gap-6">
                <TabsList className="flex-col justify-start items-stretch h-auto">
                    <TabsTrigger value="custom-fields" className="justify-start"><List className="mr-2 h-4 w-4"/> Custom Fields</TabsTrigger>
                    <TabsTrigger value="validation-lists" className="justify-start"><CheckSquare className="mr-2 h-4 w-4"/> Validation Lists</TabsTrigger>
                </TabsList>
                <div className="overflow-y-auto">
                    <TabsContent value="custom-fields" className="mt-0">
                        <CustomFieldsSettings />
                    </TabsContent>
                    <TabsContent value="validation-lists" className="mt-0">
                        <ValidationListSettings />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

export default CustomFieldsPage;
