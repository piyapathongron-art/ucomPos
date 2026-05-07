import type { CurrentUser } from './domain';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  user: CurrentUser;
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: unknown;
}
