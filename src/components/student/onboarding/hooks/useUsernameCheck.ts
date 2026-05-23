"use client";
import { useMutation } from '@tanstack/react-query';
import apiClient from '@/api/client';

interface UsernameCheckResponse {
  available: boolean;
}

interface UsernameCheckApiResponse {
  success: boolean;
  data: UsernameCheckResponse;
}

interface UsernameCheckParams {
  username: string;
  userId?: string;
}

// Use the shared apiClient (axios) instead of bare fetch so:
//   1. The Authorization: Bearer <accessToken> header is attached
//      automatically by the request interceptor. The /api/user/check-username
//      route now requires auth so we can rate-limit per-userId (200/15min)
//      — bare fetch would 401 because it sends no token.
//   2. If the token has expired, the response interceptor refreshes it
//      and retries this request transparently.
export function useUsernameCheck() {
  return useMutation({
    mutationFn: async ({ username, userId }: UsernameCheckParams): Promise<UsernameCheckResponse> => {
      const params = new URLSearchParams({
        username: username.trim(),
        ...(userId && { userId }),
      });

      const response = await apiClient.get<UsernameCheckApiResponse | UsernameCheckResponse>(
        `/api/user/check-username?${params}`
      );

      // apiClient may auto-unwrap to data.data depending on interceptor;
      // accept either shape to stay resilient.
      const payload = response.data as UsernameCheckApiResponse | UsernameCheckResponse;
      if ('data' in payload && payload.data && typeof payload.data === 'object') {
        return payload.data as UsernameCheckResponse;
      }
      return payload as UsernameCheckResponse;
    },
    retry: false, // Don't retry username checks
  });
}
