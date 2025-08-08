'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { verifyEmailAction } from '@/app/actions/auth-actions';

function VerifyContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setAuthData, isAuthenticated, isHydrated } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing');
      return;
    }

    // Use server action instead of direct API call
    verifyEmailAction(token)
      .then((result) => {
        if (result.error) {
          setStatus('error');
          setMessage(result.error);
          return;
        }

        if (result.authResponse) {
          const user = setAuthData(result.authResponse);
          setStatus('success');
          setMessage(`Welcome ${user.email}! Your email has been successfully verified.`);
          // Note: Redirect will be handled by the useEffect that monitors auth state
        } else {
          setStatus('error');
          setMessage('Verification failed - no authentication data received');
        }
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'An error occurred during verification');
      });
  }, [searchParams, router, setAuthData]);

  // Monitor authentication state and redirect when ready
  useEffect(() => {
    if (status === 'success' && isHydrated && isAuthenticated) {
      // Add a small delay to show the success message briefly
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [status, isHydrated, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-lg p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-primary mx-auto mb-6"></div>
              <h1 className="text-2xl font-bold text-foreground mb-4">
                Verifying your email...
              </h1>
              <p className="text-muted-foreground">Please wait while we verify your account.</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-primary/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-4">
                Email Verified Successfully!
              </h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="text-primary text-sm">
                  Redirecting you to your dashboard in a few seconds...
                </p>
              </div>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-destructive/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-6">
                Verification Failed
              </h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <button
                onClick={() => router.push('/')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-lg transition-colors duration-200 w-full"
              >
                Back to Home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-primary"></div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
} 