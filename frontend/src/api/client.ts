import type { ProfileView, DraftPayload, CheckResult, Job } from '../types';

const BASE = import.meta.env.VITE_API_URL || '/api';
export interface CreateProfileBody {
  name: string;
  proxy: string;
  apps: { name: string; token: string }[];
  accounts: { actId: string; pages: { name: string }[]; pixels: { name: string }[] }[];
}

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${endpoint}`, options);

  if (res.status === 409) {
    return res as unknown as T;  
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const errorMessage = errData.error || errData.message || `Falha na requisição (Status: ${res.status})`;
    throw new ApiError(errorMessage, res.status, errData);
  }

  return res.json();
}

export async function listProfiles(signal?: AbortSignal): Promise<ProfileView[]> {
  const data = await fetchApi<{ profiles: ProfileView[] }>('/profiles', { signal });
  return data.profiles;
}

export async function createProfile(body: CreateProfileBody, signal?: AbortSignal): Promise<void> {
  return fetchApi<void>('/profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal
  });
}

export async function uploadVideo(file: File, signal?: AbortSignal): Promise<{ mediaId: string; name: string }> {
  const form = new FormData();
  form.append('video', file);
  
  return fetchApi<{ mediaId: string; name: string }>('/upload', { 
    method: 'POST', 
    body: form,
    signal 
  });
}

export async function runPreflight(
  payload: DraftPayload,
  sessionId?: string,
  signal?: AbortSignal
): Promise<{ sessionId: string; checks: CheckResult[] }> {
  return fetchApi<{ sessionId: string; checks: CheckResult[] }>('/preflight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload, sessionId }),
    signal
  });
}

export async function submitLaunch(
  payload: DraftPayload,
  idempotencyKey: string,
  signal?: AbortSignal
): Promise<{ job: Job } | { blocked: true; failedChecks: CheckResult[] }> {
  
  const res = await fetch(`${BASE}/submit`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'Idempotency-Key': idempotencyKey 
    },
    body: JSON.stringify({ payload }),
    signal
  });

  if (res.status === 409) {
    const data = await res.json();
    return { blocked: true, failedChecks: data.failedChecks ?? [] };
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new ApiError(errData.error || 'Falha ao simular o envio.', res.status);
  }

  return res.json();
}