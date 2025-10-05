import { ApiResponse } from "../../shared/types"
export class ApiError extends Error {
  status: number;
  errorData: any;
  constructor(message: string, status: number, errorData: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorData = errorData;
  }
}
function parseError(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object') {
    if (typeof error.message === 'string') {
      return error.message;
    }
    if (typeof error.error === 'string') {
      return error.error;
    }
  }
  return 'An unknown error occurred. Please try again.';
}
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(path, { ...init, headers });
  if (!res.ok) {
    let errorJson: any;
    try {
      errorJson = await res.json();
    } catch (e) {
      throw new ApiError(res.statusText || 'Server returned a non-JSON error response.', res.status, { code: 'NETWORK_ERROR' });
    }
    const errorMessage = parseError(errorJson.error || errorJson);
    throw new ApiError(errorMessage, res.status, errorJson.error || errorJson);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }
  const json: ApiResponse<T> = await res.json();
  if (json.success === false) {
    const errorMessage = parseError(json.error);
    throw new ApiError(errorMessage, res.status, json.error);
  }
  return json.data as T;
}