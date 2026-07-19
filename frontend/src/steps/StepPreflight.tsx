import { useState } from 'react';
import { useDraft } from '../context/DraftContext';
import { runPreflight, submitLaunch } from '../api/client';
import type { CheckResult, Job } from '../types';

export function StepPreflight() {
    const { draft, setStep, setIdempotencyKey, setPreflightSessionId } = useDraft();
    const { payload } = draft;

    const [checks, setChecks] = useState<CheckResult[]>([]);
    const [running, setRunning] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [job, setJob] = useState<Job | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasRun, setHasRun] = useState(false);
    const blockingChecks = checks.filter((c) => c.isObligatory && !c.passed);
    const gateOpen = hasRun && blockingChecks.length === 0;

    const handlePreflight = async () => {
        setRunning(true);
        setError(null);
        try {
            const result = await runPreflight(payload, draft.preflightSessionId);
            setPreflightSessionId(result.sessionId);   // ← grava no rascunho
            setChecks(result.checks);
            setHasRun(true);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setRunning(false);
        }
    };
    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);
        try {
            let key = draft.idempotencyKey;
            if (!key) {
                key = crypto.randomUUID();
                setIdempotencyKey(key);
            }

            const result = await submitLaunch(payload, key);
            if ('blocked' in result) {
                setChecks(result.failedChecks);
                setError('O envio foi bloqueado pelo servidor: há checks obrigatórios pendentes.');
            } else {
                setJob(result.job);
            }
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-medium text-gray-900">Pré-voo</h2>
                    <p className="text-sm text-gray-500">
                        O servidor confere cada item antes de liberar o envio.
                    </p>
                </div>
                <button
                    onClick={handlePreflight}
                    disabled={running}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:bg-gray-400"
                >
                    {running ? 'Conferindo…' : hasRun ? 'Conferir de novo' : 'Conferir antes de subir'}
                </button>
            </div>

            {checks.length > 0 && (
                <ul className="space-y-2">
                    {checks.map((c) => (
                        <li
                            key={c.id}
                            className={`flex items-start gap-3 border rounded-lg p-3 ${c.passed ? 'border-gray-200' : c.isObligatory ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'
                                }`}
                        >
                            <span className="text-lg leading-none mt-0.5">
                                {c.passed ? '✓' : c.isObligatory ? '✕' : '⚠'}
                            </span>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 text-sm">{c.name}</span>
                                    <span
                                        className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${c.status === 'REUSED'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        {c.status === 'REUSED' ? 'reutilizado' : 'executado'}
                                    </span>
                                    {!c.isObligatory && (
                                        <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                            informativo
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mt-0.5">{c.message}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {hasRun && !job && (
                <div
                    className={`text-sm rounded-lg p-3 ${gateOpen ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                        }`}
                >
                    {gateOpen
                        ? 'Todos os checks obrigatórios passaram. Envio liberado.'
                        : `${blockingChecks.length} pendência(s) obrigatória(s) bloqueando o envio.`}
                </div>
            )}

            {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>}

            {job && (
                <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                    <p className="font-medium text-green-800">Envio simulado com sucesso</p>
                    <p className="text-sm text-green-700 mt-1">
                        Job <strong>{job.jobId}</strong> criado com status <strong>{job.status}</strong>.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                        Reenviar a mesma leva devolve este mesmo job — nenhum objeto é duplicado.
                    </p>
                </div>
            )}

            {/* Navegação + envio */}
            <div className="flex justify-between pt-4 border-t">
                <button onClick={() => setStep(1)} className="text-gray-600 px-4 py-2">
                    Voltar
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!gateOpen || submitting || !!job}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    {submitting ? 'Enviando…' : job ? 'Enviado' : 'Simular envio'}
                </button>
            </div>
        </div>
    );
}