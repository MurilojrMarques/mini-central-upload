export interface ProfileView {
  id: string;
  name: string;
  proxyMasked: string;
  apps: { id: string; name: string; tokenMasked: string }[];
  accounts: {
    id: string;
    actId: string;
    pages: { id: string; name: string }[];
    pixels: { id: string; name: string }[];
  }[];
}

export interface DraftPayload {
  profileId?: string;
  appId?: string;
  accountId?: string; 
  pageId?: string;
  pixelId?: string;
  mediaId?: string;
  mediaName?: string;   
  campaignName?: string;
  adSetCount?: number;
  budget?: number;
  link?: string;
  tracking?: string;
}

export interface Draft {
  payload: DraftPayload;
  step: number;              
  idempotencyKey?: string;
  preflightSessionId?: string;  
}

export type CheckStatus = 'EXECUTED' | 'REUSED';

export interface CheckResult {
  id: string;
  name: string;
  status: CheckStatus;
  passed: boolean;
  message: string;
  isObligatory: boolean;
}

export interface Job {
  jobId: string;
  status: 'PAUSED';
  createdAt: string;
}