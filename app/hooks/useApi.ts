'use client';

import { useSession } from 'next-auth/react';
import { useCallback } from 'react';

export function useApi() {
  const { data: session } = useSession();

  const request = useCallback(
    async (
      endpoint: string,
      options: RequestInit = {}
    ) => {
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      const headers = new Headers(options.headers || {});
      headers.set('x-user-id', session.user.id);

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
    [session?.user?.id]
  );

  return { request };
}
