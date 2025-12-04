'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Registration failed');
      }

      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push('/transactions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center px-4 py-8">
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

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Get Started
          </h2>
          <p className="text-text-secondary text-sm mb-8">
            Create your account and start managing your budget
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <Input
              type="text"
              name="name"
              label="Full Name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              error={fieldErrors.name}
              disabled={isLoading}
              autoComplete="name"
            />

            <Input
              type="email"
              name="email"
              label="Email Address"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              error={fieldErrors.email}
              disabled={isLoading}
              autoComplete="email"
            />

            <Input
              type="password"
              name="password"
              label="Password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              error={fieldErrors.password}
              disabled={isLoading}
              autoComplete="new-password"
            />

            <Input
              type="password"
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={fieldErrors.confirmPassword}
              disabled={isLoading}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              className="mt-2"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-center text-text-secondary text-sm">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-primary font-semibold hover:text-primary-dark transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
            <p className="text-green-900 dark:text-green-200 text-xs font-semibold mb-2">
              ✓ Safe & Secure
            </p>
            <p className="text-green-800 dark:text-green-300 text-xs">
              Your data is encrypted and protected. You can trust us with your financial information.
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-text-secondary text-xs">
          <p>By creating an account, you agree to our Terms of Service</p>
        </div>
      </div>
    </div>
  );
}
