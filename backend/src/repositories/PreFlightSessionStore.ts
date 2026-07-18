import { PreFlightPayload, CheckResult } from '../usecases/ExecutePreFlightUseCase.js';

export interface PreFlightSession {
  payload: PreFlightPayload;
  results: CheckResult[];
}

export class PreFlightSessionStore {
  private sessions = new Map<string, PreFlightSession>();
  get(id: string): PreFlightSession | undefined {
    return this.sessions.get(id);
  }
  set(id: string, session: PreFlightSession): void {
    this.sessions.set(id, session);
  }
}