
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * A hook to manage a loading state with a minimum delay.
 * This prevents a "flash" of the loading indicator if data loads very quickly.
 * @param delay The minimum time in milliseconds to show the loading state.
 * @param dependencies An array of dependencies that, when changed, will reset the loading state.
 * @returns An object with the current `isLoading` boolean and a `finishLoading` function to be called when the data is ready.
 */
export const useLoadingState = (delay: number = 200, dependencies: any[] = []) => {
    const [isLoading, setIsLoading] = useState(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // The function to be called by the component when its data has loaded.
    const finishLoading = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        // Set a timeout to ensure the loading state persists for at least the specified delay.
        timeoutRef.current = setTimeout(() => {
            setIsLoading(false);
        }, delay);
    }, [delay]);

    // This effect runs when the component mounts and whenever the dependencies change.
    useEffect(() => {
        // When dependencies change, we are in a new "loading" cycle.
        setIsLoading(true);
        
        // Cleanup function to clear any pending timeout when the component unmounts
        // or when dependencies change again before the timeout completes.
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies); 
    // The dependencies array is correct here, as we want to re-trigger loading when they change.


    return { isLoading, finishLoading };
};

export const useInitialLoading = (delay: number = 500) => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setIsLoading(false);
        }, delay);

        return () => clearTimeout(timeout);
    }, [delay]);

    return isLoading;
};

