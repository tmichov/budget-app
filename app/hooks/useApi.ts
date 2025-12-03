import { useAuth } from '@/context/AuthContext';
import { useCallback } from 'react';

export function useApi() {
  const { user } = useAuth();

  const request = useCallback(
    async (
      endpoint: string,
      options: RequestInit = {}
    ) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const headers = new Headers(options.headers || {});
      headers.set('x-user-id', user.id);

      const response = await fetch(endpoint, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Request failed');
      }

      return response.json();
    },
    [user]
  );

  return { request };
}
