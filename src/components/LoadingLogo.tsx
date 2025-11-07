'use client';

import { MdtLogo } from './mdt-logo';

export const LoadingLogo = () => (
    <div className="relative flex flex-col items-center justify-center h-48 w-64 gap-4">
        <div className="animate-inhale-exhale">
            <MdtLogo className="w-48 h-auto"/>
        </div>
    </div>
);
