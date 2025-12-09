'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push('/transactions');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-xl font-bold text-white">₹</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Budget App</h1>
          </div>
          <p className="text-text-secondary text-sm">Take control of your finances</p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-card-border p-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Welcome Back
          </h2>
          <p className="text-text-secondary text-sm mb-8">
            Sign in to manage your budget
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <Input
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              disabled={isLoading}
              autoComplete="email"
            />

            <Input
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              disabled={isLoading}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              className="mt-2"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-center text-text-secondary text-sm">
              Don't have an account?{' '}
              <Link
                href="/register"
                className="text-primary font-semibold hover:text-primary-dark transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-text-secondary text-xs">
          <p>By signing in, you agree to our Terms of Service</p>
        </div>
      </div>
    </div>
  );
}
