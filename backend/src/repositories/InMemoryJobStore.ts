import { Job, JobStore } from '../usecases/SubmitUseCase.js';

export class InMemoryJobStore implements JobStore {
    private byKey = new Map<string, Job>();
    async findByKey(key: string): Promise<Job | undefined> {
        return this.byKey.get(key);
    }
    async saveIfAbsent(key: string, job: Job): Promise<Job> {
        const existing = this.byKey.get(key);
        if (existing) return existing;
        this.byKey.set(key, job);
        return job;
    }
}