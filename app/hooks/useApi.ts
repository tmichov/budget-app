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

      // Handle empty responses (e.g., from DELETE or PATCH requests)
      const contentLength = response.headers.get('content-length');
      if (contentLength === '0' || response.status === 204) {
        return null;
      }

      const text = await response.text();
      if (!text) {
        return null;
      }

      return JSON.parse(text);
    },
    [session?.user?.id]
  );

  return { request };
}
