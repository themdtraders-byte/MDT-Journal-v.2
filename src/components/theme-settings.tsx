

'use client';

import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { useEffect, useState } from 'react';
import { Moon, Sun, RotateCw } from 'lucide-react';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

const ThemeSettings = () => {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleThemeChange = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }

  const handleReset = () => {
    setTheme('dark');
  }

  if (!isMounted) {
    return (
        <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="text-lg">Appearance Mode</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-10 w-24 bg-muted animate-pulse rounded-md"></div>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glassmorphic">
        <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Appearance Mode</CardTitle>
                <CardDescription>
                    Switch between light and dark modes for the application.
                </CardDescription>
              </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="outline" size="sm"><RotateCw className="mr-2 h-4 w-4"/>Reset</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Reset Theme?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will reset the theme to the default dark mode.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </CardHeader>
        <CardContent>
            <Button
                variant="outline"
                onClick={handleThemeChange}
            >
                {theme === 'light' ? <Moon className="h-5 w-5 mr-2" /> : <Sun className="h-5 w-5 mr-2" />}
                Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
            </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThemeSettings;
