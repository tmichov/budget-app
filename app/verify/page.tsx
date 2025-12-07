'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/Button';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const [errorEmail, setErrorEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      setStatus('loading');
      setMessage('Verifying your email...');

      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Email verified successfully! Redirecting to login...');
        // Redirect after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to verify email.');
        if (token) {
          setErrorEmail(token);
        }
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred while verifying your email. Please try again.');
      if (token) {
        setErrorEmail(token);
      }
    }
  };

  const handleResendEmail = async () => {
    if (!errorEmail) return;

    try {
      setIsResending(true);

      // First, we need to get the email - for now, we'll ask user to go back
      // In a real scenario, we'd have the email from the initial registration
      router.push('/register?resend=true');
    } catch (error) {
      console.error('Resend error:', error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="bg-card rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-6">
              <Loader size={48} className="text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Verifying Email</h1>
            <p className="text-text-secondary">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-6">
              <CheckCircle size={48} className="text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Email Verified!</h1>
            <p className="text-text-secondary mb-6">{message}</p>
            <Button
              onClick={() => router.push('/login')}
              fullWidth
              className="bg-success hover:bg-success/90"
            >
              Go to Login
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-6">
              <AlertCircle size={48} className="text-danger" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Verification Failed</h1>
            <p className="text-text-secondary mb-6">{message}</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => router.push('/register')}
              >
                Back to Register
              </Button>
              <Button
                fullWidth
                disabled={isResending}
                onClick={handleResendEmail}
              >
                {isResending ? 'Sending...' : 'Resend Email'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader size={48} className="text-primary animate-spin mx-auto mb-4" />
            <p className="text-foreground">Loading verification page...</p>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
