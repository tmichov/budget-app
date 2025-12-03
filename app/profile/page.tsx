'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '../components/Button';
import { User as UserIcon } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-6 pb-32">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          Profile
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <UserIcon size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {user.name}
              </h2>
              <p className="text-text-secondary">{user.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="py-4 border-t border-border">
              <p className="text-sm text-text-secondary mb-1">Email Address</p>
              <p className="text-foreground font-medium">{user.email}</p>
            </div>

            <div className="py-4 border-t border-border">
              <p className="text-sm text-text-secondary mb-1">Full Name</p>
              <p className="text-foreground font-medium">{user.name}</p>
            </div>

            <div className="py-4 border-t border-border">
              <p className="text-sm text-text-secondary mb-1">User ID</p>
              <p className="text-foreground font-medium">{user.id}</p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          fullWidth
          onClick={handleLogout}
          className="text-red-600 border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
