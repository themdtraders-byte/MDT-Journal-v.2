
'use client';

import { Button } from '@/components/ui/button';
import { MdtLogo } from '@/components/mdt-logo';
import { useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingLogo } from '@/components/LoadingLogo';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If the user is already logged in (e.g., page reloaded or auto-signed in),
    // redirect them from here. This is the correct place for side-effects like navigation.
    if (!isUserLoading && user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Let the root page handle redirection after user state is confirmed
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const handleGuestSignIn = () => {
    if (!auth) return;
    initiateAnonymousSignIn(auth);
    // Let the root page handle redirection after user state is confirmed
  };

  // While checking auth state or if user object exists (and useEffect is about to redirect), show loading.
  if (isUserLoading || user) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-black">
            <LoadingLogo />
        </div>
    );
  }

  // Only render the login buttons if we're done loading and there is no user.
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
      <div className="text-center p-8 max-w-md w-full">
        <MdtLogo className="w-64 h-auto mx-auto mb-8" />
        <h1 className="text-2xl font-bold mb-2">Welcome to MD Journal</h1>
        <p className="text-muted-foreground mb-8">
          Sign in to sync your data across devices, or continue as a guest to save data locally.
        </p>
        <div className="space-y-4">
          <Button onClick={handleGoogleSignIn} className="w-full">
            Sign in with Google
          </Button>
          <Button onClick={handleGuestSignIn} variant="secondary" className="w-full">
            Continue as Guest
          </Button>
        </div>
      </div>
    </div>
  );
}
